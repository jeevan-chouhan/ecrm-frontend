import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Search } from "../../assets";
import { COLORS } from "../../constants";

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
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Search...",
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""}`} ref={selectRef}>
      {label && (
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: COLORS.textDark }}
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
            relative w-full rounded-lg border
            px-3 py-2.5 text-left
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${leftIcon ? "pl-10" : ""}
          `}
          style={{
            borderColor: error
              ? COLORS.error
              : isOpen
              ? COLORS.accent
              : COLORS.border,
            boxShadow: isOpen ? `0 0 0 3px ${COLORS.accent}20` : "none",
            backgroundColor: COLORS.surface,
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
          }}
        >
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              style={{ color: COLORS.textMuted }}
            >
              {leftIcon}
            </div>
          )}
          <span 
            className="block truncate pr-6"
            style={{ color: selectedOption ? COLORS.textDark : COLORS.textMuted }}
          >
            {selectedOption?.label || placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              style={{ color: COLORS.textMuted }}
            />
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute z-10 mt-1 w-full rounded-lg overflow-hidden"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Search Input */}
            {searchable && (
              <div
                className="p-2"
                style={{ borderBottom: `1px solid ${COLORS.border}` }}
              >
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: COLORS.textMuted }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none"
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.textDark,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <ul className="max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className="px-4 py-2.5 cursor-pointer transition-COLORS duration-150"
                    style={{
                      backgroundColor:
                        option.value === value ? COLORS.surfaceHover : "transparent",
                      color:
                        option.value === value ? COLORS.accent : COLORS.textDark,
                    }}
                    onMouseEnter={(e) => {
                      if (option.value !== value) {
                        e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (option.value !== value) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {option.label}
                  </li>
                ))
              ) : (
                <li
                  className="px-4 py-2.5 text-center"
                  style={{ color: COLORS.textMuted }}
                >
                  No options found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: COLORS.error }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
