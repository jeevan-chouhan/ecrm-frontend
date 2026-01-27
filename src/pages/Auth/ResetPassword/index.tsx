import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { Input, Button } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS, ROUTES, shadows } from "../../../constants";
import { getResetPasswordSchema } from "../../../utils";
import { authService } from "../../../services";
import type { ResetPasswordState } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loader.isLoading);

  // Get email from navigation state (passed from OtpVerification)
  const { email } = (location.state as ResetPasswordState) || {};

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate(ROUTES.FORGOT_PASSWORD);
    }
  }, [email, navigate]);

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: getResetPasswordSchema(t),
    onSubmit: async (values) => {
      if (!email) {
        dispatch(addToast({ type: "error", message: "Email not found" }));
        return;
      }

      dispatch(showLoader());

      try {
        const response = await authService.updatePassword({
          email,
          newPassword: values.password,
          confirmPassword: values.confirmPassword,
        });

        if (response.status === "success") {
          dispatch(
            addToast({
              type: "success",
              message: response.message || "Password updated successfully",
            })
          );

          // Navigate to login
          navigate(ROUTES.LOGIN);
        } else {
          dispatch(
            addToast({
              type: "error",
              message: response.message || "Failed to update password",
            })
          );
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to update password";

        dispatch(addToast({ type: "error", message: errorMessage }));
      } finally {
        dispatch(hideLoader());
      }
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
              boxShadow: shadows.card,
            }}
          >
            {/* Title */}
            <h1
              className="text-xl md:text-2xl font-bold text-center"
              style={{ color: COLORS.textDark }}
            >
              {t("auth.resetPassword")}
            </h1>
            <p
              className="text-sm text-center mt-2 mb-8"
              style={{ color: COLORS.textMuted }}
            >
              {t("auth.resetPasswordSubtitle", "Enter a new password below to change your password")}
            </p>

            <form onSubmit={formik.handleSubmit}>
              <div className="space-y-5">
                <Input
                  label={<>{t("auth.password")} <span style={{ color: COLORS.error }}>*</span></>}
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password ? formik.errors.password : undefined}
                  fullWidth
                  showPasswordToggle
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
                  showPasswordToggle
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
                  isLoading={isLoading}
                  disabled={!formik.values.password || !formik.values.confirmPassword || Object.keys(formik.errors).length > 0}
                >
                  {t("auth.updatePassword", "Update Password")}
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
