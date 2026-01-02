import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { Input, Button, Checkbox } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS, ROUTES } from "../../../constants";
import { getLoginSchema } from "../../../utils";
import { useAuth } from "../../../context";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";

// Type for location state from ProtectedRoute
interface LocationState {
  from?: {
    pathname: string;
  };
}

// Constants for localStorage keys
const REMEMBER_EMAIL_KEY = "rememberedEmail";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { login } = useAuth();
  const isLoading = useAppSelector((state) => state.loader.isLoading);

  // Get the URL user was trying to access before being redirected to login
  const from = (location.state as LocationState)?.from?.pathname || ROUTES.DASHBOARD;

  // Check for remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (rememberedEmail) {
      formik.setFieldValue("email", rememberedEmail);
      formik.setFieldValue("rememberMe", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validationSchema: getLoginSchema(t),
    onSubmit: async (values) => {
      dispatch(showLoader());
      
      try {
        // Call login from AuthContext
        const response = await login({
          email: values.email,
          password: values.password,
        });

        if (response.status === "success" && response.data) {
          // Handle remember me functionality
          if (values.rememberMe) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, values.email);
          } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
          }

          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: response.message || t("auth.loginSuccess"),
            })
          );

          // Navigate to the originally requested URL or dashboard
          navigate(from, { replace: true });
        } else {
          // Show error toast for non-success response
          dispatch(
            addToast({
              type: "error",
              message: response.message || t("auth.loginError"),
            })
          );
        }
      } catch (error: any) {
        // Handle API errors
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          t("auth.loginError");

        dispatch(
          addToast({
            type: "error",
            message: errorMessage,
          })
        );
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
          {/* Title */}
          <h1
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: COLORS.textDark }}
          >
            {t("auth.login")}
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
              <div className="space-y-5">
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
                />
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between mt-5 mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formik.values.rememberMe}
                    onChange={(checked) => formik.setFieldValue("rememberMe", checked)}
                  />
                  <span className="text-sm" style={{ color: COLORS.textDark }}>
                    {t("auth.rememberMe")}
                  </span>
                </div>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm font-medium hover:underline"
                  style={{ color: COLORS.accent }}
                >
                  {t("auth.forgotPasswordLink")}
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="accent"
                size="lg"
                fullWidth
                rounded
                isLoading={isLoading}
                disabled={!formik.values.email || !formik.values.password || Object.keys(formik.errors).length > 0}
              >
                {t("auth.loginIn")}
              </Button>
            </form>
          </div>

          {/* Register Link */}
          <p
            className="text-center mt-6 text-sm"
            style={{ color: COLORS.textMuted }}
          >
            {t("auth.dontHaveAccount")}{" "}
            <Link
              to={ROUTES.REGISTER}
              className="font-medium hover:underline"
              style={{ color: COLORS.accent }}
            >
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;
