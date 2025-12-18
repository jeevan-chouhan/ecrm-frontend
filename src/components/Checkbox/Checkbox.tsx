import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "../../assets";
import { COLORS } from "../../constants";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "size"> {
  label?: ReactNode;
  description?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}

const sizeStyles = {
  sm: {
    box: "h-4 w-4",
    icon: "h-3 w-3",
    label: "text-sm",
    description: "text-xs",
  },
  md: {
    box: "h-5 w-5",
    icon: "h-3.5 w-3.5",
    label: "text-sm",
    description: "text-xs",
  },
  lg: {
    box: "h-6 w-6",
    icon: "h-4 w-4",
    label: "text-base",
    description: "text-sm",
  },
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      size = "md",
      indeterminate = false,
      className = "",
      disabled,
      checked,
      onChange,
      ...props
    },
    ref
  ) => {
    const styles = sizeStyles[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <div className={className}>
        <label
          className={`
            inline-flex items-start gap-3 cursor-pointer
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
          `}
        >
          {/* Hidden input */}
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="sr-only peer"
            {...props}
          />

          {/* Custom checkbox */}
          <span
            className={`
              ${styles.box}
              flex items-center justify-center shrink-0
              rounded border-2 transition-all duration-150
              peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1
            `}
            style={{
              backgroundColor: checked || indeterminate ? COLORS.accent : COLORS.surface,
              borderColor: error
                ? COLORS.error
                : checked || indeterminate
                ? COLORS.accent
                : COLORS.border,
              boxShadow: checked ? `0 0 0 3px ${COLORS.accent}20` : "none",
            }}
          >
            {checked && <Check className={`${styles.icon} text-white`} />}
            {indeterminate && !checked && (
              <span className="h-0.5 w-2.5 bg-white rounded-full" />
            )}
          </span>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex flex-col">
              {label && (
                <span
                  className={`${styles.label} font-medium leading-tight`}
                  style={{ color: COLORS.textDark }}
                >
                  {label}
                </span>
              )}
              {description && (
                <span
                  className={`${styles.description} mt-0.5`}
                  style={{ color: COLORS.textMuted }}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {/* Error message */}
        {error && (
          <p className="mt-1.5 text-sm" style={{ color: COLORS.error }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
