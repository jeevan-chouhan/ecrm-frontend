import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "../../../components";
import { COLORS, ROUTES } from "../../../constants";
import ChangePassword from "./index";

const ChangePasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSuccess = useCallback(() => {
    // Navigate back to profile or dashboard after successful password change
    navigate(ROUTES.PROFILE);
    // TODO: Show success toast
  }, [navigate]);

  const handleCancel = useCallback(() => {
    // Navigate back
    navigate(-1);
  }, [navigate]);

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
          <ChangePassword
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ChangePasswordPage;
