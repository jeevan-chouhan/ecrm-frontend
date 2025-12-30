import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "../../assets";
import { COLORS, componentSpecs } from "../../constants";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "accent" | "cancel";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: componentSpecs.button.padding.sm,
  md: componentSpecs.button.padding.md,
  lg: componentSpecs.button.padding.lg,
};

// Square padding for icon-only buttons
const iconOnlySizeStyles: Record<ButtonSize, string> = {
  sm: "6px",
  md: "8px",
  lg: "10px",
};

const variantColors: Record<ButtonVariant, { bg: string; hover: string; text: string; border?: string }> = {
  primary: {
    bg: COLORS.primary,
    hover: COLORS.primaryHover,
    text: COLORS.textWhite,
  },
  secondary: {
    bg: COLORS.secondary,
    hover: COLORS.secondaryHover,
    text: COLORS.textWhite,
  },
  accent: {
    bg: COLORS.accent,
    hover: COLORS.accentHover,
    text: COLORS.textWhite,
  },
  outline: {
    bg: "transparent",
    hover: COLORS.surfaceHover,
    text: COLORS.accent,
    border: COLORS.accent,
  },
  danger: {
    bg: COLORS.error,
    hover: COLORS.errorHover,
    text: COLORS.textWhite,
  },
  ghost: {
    bg: "transparent",
    hover: COLORS.surfaceHover,
    text: COLORS.textMuted,
  },
  cancel: {
    bg: COLORS.surface,
    hover: COLORS.surfaceHover,
    text: COLORS.accent,
    border: COLORS.accent,
  },
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  icon,
  iconOnly = false,
  fullWidth = false,
  rounded = false,
  disabled,
  className = "",
  style,
  ...props
}: ButtonProps) => {
  const variantStyle = variantColors[variant];
  const isIconButton = iconOnly || (icon && !children);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    e.currentTarget.style.backgroundColor = variantStyle.hover;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = variantStyle.bg;
  };

  // Determine what to render as icon
  const renderIcon = () => {
    if (isLoading) return <Spinner className="h-5 w-5" />;
    if (icon) return icon;
    return null;
  };

  return (
    <button
      disabled={disabled || isLoading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium text-sm
        transition-all duration-200
        focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      style={{
        padding: isIconButton ? iconOnlySizeStyles[size] : sizeStyles[size],
        borderRadius: rounded ? "9999px" : componentSpecs.button.borderRadius,
        backgroundColor: variantStyle.bg,
        color: variantStyle.text,
        border: variantStyle.border ? `2px solid ${variantStyle.border}` : "none",
        fontFamily: "'Inter', sans-serif",
        ...style,
      }}
      {...props}
    >
      {isIconButton ? (
        renderIcon()
      ) : (
        <>
          {isLoading ? <Spinner className="h-5 w-5" /> : leftIcon}
          {children}
          {!isLoading && rightIcon}
        </>
      )}
    </button>
  );
};

export default Button;
