import { useMemo, useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Input, Select, DatePicker, Button, FileUpload, PhoneInput } from "../../../components";
import { COLORS, enrollmentTypes, genderTypes } from "../../../constants";
import type { SelectOption } from "../../../components";
import type { PersonalDetailsFormData } from "./types";
import { useDataChangeTracking, useFormSync, useFormValidation } from "./hooks";
import { fileToBase64 } from "./utils/fileUtils";

interface ApplicantPersonalDetailsProps {
  initialValues: PersonalDetailsFormData;
  onUpdate: (data: PersonalDetailsFormData) => void;
  onSaveAndNext?: () => void;
  onReset?: () => void;
}

const ApplicantPersonalDetails = ({ initialValues, onUpdate, onSaveAndNext }: ApplicantPersonalDetailsProps) => {
  const { t, i18n } = useTranslation();
  const enrollmentTypeOptions: SelectOption[] = enrollmentTypes;
  const genderOptions: SelectOption[] = genderTypes;
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

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

  const formik = useFormik<PersonalDetailsFormData>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Convert file to base64 if exists (for future API call)
        let profilePhotoBase64: string | null = null;
        if (values.profilePhoto) {
          profilePhotoBase64 = await fileToBase64(values.profilePhoto);
        }

        // Create payload object
        const payload = {
          profilePhoto: profilePhotoBase64,
          enrollmentType: values.enrollmentType,
          name: values.name,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
          gender: values.gender,
          countryCode: values.countryCode,
          contactNumber: values.contactNumber,
          emailId: values.emailId || null,
          permanentAddress: values.permanentAddress || null,
          notes: values.notes || null,
        };

        // TODO: Replace with actual API call when backend is ready
        // const response = await fetch("/api/applicant/personal-details", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify(payload),
        // });
        // if (!response.ok) {
        //   throw new Error("Failed to save personal details");
        // }
        // const result = await response.json();

        // Only call API if data has changed since last save
        if (hasDataChanged) {
          // For now, just log the payload
          console.log("Personal details payload ready for API:", payload);
          console.log("API endpoint: POST /api/applicant/personal-details");
          
          // Mark data as saved
          markAsSaved(values);
        } else {
          console.log("No changes detected. Skipping API call.");
        }

        // Data is already synced to parent state via useEffect
        // Navigate to next tab if "Save & Next" was clicked (don't reset form)
        if (shouldNavigateNext && onSaveAndNext) {
          // Navigate to next tab - form data remains in state
          onSaveAndNext();
          setShouldNavigateNext(false);
        } else {
          // For "Save" button, just log - form data remains
          console.log("Form data saved and synced to state (form not reset)");
        }
      } catch (error) {
        console.error("Error saving personal details:", error);
        // You might want to show an error message to the user here
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

  const handleSave = async () => {
    setShouldNavigateNext(false);
    // Validate form before submitting
    const isValid = await validateAndMarkTouched();
    if (isValid) {
      await formik.submitForm();
    }
  };

  const handleSaveAndNext = async () => {
    // Validate form before submitting
    const isValid = await validateAndMarkTouched();
    if (isValid) {
      setShouldNavigateNext(true);
      await formik.submitForm();
    } else {
      console.log("Form validation failed. Please fill all required fields.");
    }
  };

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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  {t("applicant.dateOfBirth")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <DatePicker
                  value={formik.values.dateOfBirth}
                  onChange={(date) => formik.setFieldValue("dateOfBirth", date)}
                  placeholder={t("applicant.selectDateOfBirth")}
                  error={formik.touched.dateOfBirth && formik.errors.dateOfBirth ? formik.errors.dateOfBirth : undefined}
                  maxDate={new Date()} // Disable future dates
                  fullWidth
                />
              </div>
            </div>

            {/* Gender, Contact Number, Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  {t("applicant.contactNumber")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <PhoneInput
                  value={formik.values.contactNumber}
                  onChange={handlePhoneChange}
                  placeholder={t("applicant.enterPhoneNumber")}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
            <Button type="button" variant="accent" onClick={handleSave} rounded>
              {t("applicant.save")}
            </Button>
            <Button 
              type="button" 
              variant="accent" 
              onClick={handleSaveAndNext}
              disabled={!isFormValid}
              rounded
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
