import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input } from "../../../components";
import { COLORS } from "../../../constants";
import { authService } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { updateTokens, updatePasswordChangedStatus } from "../../../redux/slices/auth/authSlice";
import { decodeToken } from "../../../utils";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";
import type { RefreshTokenResponse } from "../../../services/types";

interface ChangePasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const ChangePassword = ({ onSuccess, onCancel }: ChangePasswordProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field change
  const handleFieldChange = useCallback((field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: PasswordErrors = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = t("validation.required", "This field is required");
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = t("validation.required", "This field is required");
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = t("validation.passwordMinLength", "Password must be at least 8 characters");
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = t("validation.required", "This field is required");
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = t("validation.passwordMatch", "Passwords do not match");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [passwordData, t]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    if (!user?.email) {
      dispatch(addToast({ type: "error", message: t("auth.emailNotFound", "Email not found") }));
      return;
    }

    setIsSubmitting(true);
    dispatch(showLoader());

    try {
      const response = await authService.updatePassword({
        email: user.email,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (response.status === "success") {
        // After password change, refresh the token to get a new token with updated isPasswordChanged
        try {
          const refreshToken = authService.getRefreshToken();
          if (refreshToken) {
            const refreshResponse = await api.post<RefreshTokenResponse>(
              ENDPOINTS.AUTH.REFRESH,
              { refreshToken }
            );

            if (refreshResponse.data.status === "success" && refreshResponse.data.data) {
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
              
              // Update Redux state with new tokens
              dispatch(updateTokens({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              }));

              // Verify the new token has isPasswordChanged: true
              const decodedUser = decodeToken(newAccessToken);
              if (decodedUser?.isPasswordChanged) {
                // Token is updated correctly - no need for localStorage flag
                localStorage.removeItem("passwordChanged");
                dispatch(updatePasswordChangedStatus(true));
                dispatch(addToast({
                  type: "success",
                  message: response.message || t("auth.passwordUpdatedSuccess", "Password Updated Successfully"),
                }));
                // Small delay to ensure state is updated before navigation
                setTimeout(() => {
                  onSuccess?.();
                }, 200);
              } else {
                // Token still shows password not changed, use localStorage flag as fallback
                dispatch(updatePasswordChangedStatus(true));
                dispatch(addToast({
                  type: "success",
                  message: response.message || t("auth.passwordUpdatedSuccess", "Password Updated Successfully"),
                }));
                // Small delay to ensure state is updated before navigation
                setTimeout(() => {
                  onSuccess?.();
                }, 200);
              }
            } else {
              // Refresh failed, but password was updated - update status manually
              dispatch(updatePasswordChangedStatus(true));
              dispatch(addToast({
                type: "success",
                message: response.message || t("auth.passwordUpdatedSuccess", "Password Updated Successfully"),
              }));
              // Small delay to ensure state is updated before navigation
              setTimeout(() => {
                onSuccess?.();
              }, 200);
            }
          } else {
            // No refresh token, but password was updated - update status manually
            dispatch(updatePasswordChangedStatus(true));
            dispatch(addToast({
              type: "success",
              message: response.message || t("auth.passwordUpdatedSuccess", "Password Updated Successfully"),
            }));
            // Small delay to ensure state is updated before navigation
            setTimeout(() => {
              onSuccess?.();
            }, 200);
          }
        } catch (refreshError) {
          // Token refresh failed, but password was updated - update status manually
          dispatch(updatePasswordChangedStatus(true));
          dispatch(addToast({
            type: "success",
            message: response.message || t("auth.passwordUpdatedSuccess", "Password Updated Successfully"),
          }));
          // Small delay to ensure state is updated before navigation
          setTimeout(() => {
            onSuccess?.();
          }, 200);
        }
      } else {
        dispatch(addToast({
          type: "error",
          message: response.message || t("auth.passwordUpdateFailed", "Failed To Update Password"),
        }));
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("auth.passwordUpdateFailed", "Failed To Update Password");

      dispatch(addToast({ type: "error", message: errorMessage }));
    } finally {
      setIsSubmitting(false);
      dispatch(hideLoader());
    }
  }, [validateForm, passwordData, user, dispatch, t, onSuccess]);

  // Check if all required fields are filled
  const isFormFilled = 
    passwordData.currentPassword.trim() !== "" &&
    passwordData.newPassword.trim() !== "" &&
    passwordData.confirmPassword.trim() !== "";

  return (
    <div className="space-y-5">
      {/* Current Password */}
      <Input
        label={
          <>
            {t("auth.currentPassword", "Current Password")}{" "}
            <span style={{ color: COLORS.error }}>*</span>
          </>
        }
        type="password"
        placeholder={t("auth.enterCurrentPassword", "Enter Current Password")}
        value={passwordData.currentPassword}
        onChange={(e) => handleFieldChange("currentPassword", e.target.value)}
        error={errors.currentPassword}
        fullWidth
        showPasswordToggle
      />

      {/* New Password */}
      <Input
        label={
          <>
            {t("auth.newPassword", "New Password")}{" "}
            <span style={{ color: COLORS.error }}>*</span>
          </>
        }
        type="password"
        placeholder={t("auth.enterNewPassword", "Enter New Password")}
        value={passwordData.newPassword}
        onChange={(e) => handleFieldChange("newPassword", e.target.value)}
        error={errors.newPassword}
        fullWidth
        showPasswordToggle
      />

      {/* Confirm New Password */}
      <Input
        label={
          <>
            {t("auth.confirmNewPassword", "Confirm New Password")}{" "}
            <span style={{ color: COLORS.error }}>*</span>
          </>
        }
        type="password"
        placeholder={t("auth.enterConfirmPassword", "Confirm New Password")}
        value={passwordData.confirmPassword}
        onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
        fullWidth
        showPasswordToggle
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="cancel"
          size="md"
          rounded
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="accent"
          size="md"
          rounded
          onClick={handleSubmit}
          disabled={!isFormFilled || isSubmitting}
        >
          {isSubmitting
            ? t("common.loading", "Loading...")
            : t("auth.changePassword", "Change Password")}
        </Button>
      </div>
    </div>
  );
};

export default ChangePassword;
