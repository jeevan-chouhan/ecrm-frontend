import { useState, useRef, useEffect, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "../../assets";
import { COLORS, MONTHS, MONTH_SHORT_NAMES, typography } from "../../constants";
import Select from "../Select/Select";

interface IntakeSelectorProps {
  label?: string;
  value?: string; // Format: "jan-2026"
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minYear?: number;
  maxYear?: number;
  allowPastMonths?: boolean; // If false, only allow current month and future months
}

// Parse value from "jan-2026" format to { month: 0, year: 2026 }
const parseIntakeValue = (value?: string): { month: number | null; year: number | null } => {
  if (!value) return { month: null, year: null };
  
  const parts = value.toLowerCase().split("-");
  if (parts.length !== 2) return { month: null, year: null };
  
  const monthName = parts[0];
  const year = parseInt(parts[1], 10);
  
  if (isNaN(year)) return { month: null, year: null };
  
  const monthIndex = MONTH_SHORT_NAMES.findIndex(
    (m) => m.toLowerCase() === monthName
  );
  
  if (monthIndex === -1) return { month: null, year: null };
  
  return { month: monthIndex, year };
};

// Format { month: 0, year: 2026 } to "jan-2026"
const formatIntakeValue = (month: number, year: number): string => {
  const monthShort = MONTH_SHORT_NAMES[month].toLowerCase();
  return `${monthShort}-${year}`;
};

// Format { month: 0, year: 2026 } to "Jan - 2026" for display
const formatIntakeDisplay = (month: number, year: number): string => {
  const monthShort = MONTH_SHORT_NAMES[month];
  return `${monthShort} - ${year}`;
};

const IntakeSelector = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  fullWidth = false,
  minYear,
  maxYear,
  allowPastMonths = true, // Default to true for backward compatibility
}: IntakeSelectorProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  // Calculate min year: if allowPastMonths is true and minYear not provided, go back 5 years
  // Otherwise use provided minYear or currentYear
  const defaultMinYear = useMemo(() => {
    if (minYear !== undefined) return minYear;
    if (allowPastMonths) return currentYear - 5; // Allow 5 years in the past for list view
    return currentYear; // For preference form, start from current year
  }, [minYear, allowPastMonths, currentYear]);
  
  const defaultMaxYear = maxYear ?? currentYear + 10;
  
  const parsedValue = useMemo(() => parseIntakeValue(value), [value]);
  
  // Generate year options
  const yearOptions = useMemo(() => {
    const years: Array<{ value: string; label: string }> = [];
    const startYear = allowPastMonths ? defaultMinYear : currentYear;
    for (let year = defaultMaxYear; year >= startYear; year--) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  }, [defaultMinYear, defaultMaxYear, allowPastMonths, currentYear]);
  
  // Generate month options based on selected year and allowPastMonths flag
  const monthOptions = useMemo(() => {
    const selectedYear = parsedValue.year ?? currentYear;
    const isCurrentYear = selectedYear === currentYear;
    
    // If past months are not allowed and it's the current year, filter out past months
    if (!allowPastMonths && isCurrentYear) {
      return MONTHS.map((month, index) => ({
        value: index.toString(),
        label: month,
      })).filter((_, index) => index >= currentMonth);
    }
    
    // Otherwise, return all months
    return MONTHS.map((month, index) => ({
      value: index.toString(),
      label: month,
    }));
  }, [allowPastMonths, parsedValue.year, currentYear, currentMonth]);
  
  // Get display text for main button
  const displayText = useMemo(() => {
    if (parsedValue.month === null || parsedValue.year === null) {
      return placeholder || t("intakeSelector.selectIntake", "Select Intake");
    }
    return formatIntakeDisplay(parsedValue.month, parsedValue.year);
  }, [parsedValue, placeholder, t]);
  
  // Handle month change
  const handleMonthChange = (monthValue: string) => {
    if (!monthValue) return;
    const month = parseInt(monthValue, 10);
    const year = parsedValue.year ?? currentYear;
    
    // Validate: if past months not allowed and it's current year, ensure month is not in the past
    if (!allowPastMonths && year === currentYear && month < currentMonth) {
      // If invalid, set to current month
      const newValue = formatIntakeValue(currentMonth, year);
      onChange?.(newValue);
      return;
    }
    
    const newValue = formatIntakeValue(month, year);
    onChange?.(newValue);
  };
  
  // Handle year change
  const handleYearChange = (yearValue: string) => {
    if (!yearValue) return;
    const year = parseInt(yearValue, 10);
    let month = parsedValue.month ?? 0;
    
    // Validate: if past months not allowed and it's current year, ensure month is not in the past
    if (!allowPastMonths && year === currentYear && month < currentMonth) {
      month = currentMonth; // Set to current month if selected month is in the past
    }
    
    const newValue = formatIntakeValue(month, year);
    onChange?.(newValue);
  };
  
  // Validate and reset invalid values when allowPastMonths changes or on mount
  useEffect(() => {
    if (!allowPastMonths && parsedValue.month !== null && parsedValue.year !== null) {
      const selectedDate = new Date(parsedValue.year, parsedValue.month, 1);
      const currentDateStart = new Date(currentYear, currentMonth, 1);
      
      // If selected date is in the past, reset to current month
      if (selectedDate < currentDateStart) {
        const newValue = formatIntakeValue(currentMonth, currentYear);
        onChange?.(newValue);
      }
    }
  }, [allowPastMonths, parsedValue.month, parsedValue.year, currentYear, currentMonth, onChange]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className={`${fullWidth ? "w-full" : ""}`} ref={selectorRef}>
      {label && (
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: COLORS.textDark }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {/* Main Dropdown Button */}
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
          `}
          style={{
            borderColor: error
              ? COLORS.error
              : isOpen
              ? COLORS.accent
              : COLORS.border,
            boxShadow: isOpen ? `0 0 0 3px ${COLORS.accent}20` : "none",
            backgroundColor: COLORS.surface,
            fontSize: typography.fontSize.small,
          }}
        >
          <span
            style={{
              color: parsedValue.month !== null && parsedValue.year !== null
                ? COLORS.textDark
                : COLORS.textMuted,
              opacity: parsedValue.month !== null && parsedValue.year !== null ? 1 : 0.7,
            }}
          >
            {displayText}
          </span>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              style={{ color: COLORS.textMuted }}
            />
          </span>
        </button>
        
        {/* Dropdown Popup */}
        {isOpen && (
          <div
            className="absolute z-50 mt-1 rounded-lg p-4 sm:p-5 left-0 right-0 sm:left-auto sm:right-auto sm:w-full"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              minWidth: "280px",
              maxWidth: "400px",
            }}
          >
            {/* Header */}
            <div className="mb-4 pb-3 border-b" style={{ borderColor: COLORS.border }}>
              <p
                className="text-sm font-medium text-center"
                style={{ color: COLORS.accent }}
              >
                {t("intakeSelector.selectIntake", "Select Intake")}
              </p>
            </div>
            
            {/* Month and Year Selectors */}
            <div className="space-y-4 w-full">
              {/* Month Selector */}
              <div className="w-full">
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.textDark }}
                >
                  {t("intakeSelector.selectMonth", "Select Month")}
                </label>
                <Select
                  options={monthOptions}
                  value={parsedValue.month !== null ? parsedValue.month.toString() : ""}
                  onChange={handleMonthChange}
                  placeholder={t("intakeSelector.selectMonth", "Select Month")}
                  disabled={disabled}
                  fullWidth
                  searchable
                  searchPlaceholder={t("intakeSelector.searchMonth", "Search Month...")}
                />
              </div>
              
              {/* Year Selector */}
              <div className="w-full">
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.textDark }}
                >
                  {t("intakeSelector.selectYear", "Select Year")}
                </label>
                <Select
                  options={yearOptions}
                  value={parsedValue.year !== null ? parsedValue.year.toString() : ""}
                  onChange={handleYearChange}
                  placeholder={t("intakeSelector.selectYear", "Select Year")}
                  disabled={disabled}
                  fullWidth
                  searchable
                  searchPlaceholder={t("intakeSelector.searchYear", "Search Year...")}
                />
              </div>
            </div>
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

export default memo(IntakeSelector);

