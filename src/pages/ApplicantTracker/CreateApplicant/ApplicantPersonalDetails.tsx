import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Input, Select, DatePicker, Button, FileUpload, PhoneInput } from "../../../components";
import { COLORS, enrollmentTypes, genderTypes } from "../../../constants";
import type { SelectOption } from "../../../components";
import type { PersonalDetailsFormData } from "./types";
import { useDataChangeTracking, useFormSync, useFormValidation } from "./hooks";
import { fileToBase64 } from "./utils/fileUtils";
import { applicantService } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

interface ApplicantPersonalDetailsProps {
  initialValues: PersonalDetailsFormData;
  onUpdate: (data: PersonalDetailsFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
  onReset?: () => void;
  applicantId?: number | string | null; // Current applicant ID (for update mode)
  onApplicantIdChange?: (applicantId: number) => void; // Callback when applicantId is created/updated
}

const ApplicantPersonalDetails = ({ 
  initialValues, 
  onUpdate, 
  onSaveAndNext, 
  onBack,
  applicantId,
  onApplicantIdChange,
}: ApplicantPersonalDetailsProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const enrollmentTypeOptions: SelectOption[] = enrollmentTypes;
  const genderOptions: SelectOption[] = genderTypes;
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions

  // Set max date to today to disable future dates for date of birth
  const maxDateOfBirth = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    return today;
  }, []);

  // Validation schema using Yup with i18n messages (memoized to avoid recreation on every render)
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        enrollmentType: Yup.string().required(t("validation.enrollmentTypeRequired")),
        name: Yup.string().required(t("validation.nameRequired")).trim(),
        dateOfBirth: Yup.date().nullable().required(t("validation.dateOfBirthRequired")),
        gender: Yup.string().required(t("validation.genderRequired")),
        countryCode: Yup.string().required(t("validation.countryCodeRequired")),
        contactNumber: Yup.string()
          .required(t("validation.contactNumberRequired"))
          .min(10, t("validation.minLength", { count: 10 })),
        emailId: Yup.string().email(t("validation.invalidEmail")).required(t("validation.emailRequired")),
        permanentAddress: Yup.string().nullable(),
        notes: Yup.string().nullable(),
        profilePhoto: Yup.mixed<File | any>().nullable(),
      }),
    [t, i18n.language]
  );

  // Helper function to format profile photo for API
  const formatProfilePhoto = useCallback(async (file: File | null): Promise<string | null> => {
    if (!file) {
      return null;
    }

    try {
      // Convert file to base64 data URL
      const base64DataUrl = await fileToBase64(file);
      
      // Format as JSON string with accessUrl (base64) and fileName
      const profilePhotoJson = JSON.stringify({
        accessUrl: base64DataUrl, // Backend can process base64 or upload to S3
        fileName: file.name,
      });

      return profilePhotoJson;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error converting file to base64:", error);
      }
      throw error;
    }
  }, []);

  // Format date to YYYY-MM-DD
  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formik = useFormik<PersonalDetailsFormData>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        // Only call API if data has changed since last save
        // This prevents duplicate API calls when clicking Save and then Save & Next with same data
        if (!hasDataChanged) {
          if (import.meta.env.DEV) {
            console.log("No changes detected. Skipping API call.");
          }
          
          // Mark data as saved (in case it wasn't marked before)
          markAsSaved(values);
          
          // Still navigate if needed
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
          return;
        }

        // Format profile photo
        const profilePhotoJson = await formatProfilePhoto(values.profilePhoto);

        // Create payload object matching API requirements
        const payload = {
          name: values.name.trim(),
          profilePhoto: profilePhotoJson,
          enrollmentType: values.enrollmentType,
          dob: formatDate(values.dateOfBirth),
          gender: values.gender,
          email: values.emailId.trim(),
          countryCode: values.countryCode,
          contactNumber: values.contactNumber.trim(),
          permanentAddress: values.permanentAddress?.trim() || null,
          notes: values.notes?.trim() || null,
          assignedAgencyId: user?.agencyId ?? null,
        };

        // Call appropriate API based on whether we have applicantId
        let response;
        if (applicantId) {
          // Update existing personal details
          response = await applicantService.updatePersonalDetails(applicantId, payload);
        } else {
          // Create new personal details
          response = await applicantService.createPersonalDetails(payload);
        }

        if (response.status === "success" && response.data) {
          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: response.message || t("applicant.personalDetailsSaved", "Personal details saved successfully"),
            })
          );

          // Update applicantId if it was created
          const newApplicantId = response.data.applicantId;
          if (newApplicantId && onApplicantIdChange && !applicantId) {
            onApplicantIdChange(newApplicantId);
          }

          // Mark data as saved
          markAsSaved(values);

          // Navigate to next tab if "Save & Next" was clicked
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
        } else {
          throw new Error(response.message || "Failed to save personal details");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save personal details");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    },
  });

  // Use reusable hook for data change tracking (after formik is created)
  const { hasDataChanged, markAsSaved } = useDataChangeTracking<PersonalDetailsFormData>(
    formik.values,
    (lastSaved, current) => {
      if (!lastSaved) return true;
      
      // Compare profilePhoto by name and size instead of reference
      const profilePhotoChanged = 
        (lastSaved.profilePhoto === null && current.profilePhoto !== null) ||
        (lastSaved.profilePhoto !== null && current.profilePhoto === null) ||
        (lastSaved.profilePhoto !== null && current.profilePhoto !== null &&
         (lastSaved.profilePhoto.name !== current.profilePhoto.name ||
          lastSaved.profilePhoto.size !== current.profilePhoto.size));
      
      // Compare dateOfBirth by timestamp instead of reference
      const dateOfBirthChanged = 
        (lastSaved.dateOfBirth === null && current.dateOfBirth !== null) ||
        (lastSaved.dateOfBirth !== null && current.dateOfBirth === null) ||
        (lastSaved.dateOfBirth !== null && current.dateOfBirth !== null &&
         lastSaved.dateOfBirth.getTime() !== current.dateOfBirth.getTime());
      
      return (
        profilePhotoChanged ||
        lastSaved.enrollmentType !== current.enrollmentType ||
        lastSaved.name !== current.name ||
        dateOfBirthChanged ||
        lastSaved.gender !== current.gender ||
        lastSaved.countryCode !== current.countryCode ||
        lastSaved.contactNumber !== current.contactNumber ||
        lastSaved.emailId !== current.emailId ||
        lastSaved.permanentAddress !== current.permanentAddress ||
        lastSaved.notes !== current.notes
      );
    }
  );
  
  // Use reusable hook for form validation
  const { validateAndMarkTouched } = useFormValidation(formik);

  // Check form validity
  useEffect(() => {
    // Check if all mandatory fields are filled
    const hasAllMandatoryFields = 
      formik.values.enrollmentType.trim() !== "" &&
      formik.values.name.trim() !== "" &&
      formik.values.dateOfBirth !== null &&
      formik.values.gender !== "" &&
      formik.values.countryCode !== "" &&
      formik.values.contactNumber.trim() !== "" &&
      formik.values.emailId.trim() !== "";
    
    setIsFormValid(hasAllMandatoryFields);
  }, [formik.values.enrollmentType, formik.values.name, formik.values.dateOfBirth, formik.values.gender, formik.values.countryCode, formik.values.contactNumber, formik.values.emailId]);

  // Sync formik values to parent state with optimized comparison
  useFormSync<PersonalDetailsFormData>(
    formik.values,
    onUpdate,
    (prev, current) => {
      // Compare profilePhoto by name and size instead of reference
      const profilePhotoChanged = 
        (prev.profilePhoto === null && current.profilePhoto !== null) ||
        (prev.profilePhoto !== null && current.profilePhoto === null) ||
        (prev.profilePhoto !== null && current.profilePhoto !== null &&
         (prev.profilePhoto.name !== current.profilePhoto.name ||
          prev.profilePhoto.size !== current.profilePhoto.size));
      
      // Compare dateOfBirth by timestamp instead of reference
      const dateOfBirthChanged = 
        (prev.dateOfBirth === null && current.dateOfBirth !== null) ||
        (prev.dateOfBirth !== null && current.dateOfBirth === null) ||
        (prev.dateOfBirth !== null && current.dateOfBirth !== null &&
         prev.dateOfBirth.getTime() !== current.dateOfBirth.getTime());
      
      return (
        profilePhotoChanged ||
        prev.enrollmentType !== current.enrollmentType ||
        prev.name !== current.name ||
        dateOfBirthChanged ||
        prev.gender !== current.gender ||
        prev.countryCode !== current.countryCode ||
        prev.contactNumber !== current.contactNumber ||
        prev.emailId !== current.emailId ||
        prev.permanentAddress !== current.permanentAddress ||
        prev.notes !== current.notes
      );
    }
  );

  const handlePhoneChange = (phone: string, countryData: any) => {
    // Extract country code from countryData (dialCode is just the number, e.g., "91" for India)
    const dialCode = countryData?.dialCode ? `+${countryData.dialCode}` : "";
    formik.setFieldValue("countryCode", dialCode);
    formik.setFieldValue("contactNumber", phone);
    // Mark countryCode as touched when phone is changed
    if (formik.touched.contactNumber) {
      formik.setFieldTouched("countryCode", true);
    }
  };

  const handleSave = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;
    
    setShouldNavigateNext(false);
    // Validate form before submitting
    const isValid = await validateAndMarkTouched();
    if (isValid) {
      await formik.submitForm();
    } else {
      dispatch(
        addToast({
          type: "error",
          message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
        })
      );
    }
  }, [isSaving, validateAndMarkTouched, formik, dispatch, t]);

  const handleSaveAndNext = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;
    
    // Validate form before submitting
    const isValid = await validateAndMarkTouched();
    if (isValid) {
      setShouldNavigateNext(true);
      await formik.submitForm();
    } else {
      dispatch(
        addToast({
          type: "error",
          message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
        })
      );
    }
  }, [isSaving, validateAndMarkTouched, formik, dispatch, t]);

  return (
    <div className="space-y-6">
      {/* Personal Details Form */}
      <div>
        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            {/* Enrollment Type, Name, and Date of Birth Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.enrollmentType")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Select
                  options={enrollmentTypeOptions}
                  value={formik.values.enrollmentType}
                  onChange={(value) => formik.setFieldValue("enrollmentType", value)}
                  placeholder={t("applicant.selectEnrollmentType")}
                  error={formik.touched.enrollmentType && formik.errors.enrollmentType ? formik.errors.enrollmentType : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.name")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Input
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="name"
                  placeholder={t("applicant.enterName")}
                  error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.dateOfBirth")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <DatePicker
                  value={formik.values.dateOfBirth}
                  onChange={(date) => formik.setFieldValue("dateOfBirth", date)}
                  placeholder={t("applicant.selectDateOfBirth")}
                  error={formik.touched.dateOfBirth && formik.errors.dateOfBirth ? formik.errors.dateOfBirth : undefined}
                  maxDate={maxDateOfBirth}
                  fullWidth
                />
              </div>
            </div>

            {/* Gender, Contact Number, Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.gender")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Select
                  options={genderOptions}
                  value={formik.values.gender}
                  onChange={(value) => formik.setFieldValue("gender", value)}
                  placeholder={t("applicant.selectGender")}
                  error={formik.touched.gender && formik.errors.gender ? formik.errors.gender : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.contactNumber")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <PhoneInput
                  value={formik.values.contactNumber}
                  onChange={handlePhoneChange}
                  placeholder={t("applicant.enterContactNumber")}
                  error={
                    (formik.touched.contactNumber && formik.errors.contactNumber) ||
                    (formik.touched.countryCode && formik.errors.countryCode)
                      ? formik.errors.contactNumber || formik.errors.countryCode
                      : undefined
                  }
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.emailId")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Input
                  type="email"
                  name="emailId"
                  value={formik.values.emailId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={t("applicant.enterEmail")}
                  error={formik.touched.emailId && formik.errors.emailId ? formik.errors.emailId : undefined}
                  fullWidth
                />
              </div>
            </div>

            {/* Address, Notes, and Profile Photo Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Left Side: Address and Notes */}
              <div className="space-y-4 w-full flex flex-col">
                {/* Permanent Address */}
                <Input
                  label={t("applicant.permanentAddress")}
                  name="permanentAddress"
                  value={formik.values.permanentAddress}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={t("applicant.enterAddress")}
                  fullWidth
                />

                {/* Notes */}
                <Input
                  label={t("applicant.notes")}
                  inputType="textarea"
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={t("applicant.enterNotes")}
                  rows={2}
                  fullWidth
                />
              </div>

              {/* Right Side: Profile Photo */}
              <div className="w-full flex flex-col">
                <div className="flex-1">
                  <FileUpload
                    name="profilePhoto"
                    label={t("applicant.uploadProfilePhoto")}
                    accept="image/png,image/jpeg,image/jpg"
                    supportedFormats="PNG, JPG"
                    showPreview={true}
                    previewSize="md"
                    dismissible={false}
                    required={false}
                    value={formik.values.profilePhoto}
                    onChange={(file) => {
                      formik.setFieldValue("profilePhoto", file);
                      formik.setFieldTouched("profilePhoto", true);
                    }}
                    error={formik.touched.profilePhoto && formik.errors.profilePhoto ? formik.errors.profilePhoto : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Responsive */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
            {onBack && (
              <Button type="button" variant="cancel" onClick={onBack} rounded className="w-full sm:w-auto">
                {t("common.back")}
              </Button>
            )}
            <Button 
              type="button" 
              variant="accent" 
              onClick={handleSave} 
              isLoading={isSaving}
              disabled={isSaving}
              rounded 
              className="w-full sm:w-auto"
            >
              {t("applicant.save")}
            </Button>
            <Button 
              type="button" 
              variant="accent" 
              onClick={handleSaveAndNext}
              disabled={(!isFormValid && hasDataChanged) || isSaving}
              isLoading={isSaving}
              rounded
              className="w-full sm:w-auto"
            >
              {t("applicant.saveAndNext")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicantPersonalDetails;
