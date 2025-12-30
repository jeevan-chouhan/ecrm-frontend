import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { Input, Button, PhoneInput, Checkbox } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS } from "../../../constants";
import { ROUTES } from "../../../constants";
import { getRegisterSchema } from "../../../utils";

interface RegisterFormValues {
  agencyName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
}

const Register = () => {
  const { t } = useTranslation();

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      agencyName: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      agreeToTerms: false,
    },
    validationSchema: getRegisterSchema(t),
    onSubmit: (values) => {
      console.log("Form submitted:", values);
      // Handle registration logic here
    },
  });

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
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            <form onSubmit={formik.handleSubmit}>
              {/* Form Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <Input
                    label={<>{t("auth.agencyName")} <span style={{ color: COLORS.error }}>*</span></>}
                    placeholder={t("auth.agencyNamePlaceholder")}
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

                  <PhoneInput
                    label={<>{t("auth.contactNumber")} <span style={{ color: COLORS.error }}>*</span></>}
                    value={formik.values.phone}
                    onChange={(value) => formik.setFieldValue("phone", value)}
                    error={formik.touched.phone ? formik.errors.phone : undefined}
                    placeholder={t("auth.contactNumberPlaceholder")}
                    country="in"
                    fullWidth
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <Input
                    label={<>{t("auth.fullName")} <span style={{ color: COLORS.error }}>*</span></>}
                    placeholder={t("auth.fullNamePlaceholder")}
                    name="fullName"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fullName ? formik.errors.fullName : undefined}
                    fullWidth
                  />

                  <Input
                    label={<>{t("auth.password")} <span style={{ color: COLORS.error }}>*</span></>}
                    type="password"
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password ? formik.errors.password : undefined}
                    fullWidth
                  />

                  <Input
                    label={<>{t("auth.confirmPassword")} <span style={{ color: COLORS.error }}>*</span></>}
                    type="password"
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    name="confirmPassword"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
                    fullWidth
                  />
                </div>
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
                  <Link
                    to={ROUTES.TERMS_AND_CONDITIONS}
                    className="font-medium hover:underline"
                    style={{ color: COLORS.accent }}
                  >
                    {t("auth.clickHere")}
                  </Link>
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
                    !formik.values.password ||
                    !formik.values.confirmPassword ||
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
    </PublicLayout>
  );
};

export default Register;
