import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input } from "../../../components";
import { COLORS } from "../../../constants";
import { EyeOff, Eye } from "../../../assets";
import { authService } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";

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

  // Visibility toggles for each password field
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        dispatch(addToast({
          type: "success",
          message: response.message || t("auth.passwordUpdatedSuccess", "Password updated successfully"),
        }));
        onSuccess?.();
      } else {
        dispatch(addToast({
          type: "error",
          message: response.message || t("auth.passwordUpdateFailed", "Failed to update password"),
        }));
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("auth.passwordUpdateFailed", "Failed to update password");

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
        type={showCurrentPassword ? "text" : "password"}
        placeholder={t("auth.enterCurrentPassword", "Enter Current Password")}
        value={passwordData.currentPassword}
        onChange={(e) => handleFieldChange("currentPassword", e.target.value)}
        error={errors.currentPassword}
        fullWidth
        rightIcon={
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-5 w-5" style={{ color: COLORS.textMuted }} />
            ) : (
              <Eye className="h-5 w-5" style={{ color: COLORS.textMuted }} />
            )}
          </button>
        }
      />

      {/* New Password */}
      <Input
        label={
          <>
            {t("auth.newPassword", "New Password")}{" "}
            <span style={{ color: COLORS.error }}>*</span>
          </>
        }
        type={showNewPassword ? "text" : "password"}
        placeholder={t("auth.enterNewPassword", "Enter New Password")}
        value={passwordData.newPassword}
        onChange={(e) => handleFieldChange("newPassword", e.target.value)}
        error={errors.newPassword}
        fullWidth
        rightIcon={
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            {showNewPassword ? (
              <EyeOff className="h-5 w-5" style={{ color: COLORS.textMuted }} />
            ) : (
              <Eye className="h-5 w-5" style={{ color: COLORS.textMuted }} />
            )}
          </button>
        }
      />

      {/* Confirm New Password */}
      <Input
        label={
          <>
            {t("auth.confirmNewPassword", "Confirm New Password")}{" "}
            <span style={{ color: COLORS.error }}>*</span>
          </>
        }
        type={showConfirmPassword ? "text" : "password"}
        placeholder={t("auth.enterConfirmPassword", "Confirm New Password")}
        value={passwordData.confirmPassword}
        onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
        fullWidth
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" style={{ color: COLORS.textMuted }} />
            ) : (
              <Eye className="h-5 w-5" style={{ color: COLORS.textMuted }} />
            )}
          </button>
        }
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
