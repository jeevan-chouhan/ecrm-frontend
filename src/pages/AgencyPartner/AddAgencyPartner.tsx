import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Popup, Button, Input, PhoneInput, Select } from "../../components";
import type { SelectOption } from "../../components/Select/Select";
import { COLORS, typography } from "../../constants";
import { isValidEmail, extractDigits, isValidDecimalInput } from "../../utils/regex";
import { agencyService } from "../../services";
import type { AddAgencyPartnerPayload } from "../../services";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../utils";

// Form data interface
interface FormData {
  name: string;
  contactPerson: string;
  email: string;
  contactNo: string;
  commissionPercentage: string;
  description: string;
}

// Form errors interface
interface FormErrors {
  name?: string;
  contactPerson?: string;
  email?: string;
  contactNo?: string;
  commissionPercentage?: string;
}

// Agency Partner data for editing
export interface AgencyPartnerFormData {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  contactNo: string;
  commissionPercentage: string;
  description: string;
}

interface AddAgencyPartnerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPartner?: AgencyPartnerFormData | null;
}

const INITIAL_FORM_STATE: FormData = {
  name: "",
  contactPerson: "",
  email: "",
  contactNo: "",
  commissionPercentage: "",
  description: "",
};

// Parse phone value to extract country code and number
const parsePhoneValue = (phoneValue: string): { countryCode: string; contactNumber: string } => {
  if (phoneValue.startsWith("+")) {
    const parts = phoneValue.split(" ");
    if (parts.length >= 2) {
      return {
        countryCode: parts[0],
        contactNumber: extractDigits(parts.slice(1).join("")),
      };
    }
  }
  return { countryCode: "+91", contactNumber: extractDigits(phoneValue) };
};

