import { memo } from "react";
import { COLORS } from "../../constants";

type ChipVariant = "success" | "error" | "warning" | "info" | "default";

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<ChipVariant, { background: string; color: string }> = {
  success: {
    background: `${COLORS.success}15`,
    color: COLORS.success,
  },
  error: {
    background: `${COLORS.error}15`,
    color: COLORS.error,
  },
  warning: {
    background: `${COLORS.warning}15`,
    color: COLORS.warning,
  },
  info: {
    background: `${COLORS.accent}15`,
    color: COLORS.accent,
  },
  default: {
    background: COLORS.surface,
    color: COLORS.textMuted,
  },
};


const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

const Chip = ({ label, variant = "default", size = "sm", className = "" }: ChipProps) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${className}`}
      style={{
        backgroundColor: styles.background,
        color: styles.color,
      }}
    >
      {label}
    </span>
  );
};

export default memo(Chip);

