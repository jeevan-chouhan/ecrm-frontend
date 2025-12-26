import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { Input, Button } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS, ROUTES } from "../../../constants";
import { getForgotPasswordSchema } from "../../../utils";

interface ForgotPasswordFormValues {
  email: string;
}

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues: {
      email: "",
    },
    validationSchema: getForgotPasswordSchema(t),
    onSubmit: (values) => {
      console.log("Password reset requested for:", values.email);
      // Handle forgot password logic here
      navigate(ROUTES.OTP_VERIFICATION);
    },
  });

  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="w-full max-w-md">
          {/* Title */}
          <h1
            className="text-2xl md:text-3xl font-bold text-center mb-3"
            style={{ color: COLORS.textDark }}
          >
            {t("auth.forgotPassword")}
          </h1>

          {/* Subtitle */}
          <p className="text-center mb-8" style={{ color: COLORS.textMuted }}>
            {t("auth.verificationCodeSent")}
          </p>

          {/* Form Card */}
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              backgroundColor: COLORS.surface,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            <form onSubmit={formik.handleSubmit}>
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

              {/* Submit Button */}
              <div className="mt-8">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  fullWidth
                  rounded
                  disabled={!formik.values.email || !!formik.errors.email}
                >
                  {t("auth.requestPasswordReset")}
                </Button>
              </div>

              {/* Back to Login */}
              <div className="mt-4 text-center">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                  style={{ color: COLORS.primary }}
                >
                  {t("auth.backToLogin")}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ForgotPassword;
