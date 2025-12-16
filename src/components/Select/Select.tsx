import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "../../assets";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
}

const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  error,
  disabled = false,
  fullWidth = false,
  leftIcon,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative w-full rounded-lg border
            px-4 py-2.5 text-left
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${leftIcon ? "pl-10" : ""}
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
            }
            ${isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : ""}
          `}
        >
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <span
            className={selectedOption ? "text-slate-900" : "text-slate-400"}
          >
            {selectedOption?.label || placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <ul className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  px-4 py-2.5 cursor-pointer
                  transition-colors duration-150
                  ${
                    option.value === value
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-900 hover:bg-slate-50"
                  }
                `}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
