import { useState, useCallback } from "react";
import type { InputHTMLAttributes } from "react";
import { Search, CloseCircle } from "../../assets";

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
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          block w-full rounded-lg border border-slate-300
          pl-10 pr-10 py-2.5
          text-slate-900 placeholder:text-slate-400
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-0
          focus:border-indigo-500 focus:ring-indigo-500/20
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <CloseCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
