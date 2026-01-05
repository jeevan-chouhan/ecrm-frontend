import { useState, useCallback } from "react";
import type { InputHTMLAttributes } from "react";
import { Search, CloseCircle } from "../../assets";
import { COLORS, typography } from "../../constants";

interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounceMs?: number;
  showClearButton?: boolean;
  fullWidth?: boolean;
}

const SearchBar = ({
  onSearch,
  onChange,
  debounceMs = 300,
  showClearButton = true,
  fullWidth = false,
  placeholder = "Search...",
  className = "",
  ...props
}: SearchBarProps) => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange?.(newValue);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        onSearch?.(newValue);
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [onChange, onSearch, debounceMs, debounceTimer]
  );

  const handleClear = () => {
    setValue("");
    onChange?.("");
    onSearch?.("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      onSearch?.(value);
    }
  };

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`}>
      <div
        className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
        style={{ color: COLORS.textMuted }}
      >
        <Search className="h-5 w-5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          block w-full rounded-lg
          pl-10 pr-10 py-2.5
          transition-all duration-200
          focus:outline-none
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        style={{
          border: `1px solid ${isFocused ? COLORS.accent : COLORS.border}`,
          boxShadow: isFocused ? `0 0 0 3px ${COLORS.accent}20` : "none",
          color: COLORS.textDark,
          backgroundColor: COLORS.surface,
          fontSize: typography.fontSize.small,
        }}
        {...props}
      />
      <style>{`
        input::placeholder {
          color: ${COLORS.textDark} !important;
          opacity: 0.7;
        }
      `}</style>
      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
          style={{ color: COLORS.textMuted }}
        >
          <CloseCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
