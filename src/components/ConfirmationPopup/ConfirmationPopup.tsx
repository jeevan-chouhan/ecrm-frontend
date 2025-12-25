import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import Popup from "../Popup/Popup";
import Button from "../Button/Button";

interface ConfirmationPopupProps {
  isOpen: boolean;
  title: string;
  message?: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "danger"; // For different button styles
  children?: ReactNode; // Custom content
}

const ConfirmationPopup = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  isDisabled = false,
  onClose,
  onConfirm,
  size = "sm",
  variant = "default",
  children,
}: ConfirmationPopupProps) => {
  const { t } = useTranslation();

  const confirmButtonVariant = variant === "danger" ? "danger" : "accent";

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnOverlayClick={!isLoading && !isDisabled}
      closeOnEscape={!isLoading && !isDisabled}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="cancel"
            size="sm"
            onClick={onClose}
            disabled={isLoading || isDisabled}
            rounded
          >
            {cancelLabel || t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant={confirmButtonVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isDisabled}
            rounded
          >
            {confirmLabel || t("common.confirm", "Confirm")}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        {children || (
          <p className="text-sm text-slate-600 mb-2">
            {typeof message === "string" ? message : message}
          </p>
        )}
      </div>
    </Popup>
  );
};

export default ConfirmationPopup;

