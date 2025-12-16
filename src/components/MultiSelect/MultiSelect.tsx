import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Close, Check } from "../../assets";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
}

const MultiSelect = ({
  label,
  options,
  value = [],
  onChange,
  placeholder = "Select options",
  error,
  disabled = false,
  fullWidth = false,
  leftIcon,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

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

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== optionValue));
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
            relative w-full min-h-[42px] rounded-lg border
            px-4 py-2 text-left
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
          <div className="flex flex-wrap gap-1.5 pr-8">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-sm"
                >
                  {option.label}
                  <span
                    onClick={(e) => handleRemove(option.value, e)}
                    className="cursor-pointer hover:text-indigo-900"
                  >
                    <Close className="h-4 w-4" />
                  </span>
                </span>
              ))
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
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
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <li
                  key={option.value}
                  onClick={() => handleToggle(option.value)}
                  className={`
                    px-4 py-2.5 cursor-pointer flex items-center gap-3
                    transition-colors duration-150
                    ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-900 hover:bg-slate-50"
                    }
                  `}
                >
                  <span
                    className={`
                      flex items-center justify-center w-5 h-5 rounded border-2
                      transition-colors duration-150
                      ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-slate-300"
                      }
                    `}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  {option.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default MultiSelect;
