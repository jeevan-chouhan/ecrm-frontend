import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input, Button, PhoneInput, Checkbox, Popup, FileUpload } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS, ROUTES, termsAndConditions, shadows } from "../../../constants";
import { userService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

interface RegisterFormValues {
  agencyName: string;
  fullName: string;
  email: string;
  phone: string;
  logo: File | null;
  agreeToTerms: boolean;
}

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isTermsPopupOpen, setIsTermsPopupOpen] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    agencyName: Yup.string()
      .required(t("validation.agencyNameRequired", "Agency name is required"))
      .min(2, t("validation.agencyNameMin", "Agency name must be at least 2 characters")),
    fullName: Yup.string()
      .required(t("validation.fullNameRequired", "Full name is required"))
      .min(2, t("validation.fullNameMin", "Full name must be at least 2 characters")),
    email: Yup.string()
      .required(t("validation.emailRequired", "Email is required"))
      .email(t("validation.emailInvalid", "Invalid email address")),
    phone: Yup.string()
      .required(t("validation.phoneRequired", "Contact number is required")),
    agreeToTerms: Yup.boolean()
      .oneOf([true], t("validation.agreeToTermsRequired", "You must agree to the terms and conditions")),
  });

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      agencyName: "",
      fullName: "",
      email: "",
      phone: "",
      logo: null,
      agreeToTerms: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      dispatch(showLoader());
      try {
        const response = await userService.registerAgency({
          agencyName: values.agencyName,
          fullName: values.fullName,
          email: values.email,
          contactNumber: values.phone,
          logo: values.logo,
        }) as { status: string; statusCode: number; message: string; data: unknown };
        
        dispatch(addToast({
          type: "success",
          message: response.message || t("auth.registrationSuccess", "Agency registered successfully."),
        }));
        
        // Navigate to login page after successful registration
        navigate(ROUTES.PRICING);
      } catch (error) {
        console.error("Registration error:", error);
        const errorResponse = handleApiError(error);
        dispatch(addToast({
          type: "error",
          message: errorResponse.message || t("auth.registrationFailed", "Registration failed. Please try again."),
        }));
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  const handleLogoChange = (file: File | File[] | null) => {
    if (file) {
      // If array, take first file; otherwise use the file directly
      const singleFile = Array.isArray(file) ? file[0] : file;
      formik.setFieldValue("logo", singleFile);
    } else {
      formik.setFieldValue("logo", null);
    }
  };

  const handleLogoRemove = () => {
    formik.setFieldValue("logo", null);
  };

  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="w-full max-w-4xl">
          {/* Title */}
          <h1
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: COLORS.textDark }}
          >
            {t("auth.registerAgency")}
          </h1>

          {/* Form Card */}
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              backgroundColor: COLORS.surface,
              boxShadow: shadows.card,
            }}
          >
            <form onSubmit={formik.handleSubmit}>
              {/* Form Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <Input
                    label={<>{t("auth.agencyName")} <span style={{ color: COLORS.error }}>*</span></>}
                    placeholder={t("auth.enterAgencyName")}
                    name="agencyName"
                    value={formik.values.agencyName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.agencyName ? formik.errors.agencyName : undefined}
                    fullWidth
                  />

                  <Input
                    label={<>{t("auth.email")} <span style={{ color: COLORS.error }}>*</span></>}
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email ? formik.errors.email : undefined}
                    fullWidth
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <Input
                    label={<>{t("auth.fullName")} <span style={{ color: COLORS.error }}>*</span></>}
                    placeholder={t("auth.enterFullName")}
                    name="fullName"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fullName ? formik.errors.fullName : undefined}
                    fullWidth
                  />

                  <PhoneInput
                    label={<>{t("auth.contactNumber")} <span style={{ color: COLORS.error }}>*</span></>}
                    value={formik.values.phone}
                    onChange={(value) => formik.setFieldValue("phone", value)}
                    error={formik.touched.phone ? formik.errors.phone : undefined}
                    placeholder={t("auth.contactNumberPlaceholder")}
                    fullWidth
                  />
                </div>
              </div>

              {/* Upload Logo - Full Width */}
              <div className="mt-6">
                <FileUpload
                  label={t("auth.uploadLogo")}
                  value={formik.values.logo}
                  onChange={handleLogoChange}
                  onRemove={handleLogoRemove}
                  accept="image/*"
                  maxSizeMB={2}
                  showPreview
                  multiple={false}
                  supportedFormats="PNG, JPG, JPEG"
                  dismissible={false}
                />
              </div>

              {/* Footer Section */}
              <div className="mt-8 flex flex-col items-center">
                {/* Already have account */}
                <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                  {t("auth.alreadyHaveAccount")}{" "}
                  <Link
                    to={ROUTES.LOGIN}
                    className="font-medium hover:underline"
                    style={{ color: COLORS.accent }}
                  >
                    {t("auth.login")}
                  </Link>
                </p>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-2 mb-2">
                  <Checkbox
                    checked={formik.values.agreeToTerms}
                    onChange={(checked) => formik.setFieldValue("agreeToTerms", checked)}
                  />
                  <span className="text-sm" style={{ color: COLORS.textDark }}>
                    <span style={{ color: COLORS.error }}>*</span>
                    {t("auth.agreeToTerms")}
                  </span>
                </div>
                {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
                  <p className="text-sm mb-2" style={{ color: COLORS.error }}>
                    {formik.errors.agreeToTerms}
                  </p>
                )}

                {/* Terms Link */}
                <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
                  {t("auth.readTerms")}{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsPopupOpen(true)}
                    className="font-medium hover:underline"
                    style={{ color: COLORS.accent }}
                  >
                    {t("auth.clickHere")}
                  </button>
                </p>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  rounded
                  disabled={
                    !formik.values.agencyName ||
                    !formik.values.fullName ||
                    !formik.values.email ||
                    !formik.values.phone ||
                    !formik.values.agreeToTerms ||
                    Object.keys(formik.errors).length > 0
                  }
                >
                  {t("auth.register").toUpperCase()}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Popup */}
      <Popup
        isOpen={isTermsPopupOpen}
        onClose={() => setIsTermsPopupOpen(false)}
        title={t("auth.termsAndConditions")}
        size="lg"
        showCloseButton
      >
        <div>
          <p
            className="text-xs mb-4"
            style={{ color: COLORS.textMuted }}
          >
            {t("auth.lastUpdated")}: 10 Jul 2025
          </p>
          <div className="space-y-4">
            {termsAndConditions.map((section, index) => (
              <div key={index}>
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: COLORS.textDark }}
                >
                  {section.title}
                </h3>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: COLORS.textMuted }}
                >
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            variant="accent"
            rounded
            onClick={() => setIsTermsPopupOpen(false)}
          >
            {t("common.close")}
          </Button>
        </div>
      </Popup>
    </PublicLayout>
  );
};

export default Register;
