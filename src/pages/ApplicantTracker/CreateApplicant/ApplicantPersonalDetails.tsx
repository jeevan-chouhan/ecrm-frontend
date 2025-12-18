import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Input, Select, DatePicker, Button, FileUpload, PhoneInput } from "../../../components";
import { COLORS, enrollmentTypes, genderTypes } from "../../../constants";
import type { SelectOption } from "../../../components";

interface PersonalDetailsFormData {
  profilePhoto: File | null;
  enrollmentType: string;
  name: string;
  dateOfBirth: Date | null;
  gender: string;
  countryCode: string;
  contactNumber: string;
  emailId: string;
  permanentAddress: string;
  notes: string;
}

const ApplicantPersonalDetails = () => {
  const { t, i18n } = useTranslation();
  const enrollmentTypeOptions: SelectOption[] = enrollmentTypes;
  const genderOptions: SelectOption[] = genderTypes;

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
        emailId: Yup.string().email(t("validation.invalidEmail")),
        permanentAddress: Yup.string(),
        notes: Yup.string(),
        profilePhoto: Yup.mixed<File | any>(),
      }),
    [t, i18n.language]
  );

  const formik = useFormik<PersonalDetailsFormData>({
    initialValues: {
      profilePhoto: null,
      enrollmentType: "",
      name: "",
      dateOfBirth: null,
      gender: "",
      countryCode: "",
      contactNumber: "",
      emailId: "",
      permanentAddress: "",
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Convert file to base64 if exists
        let profilePhotoBase64: string | null = null;
        if (values.profilePhoto) {
          profilePhotoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("Failed to convert file to base64"));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(values.profilePhoto!);
          });
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

        // TODO: Replace with actual API endpoint
        // const response = await fetch("/api/applicant", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify(payload),
        // });
        // const result = await response.json();
        
        console.log("Payload ready for API:", payload);
        // Backend will receive the payload and handle S3 bucket storage
      } catch (error) {
        console.error("Error saving personal details:", error);
      }
    },
  });

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

  const handleSave = () => {
    formik.handleSubmit();
  };

  const handleSaveAndNext = () => {
    formik.handleSubmit();
    // TODO: Navigate to next tab after successful save
  };

  return (
    <div className="space-y-6">
      {/* Upload Profile Photo Section */}
      <FileUpload
        name="profilePhoto"
        label={t("applicant.uploadProfilePhoto")}
        accept="image/png,image/jpeg,image/jpg"
        supportedFormats="PNG, JPG"
        showPreview={true}
        previewSize="md"
        dismissible={false}
        value={formik.values.profilePhoto}
        onChange={(file) => {
          formik.setFieldValue("profilePhoto", file);
          formik.setFieldTouched("profilePhoto", true);
        }}
        error={formik.touched.profilePhoto && formik.errors.profilePhoto ? formik.errors.profilePhoto : undefined}
      />

      {/* Personal Details Form */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
          {t("applicant.personalDetails")}
        </h2>

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

              <Input
                label={t("applicant.emailId")}
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
            <div className="w-full">
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
              >
                {t("applicant.notes")}
              </label>
              <textarea
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                placeholder={t("applicant.enterNotes")}
                rows={4}
                className="block w-full px-4 py-2.5 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.surface,
                  color: COLORS.textDark,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.borderFocus;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
                }}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
            <Button type="button" variant="accent" onClick={handleSave}>
              {t("applicant.save")}
            </Button>
            <Button type="button" variant="accent" onClick={handleSaveAndNext}>
              {t("applicant.saveAndNext")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicantPersonalDetails;
