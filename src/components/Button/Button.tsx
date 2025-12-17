import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "../../assets";
import { colors, componentSpecs } from "../../constants";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: componentSpecs.button.padding.sm,
  md: componentSpecs.button.padding.md,
  lg: componentSpecs.button.padding.lg,
};

const variantColors: Record<ButtonVariant, { bg: string; hover: string; text: string; border?: string }> = {
  primary: {
    bg: colors.primary,
    hover: colors.primaryHover,
    text: colors.textWhite,
  },
  secondary: {
    bg: colors.secondary,
    hover: colors.secondaryHover,
    text: colors.textWhite,
  },
  accent: {
    bg: colors.accent,
    hover: colors.accentHover,
    text: colors.textWhite,
  },
  outline: {
    bg: "transparent",
    hover: colors.surfaceHover,
    text: colors.primary,
    border: colors.primary,
  },
  danger: {
    bg: colors.error,
    hover: colors.errorHover,
    text: colors.textWhite,
  },
  ghost: {
    bg: "transparent",
    hover: colors.surfaceHover,
    text: colors.textMuted,
  },
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  style,
  ...props
}: ButtonProps) => {
  const variantStyle = variantColors[variant];

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    e.currentTarget.style.backgroundColor = variantStyle.hover;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = variantStyle.bg;
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
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      style={{
        padding: sizeStyles[size],
        borderRadius: componentSpecs.button.borderRadius,
        backgroundColor: variantStyle.bg,
        color: variantStyle.text,
        border: variantStyle.border ? `2px solid ${variantStyle.border}` : "none",
        fontFamily: "'Inter', sans-serif",
        ...style,
      }}
      {...props}
    >
      {isLoading ? <Spinner className="h-5 w-5" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
