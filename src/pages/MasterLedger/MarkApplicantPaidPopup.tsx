import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Popup, Button, Input, DatePicker } from "../../components";
import { COLORS, typography } from "../../constants";

interface MarkApplicantPaidPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionId: string, paymentDate: Date | null, amount: string) => void;
  applicantName?: string;
}

interface MarkApplicantPaidFormValues {
  transactionId: string;
  paymentDate: Date | null;
  amount: string;
}

const MarkApplicantPaidPopup = ({
  isOpen,
  onClose,
  onConfirm,
  applicantName: _applicantName,
}: MarkApplicantPaidPopupProps) => {
  const { t } = useTranslation();

  // Validation schema using Yup
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        transactionId: Yup.string()
          .required(t("masterLedger.transactionIdRequired", "Transaction ID Is Required"))
          .trim(),
        paymentDate: Yup.date()
          .nullable()
          .required(t("masterLedger.paymentDateRequired", "Payment Date Is Required")),
        amount: Yup.string()
          .required(t("masterLedger.amountRequired", "Amount Is Required"))
          .test(
            "is-valid-amount",
            t("masterLedger.amountInvalid", "Please Enter A Valid Amount"),
            (value) => {
              if (!value || !value.trim()) return false;
              const amountValue = parseFloat(value);
              return !isNaN(amountValue) && amountValue > 0;
            }
          ),
      }),
    [t]
  );

  // Formik form
  const formik = useFormik<MarkApplicantPaidFormValues>({
    initialValues: {
      transactionId: "",
      paymentDate: null,
      amount: "",
    },
    validationSchema,
    onSubmit: (values) => {
      onConfirm(values.transactionId.trim(), values.paymentDate, values.amount.trim());
      formik.resetForm();
      onClose();
    },
  });

  // Reset form when popup closes
  const handleClose = useCallback(() => {
    formik.resetForm();
    onClose();
  }, [formik, onClose]);

  // Handle amount change with validation (only allow numbers and decimal)
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Allow only numbers and decimal point
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        formik.setFieldValue("amount", value);
      }
    },
    [formik]
  );

  // Max date for payment date (today)
  const maxPaymentDate = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }, []);

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={t("masterLedger.markApplicantPaid", "Mark Applicant Paid")}
      size="md"
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Warning Message */}
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: `${COLORS.error}10`,
            border: `1px solid ${COLORS.error}30`,
          }}
        >
          <p
            style={{
              color: COLORS.error,
              fontSize: typography.fontSize.small,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            {t(
              "masterLedger.paymentWarning",
              "You Are Paying At Your Own Risk In Advance."
            )}
          </p>
        </div>

        {/* Transaction ID Field */}
        <div>
          <Input
            label={t("masterLedger.transactionId", "Transaction ID")}
            placeholder={t(
              "masterLedger.enterTransactionId",
              "Enter Transaction ID"
            )}
            name="transactionId"
            value={formik.values.transactionId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.transactionId && formik.errors.transactionId
                ? formik.errors.transactionId
                : undefined
            }
            fullWidth
          />
        </div>

        {/* Payment Date Field */}
        <div>
          <DatePicker
            label={t("masterLedger.paymentDate", "Payment Date")}
            placeholder={t("masterLedger.selectPaymentDate", "Select Payment Date")}
            value={formik.values.paymentDate}
            onChange={(date) => formik.setFieldValue("paymentDate", date)}
            error={
              formik.touched.paymentDate && formik.errors.paymentDate
                ? formik.errors.paymentDate
                : undefined
            }
            maxDate={maxPaymentDate}
            fullWidth
          />
        </div>

        {/* Amount Field */}
        <div>
          <Input
            label={t("masterLedger.amount", "Amount")}
            type="text"
            placeholder={t("masterLedger.enterAmount", "Enter Amount")}
            name="amount"
            value={formik.values.amount}
            onChange={handleAmountChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.amount && formik.errors.amount
                ? formik.errors.amount
                : undefined
            }
            fullWidth
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="cancel"
            size="md"
            rounded
            onClick={handleClose}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="submit"
            variant="accent"
            size="md"
            rounded
            disabled={formik.isSubmitting}
          >
            {t("common.confirm", "Confirm")}
          </Button>
        </div>
      </form>
    </Popup>
  );
};

export default MarkApplicantPaidPopup;

