import { useTranslation } from "react-i18next";
import type { FormikProps } from "formik";
import { Popup, Input, Button } from "../../components";

const RequiredAsterisk = () => <span style={{ color: "#DC2626" }}> *</span>;

export interface RaiseQueryFormValues {
  subject: string;
  content: string;
}

export interface RaiseQueryProps {
  isOpen: boolean;
  onClose: () => void;
  formik: FormikProps<RaiseQueryFormValues>;
}

const RaiseQuery = ({ isOpen, onClose, formik }: RaiseQueryProps) => {
  const { t } = useTranslation();

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={t("supportFeedback.raiseQuery", "Raise Query")}
      size="xl"
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input
          label={<>{t("supportFeedback.subject", "Subject")}<RequiredAsterisk /></>}
          name="subject"
          placeholder={t("supportFeedback.enterSubject", "Enter subject")}
          value={formik.values.subject}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.subject && formik.errors.subject ? formik.errors.subject : undefined}
          fullWidth
        />

        <Input
          inputType="textarea"
          label={<>{t("supportFeedback.content", "Content")}<RequiredAsterisk /></>}
          name="content"
          placeholder={t("supportFeedback.enterContent", "Enter your query details...")}
          value={formik.values.content}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.content && formik.errors.content ? formik.errors.content : undefined}
          rows={4}
          fullWidth
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="cancel"
            rounded
            onClick={onClose}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="submit"
            variant="accent"
            rounded
            disabled={formik.isSubmitting}
          >
            {t("common.submit", "Submit")}
          </Button>
        </div>
      </form>
    </Popup>
  );
};

export default RaiseQuery;
