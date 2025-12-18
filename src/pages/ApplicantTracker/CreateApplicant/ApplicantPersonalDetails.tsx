import { useFormik } from "formik";
import * as Yup from "yup";
import { Input, Select, DatePicker, Button, FileUpload, CountryCodeSelect } from "../../../components";
import { colors } from "../../../constants";
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

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  enrollmentType: Yup.string().required("Enrollment Type is required"),
  name: Yup.string().required("Name is required").trim(),
  dateOfBirth: Yup.date().nullable().required("Date of Birth is required"),
  gender: Yup.string().required("Gender is required"),
  countryCode: Yup.string().required("Country Code is required"),
  contactNumber: Yup.string().required("Contact Number is required").trim(),
  emailId: Yup.string().email("Please enter a valid email address"),
  permanentAddress: Yup.string(),
  notes: Yup.string(),
  profilePhoto: Yup.mixed<File | any>(),
});

const ApplicantPersonalDetails = () => {
  const enrollmentTypeOptions: SelectOption[] = [
    { value: "walk-in", label: "Walk-in" },
    { value: "referred-to-agency", label: "Referred to Agency Partner" },
    { value: "referred-by-agency", label: "Referred by Agency Partner" },
  ];

  const genderOptions: SelectOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

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
    onSubmit: (values) => {
      // TODO: Implement save API call
      console.log("Saving personal details:", values);
    },
  });

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
        label="Upload profile photo"
        value={formik.values.profilePhoto}
        onChange={(file) => formik.setFieldValue("profilePhoto", file)}
        accept="image/png,image/jpeg,image/jpg"
        supportedFormats="PNG, JPG"
        showPreview={true}
        previewSize="md"
        dismissible={true}
      />

      {/* Personal Details Form */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: colors.textDark }}>
          Personal Details
        </h2>

        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            {/* Enrollment Type, Name, and Date of Birth Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  Enrollment Type <span style={{ color: colors.error }}>*</span>
                </label>
                <Select
                  options={enrollmentTypeOptions}
                  value={formik.values.enrollmentType}
                  onChange={(value) => formik.setFieldValue("enrollmentType", value)}
                  placeholder="Select enrollment type"
                  error={formik.touched.enrollmentType && formik.errors.enrollmentType ? formik.errors.enrollmentType : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  Name <span style={{ color: colors.error }}>*</span>
                </label>
                <Input
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="name"
                  placeholder="Enter name"
                  error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  Date of Birth <span style={{ color: colors.error }}>*</span>
                </label>
                <DatePicker
                  value={formik.values.dateOfBirth}
                  onChange={(date) => formik.setFieldValue("dateOfBirth", date)}
                  placeholder="Select date of birth"
                  error={formik.touched.dateOfBirth && formik.errors.dateOfBirth ? formik.errors.dateOfBirth : undefined}
                  fullWidth
                />
              </div>
            </div>

            {/* Gender, Country Code + Contact Number, Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  Gender <span style={{ color: colors.error }}>*</span>
                </label>
                <Select
                  options={genderOptions}
                  value={formik.values.gender}
                  onChange={(value) => formik.setFieldValue("gender", value)}
                  placeholder="Select gender"
                  error={formik.touched.gender && formik.errors.gender ? formik.errors.gender : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  Contact Number <span style={{ color: colors.error }}>*</span>
                </label>
                <div className="flex gap-2">
                  <div style={{ width: "140px", flexShrink: 0 }}>
                    <CountryCodeSelect
                      value={formik.values.countryCode}
                      onChange={(value) => formik.setFieldValue("countryCode", value)}
                      placeholder="Code"
                      error={formik.touched.countryCode && formik.errors.countryCode ? formik.errors.countryCode : undefined}
                      fullWidth
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={formik.values.contactNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      name="contactNumber"
                      placeholder="Enter phone number"
                      error={formik.touched.contactNumber && formik.errors.contactNumber ? formik.errors.contactNumber : undefined}
                      fullWidth
                    />
                  </div>
                </div>
              </div>

              <Input
                label="Email ID"
                type="email"
                name="emailId"
                value={formik.values.emailId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter email"
                error={formik.touched.emailId && formik.errors.emailId ? formik.errors.emailId : undefined}
                fullWidth
              />
            </div>

            {/* Permanent Address */}
            <Input
              label="Permanent/Postal Address"
              name="permanentAddress"
              value={formik.values.permanentAddress}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter address"
              fullWidth
            />

            {/* Notes */}
            <div className="w-full">
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
              >
                Notes
              </label>
              <textarea
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter notes"
                rows={4}
                className="block w-full px-4 py-2.5 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: colors.textDark,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.borderFocus;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: colors.border }}>
            <Button type="button" variant="primary" onClick={handleSave}>
              SAVE
            </Button>
            <Button type="button" variant="primary" onClick={handleSaveAndNext}>
              SAVE & NEXT
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicantPersonalDetails;
