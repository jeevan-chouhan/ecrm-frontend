import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { Input, Button } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS, ROUTES } from "../../../constants";
import { getResetPasswordSchema } from "../../../utils";

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: getResetPasswordSchema(t),
    onSubmit: (values) => {
      console.log("Password reset:", values);
      // Handle password reset logic here
      navigate(ROUTES.LOGIN);
    },
  });

  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              backgroundColor: COLORS.surface,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Title */}
            <h1
              className="text-xl md:text-2xl font-bold mb-8 text-center"
              style={{ color: COLORS.textDark }}
            >
              {t("auth.resetPassword")}
            </h1>

            <form onSubmit={formik.handleSubmit}>
              <div className="space-y-5">
                <Input
                  label={t("auth.password")}
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password ? formik.errors.password : undefined}
                  fullWidth
                />

                <Input
                  label={t("auth.confirmPassword")}
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

              {/* Save Button */}
              <div className="mt-8">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  fullWidth
                  rounded
                  disabled={!formik.values.password || !formik.values.confirmPassword || Object.keys(formik.errors).length > 0}
                >
                  {t("auth.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ResetPassword;
