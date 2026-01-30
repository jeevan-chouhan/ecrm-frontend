import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "../../../components";
import { COLORS, ROUTES } from "../../../constants";
import ChangePassword from "./index";
import { useAuth } from "../../../context";
import { decodeToken } from "../../../utils";

const ChangePasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if password change is required (user must change password)
  const isPasswordChangeRequired = user?.isPasswordChanged === false;

  const handleSuccess = useCallback(() => {
    // After password change, refresh the token to get updated isPasswordChanged status
    // The backend should have updated the token, so we decode the current token again
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decodedUser = decodeToken(token);
      // If token is updated, navigate to dashboard
      // Otherwise, user will need to log in again
      if (decodedUser?.isPasswordChanged) {
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else {
        // Token not updated yet, navigate to dashboard anyway
        // The ProtectedRoute will handle redirect if needed
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    } else {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [navigate]);

  const handleCancel = useCallback(() => {
    // If password change is required, don't allow cancel
    if (isPasswordChangeRequired) {
      return;
    }
    // Navigate back only if password change is not required
    navigate(-1);
  }, [navigate, isPasswordChangeRequired]);

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Title */}
        <div className="mb-8 text-center">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("auth.changePassword", "Change Password")}
          </h1>
        </div>

        {/* Change Password Form */}
        <div className="max-w-md mx-auto">
          {isPasswordChangeRequired && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: COLORS.accentLight }}>
              <p className="text-sm" style={{ color: COLORS.textDark }}>
                {t("auth.passwordChangeRequired", "You Must Change Your Password Before Accessing The Application")}
              </p>
            </div>
          )}
          <ChangePassword
            onSuccess={handleSuccess}
            onCancel={isPasswordChangeRequired ? undefined : handleCancel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ChangePasswordPage;
