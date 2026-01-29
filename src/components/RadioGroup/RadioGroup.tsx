import { COLORS } from "../../constants";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  label?: React.ReactNode;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  direction?: "horizontal" | "vertical";
  className?: string;
}

const RadioGroup = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  disabled = false,
  direction = "horizontal",
  className = "",
}: RadioGroupProps) => {
  return (
    <div className={className}>
      {label && (
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: COLORS.textDark }}
        >
          {label}
        </label>
      )}
      <div
        className={`flex ${direction === "vertical" ? "flex-col gap-2" : "flex-row gap-4"}`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-2 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className="sr-only"
            />
            <span
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: value === option.value ? COLORS.accent : COLORS.border,
                backgroundColor: value === option.value ? COLORS.accent : "transparent",
              }}
            >
              {value === option.value && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS.surface }}
                />
              )}
            </span>
            <span
              className="text-sm"
              style={{ color: COLORS.textDark }}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: COLORS.error }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default RadioGroup;
