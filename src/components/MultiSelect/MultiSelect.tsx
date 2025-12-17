import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Close, Check, Search } from "../../assets";
import { colors } from "../../constants";

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
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Search...",
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

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
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: colors.textDark }}
        >
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
          `}
          style={{
            borderColor: error
              ? colors.error
              : isOpen
              ? colors.primary
              : colors.border,
            boxShadow: isOpen ? `0 0 0 3px ${colors.primary}20` : "none",
          }}
        >
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              style={{ color: colors.textMuted }}
            >
              {leftIcon}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pr-8">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm"
                  style={{
                    backgroundColor: `${colors.accent}20`,
                    color: colors.accent,
                  }}
                >
                  {option.label}
                  <span
                    onClick={(e) => handleRemove(option.value, e)}
                    className="cursor-pointer"
                    style={{ color: colors.accent }}
                  >
                    <Close className="h-4 w-4" />
                  </span>
                </span>
              ))
            ) : (
              <span style={{ color: colors.textMuted }}>{placeholder}</span>
            )}
          </div>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              style={{ color: colors.textMuted }}
            />
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute z-10 mt-1 w-full rounded-lg overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Search Input */}
            {searchable && (
              <div
                className="p-2"
                style={{ borderBottom: `1px solid ${colors.border}` }}
              >
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: colors.textMuted }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none"
                    style={{
                      border: `1px solid ${colors.border}`,
                      color: colors.textDark,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <ul className="max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <li
                      key={option.value}
                      onClick={() => handleToggle(option.value)}
                      className="px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors duration-150"
                      style={{
                        backgroundColor: isSelected
                          ? colors.surfaceHover
                          : "transparent",
                        color: isSelected ? colors.accent : colors.textDark,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            colors.surfaceHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <span
                        className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors duration-150"
                        style={{
                          backgroundColor: isSelected
                            ? colors.accent
                            : "transparent",
                          borderColor: isSelected
                            ? colors.accent
                            : colors.border,
                        }}
                      >
                        {isSelected && (
                          <Check
                            className="h-3.5 w-3.5"
                            style={{ color: colors.textWhite }}
                          />
                        )}
                      </span>
                      {option.label}
                    </li>
                  );
                })
              ) : (
                <li
                  className="px-4 py-2.5 text-center"
                  style={{ color: colors.textMuted }}
                >
                  No options found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: colors.error }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default MultiSelect;
