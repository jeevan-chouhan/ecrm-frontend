import { forwardRef, useState } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { COLORS, componentSpecs, typography } from "../../constants";

type InputVariant = "input" | "textarea";

interface BaseInputProps {
  label?: ReactNode;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  inputType?: InputVariant;
  rows?: number;
}

type InputProps = BaseInputProps & (
  | (InputHTMLAttributes<HTMLInputElement> & { inputType?: "input" })
  | (TextareaHTMLAttributes<HTMLTextAreaElement> & { inputType: "textarea" })
);

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      id,
      onFocus,
      onBlur,
      inputType = "input",
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const isTextarea = inputType === "textarea";

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e as any);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e as any);
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1.5"
            style={{ color: COLORS.textDark }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && !isTextarea && (
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              style={{ color: COLORS.textMuted }}
            >
              {leftIcon}
            </div>
          )}
          {isTextarea ? (
            <textarea
              ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
              id={inputId}
              onFocus={handleFocus}
              onBlur={handleBlur}
              rows={rows}
              className={`
                block w-full
                px-4 py-2.5
                transition-all duration-200
                focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                resize-vertical
                ${className}
              `}
              style={{
                borderRadius: componentSpecs.input.borderRadius,
                border: `1px solid ${error ? COLORS.error : isFocused ? COLORS.accent : COLORS.border}`,
                backgroundColor: COLORS.surface,
                color: COLORS.textDark,
                fontSize: typography.fontSize.small,
                boxShadow: isFocused ? `0 0 0 3px ${COLORS.accent}20` : "none",
              }}
              {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.ForwardedRef<HTMLInputElement>}
              id={inputId}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`
                block w-full
                px-4 py-2.5
                transition-all duration-200
                focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                ${leftIcon ? "pl-10" : ""}
                ${rightIcon ? "pr-10" : ""}
                ${className}
              `}
              style={{
                borderRadius: componentSpecs.input.borderRadius,
                border: `1px solid ${error ? COLORS.error : isFocused ? COLORS.accent : COLORS.border}`,
                backgroundColor: COLORS.surface,
                color: COLORS.textDark,
                fontSize: typography.fontSize.small,
                boxShadow: isFocused ? `0 0 0 3px ${COLORS.accent}20` : "none",
              }}
              {...(props as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          {rightIcon && !isTextarea && (
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
              style={{ color: COLORS.textMuted }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm" style={{ color: COLORS.error }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm" style={{ color: COLORS.textMuted }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