const AddAgencyPartner = ({ isOpen, onClose, onSuccess, editingPartner }: AddAgencyPartnerProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // State
  const [partnerNameOptions, setPartnerNameOptions] = useState<SelectOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const hasFetchedOptionsRef = useRef(false);

  // Computed values
  const isEditMode = !!editingPartner;

  // Memoized required label component
  const RequiredMark = useMemo(() => <span style={{ color: COLORS.error }}>*</span>, []);

  // Fetch partner names on open
  useEffect(() => {
    if (!isOpen || hasFetchedOptionsRef.current) return;

    const fetchPartnerNames = async () => {
      hasFetchedOptionsRef.current = true;
      setIsLoadingOptions(true);

      try {
        const response = await agencyService.getAgencyPartnerNames();
        if (Array.isArray(response)) {
          setPartnerNameOptions(response.map((item) => ({ value: item.name, label: item.name })));
        }
      } catch (error) {
        hasFetchedOptionsRef.current = false;
        const { message } = handleApiError(error, "Failed to fetch partner names");
        dispatch(addToast({ type: "error", message }));
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchPartnerNames();
  }, [isOpen, dispatch]);

  // Pre-populate form when editing
  useEffect(() => {
    if (!isOpen) return;

    if (editingPartner) {
      setFormData({
        name: editingPartner.name,
        contactPerson: editingPartner.contactPerson,
        email: editingPartner.email,
        contactNo: editingPartner.contactNo,
        commissionPercentage: editingPartner.commissionPercentage,
        description: editingPartner.description,
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [isOpen, editingPartner]);

  // Handle input change
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => (prev[field as keyof FormErrors] ? { ...prev, [field]: undefined } : prev));
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = t("validation.required", "This field is required");
    }

    if (!formData.contactPerson.trim()) {
      errors.contactPerson = t("validation.required", "This field is required");
    }

    if (!formData.email.trim()) {
      errors.email = t("validation.required", "This field is required");
    } else if (!isValidEmail(formData.email)) {
      errors.email = t("validation.invalidEmail", "Please enter a valid email address");
    }

    const phoneDigits = extractDigits(formData.contactNo);
    if (!phoneDigits || phoneDigits.length < 10) {
      errors.contactNo = t("validation.invalidPhone", "Please enter a valid contact number");
    }

    if (!formData.commissionPercentage.trim()) {
      errors.commissionPercentage = t("validation.required", "This field is required");
    } else {
      const commission = parseFloat(formData.commissionPercentage);
      if (isNaN(commission) || commission < 0 || commission > 100) {
        errors.commissionPercentage = t("validation.invalidCommission", "Commission must be between 0 and 100");
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  // Handle close popup
  const handleClose = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    onClose();
  }, [onClose]);

  // Handle form submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const trimmedData = {
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      contactNo: formData.contactNo,
      commissionPercentage: formData.commissionPercentage,
      description: formData.description.trim(),
    };

    if (!user?.agencyId) {
      dispatch(addToast({ type: "error", message: "Agency ID not found" }));
      return;
    }

    setIsSubmitting(true);
    dispatch(showLoader());

    try {
      const { countryCode, contactNumber } = parsePhoneValue(formData.contactNo);

      const payload: AddAgencyPartnerPayload = {
        agencyId: user.agencyId,
        name: trimmedData.name,
        contactPerson: trimmedData.contactPerson,
        countryCode,
        contactNumber,
        email: trimmedData.email,
        commissionPercentage: parseFloat(trimmedData.commissionPercentage),
        description: trimmedData.description || undefined,
      };

      // Edit mode - call update API
      if (isEditMode && editingPartner) {
        const response = await agencyService.updateAgencyPartner(editingPartner.id, payload);

        if (response.status === "success" && response.data) {
          dispatch(addToast({ type: "success", message: t("agencyPartner.updateSuccess", "Agency Partner updated successfully") }));
          onSuccess();
          handleClose();
        } else {
          throw new Error(response.message || "Failed to update agency partner");
        }
        return;
      }

      // Add mode - call add API
      const response = await agencyService.addAgencyPartner(payload);

      if (response.status === "success" && response.data) {
        dispatch(addToast({ type: "success", message: t("agencyPartner.addSuccess", "Agency Partner added successfully") }));
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.message || "Failed to add agency partner");
      }
    } catch (error) {
      const { message } = handleApiError(error, isEditMode ? "Failed to update agency partner" : "Failed to add agency partner");
      dispatch(addToast({ type: "error", message }));
    } finally {
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  }, [validateForm, formData, isEditMode, editingPartner, user?.agencyId, dispatch, t, onSuccess, handleClose]);

  // Commission input handlers
  const handleCommissionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isValidDecimalInput(value)) {
      handleInputChange("commissionPercentage", value);
    }
  }, [handleInputChange]);

  const handleCommissionKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  }, []);

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? t("agencyPartner.editAgencyPartner", "Edit Agency Partner") : t("agencyPartner.addAgencyPartner", "Add Agency Partner")}
      size="full"
    >
      <div className="space-y-4">
        {/* Row 1: Agency Partner Name, Contact Person */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={<>{t("agencyPartner.agencyPartnerName", "Agency Partner Name")} {RequiredMark}</>}
            placeholder={isLoadingOptions ? t("common.loading", "Loading...") : t("agencyPartner.selectAgencyPartnerName", "Select Agency Partner Name")}
            options={partnerNameOptions}
            value={formData.name}
            onChange={(value) => handleInputChange("name", value)}
            error={formErrors.name}
            disabled={isLoadingOptions}
            fullWidth
          />
          <Input
            label={<>{t("agencyPartner.contactPersonLabel", "Contact Person")} {RequiredMark}</>}
            placeholder={t("agencyPartner.enterContactPerson", "Enter Contact Person Name")}
            value={formData.contactPerson}
            onChange={(e) => handleInputChange("contactPerson", e.target.value)}
            error={formErrors.contactPerson}
            fullWidth
          />
        </div>

        {/* Row 2: Email, Contact Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={<>{t("agencyPartner.emailLabel", "Email")} {RequiredMark}</>}
            type="email"
            placeholder={t("agencyPartner.enterEmail", "Enter Email Address")}
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={formErrors.email}
            fullWidth
          />
          <PhoneInput
            label={<>{t("agencyPartner.contactNumber", "Contact Number")} {RequiredMark}</>}
            placeholder={t("agencyPartner.enterPhoneNumber", "Enter Phone Number")}
            value={formData.contactNo}
            onChange={(value) => handleInputChange("contactNo", value)}
            error={formErrors.contactNo}
            country="in"
            fullWidth
          />
        </div>

        {/* Row 3: Commission Percentage, Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={<>{t("agencyPartner.commissionPercentageLabel", "Commission Percentage")} {RequiredMark}</>}
            type="number"
            placeholder={t("agencyPartner.enterCommission", "Enter Commission")}
            value={formData.commissionPercentage}
            onChange={handleCommissionChange}
            onKeyDown={handleCommissionKeyDown}
            min="0"
            max="100"
            step="0.01"
            error={formErrors.commissionPercentage}
            rightIcon={<span style={{ color: COLORS.textMuted, fontWeight: typography.fontWeight.medium }}>%</span>}
            fullWidth
          />
          <Input
            inputType="textarea"
            label={t("agencyPartner.descriptionLabel", "Description")}
            placeholder={t("agencyPartner.descriptionPlaceholder", "Description Of Agency")}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
            fullWidth
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="cancel" size="md" rounded onClick={handleClose} disabled={isSubmitting}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button variant="accent" size="md" rounded onClick={handleSubmit} disabled={isSubmitting}>
            {isEditMode ? t("agencyPartner.updateAgency", "Update") : t("agencyPartner.submitAgency", "Submit")}
          </Button>
        </div>
      </div>
    </Popup>
  );
};

export default AddAgencyPartner;
