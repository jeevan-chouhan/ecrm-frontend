import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "../../assets";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
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
      ...props
    },
    ref
  ) => {
    const styles = sizeStyles[size];

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
            className="sr-only peer"
            {...props}
          />

          {/* Custom checkbox */}
          <span
            className={`
              ${styles.box}
              flex items-center justify-center shrink-0
              rounded border-2 transition-all duration-150
              ${
                checked || indeterminate
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-white border-slate-300"
              }
              ${
                !disabled && !checked && !indeterminate
                  ? "hover:border-indigo-400"
                  : ""
              }
              ${error ? "border-red-500" : ""}
              peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/20 peer-focus-visible:ring-offset-1
            `}
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
                  className={`${styles.label} font-medium text-slate-700 leading-tight`}
                >
                  {label}
                </span>
              )}
              {description && (
                <span className={`${styles.description} text-slate-500 mt-0.5`}>
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {/* Error message */}
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;

