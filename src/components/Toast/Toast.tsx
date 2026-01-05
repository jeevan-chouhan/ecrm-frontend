import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { removeToast } from "../../redux/slices/toast/toastSlice";
import {
  Close,
  SuccessCircle,
  ErrorCircle,
  WarningCircle,
  InfoCircle,
} from "../../assets";
import { COLORS } from "../../constants";
import Button from "../Button/Button";

// Toast type configuration using theme COLORS
// Border color is purple (accent) for all toast types
const toastConfig = {
  success: {
    bg: COLORS.surface,
    border: COLORS.accent,  // Purple border
    text: COLORS.textDark,
    iconColor: COLORS.success,
    Icon: SuccessCircle,
  },
  error: {
    bg: COLORS.surface,
    border: COLORS.accent,  // Purple border
    text: COLORS.textDark,
    iconColor: COLORS.error,
    Icon: ErrorCircle,
  },
  warning: {
    bg: COLORS.surface,
    border: COLORS.accent,  // Purple border
    text: COLORS.textDark,
    iconColor: COLORS.warning,
    Icon: WarningCircle,
  },
  info: {
    bg: COLORS.surface,
    border: COLORS.accent,  // Purple border
    text: COLORS.textDark,
    iconColor: COLORS.info,
    Icon: InfoCircle,
  },
};

type ToastType = keyof typeof toastConfig;

// Single Toast Item
interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const ToastItem = ({ id, message, type, duration = 3000, onClose }: ToastItemProps) => {
  const config = toastConfig[type];
  const Icon = config.Icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] max-w-[400px] animate-slide-in"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon className="w-5 h-5 shrink-0" style={{ color: config.iconColor }} />
      <p
        className="flex-1 text-sm font-medium"
        style={{ color: config.text }}
      >
        {message}
      </p>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        icon={<Close className="w-4 h-4" />}
        onClick={() => onClose(id)}
        style={{ color: config.text, padding: "4px" }}
      />
    </div>
  );
};

// Toast Container
const Toast = () => {
  const dispatch = useAppDispatch();
  const { toasts } = useAppSelector((state) => state.toast);

  const handleClose = (id: string) => {
    dispatch(removeToast(id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type as ToastType}
          duration={toast.duration}
          onClose={handleClose}
        />
      ))}
    </div>
  );
};

export default Toast;
