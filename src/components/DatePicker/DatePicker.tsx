import { useState, useRef, useEffect } from "react";
import { Calendar } from "../../assets";
import { COLORS, typography } from "../../constants";
import { formatDateOnly } from "../../utils/dateUtils";
import MonthYearSelector from "./MonthYearSelector";
import CalendarDaysGrid from "./CalendarDaysGrid";

interface DatePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
}


const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = "Select Date",
  error,
  disabled = false,
  fullWidth = false,
  minDate,
  maxDate,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize current month/year - respect maxDate if set
  const getInitialMonth = (): number => {
    if (value) return value.getMonth();
    if (maxDate) {
      const today = new Date();
      return today > maxDate ? maxDate.getMonth() : today.getMonth();
    }
    return new Date().getMonth();
  };
  
  const getInitialYear = (): number => {
    if (value) return value.getFullYear();
    if (maxDate) {
      const today = new Date();
      return today > maxDate ? maxDate.getFullYear() : today.getFullYear();
    }
    return new Date().getFullYear();
  };
  
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const [currentYear, setCurrentYear] = useState(getInitialYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update current month/year when opening calendar to respect maxDate
  useEffect(() => {
    if (isOpen && maxDate) {
      const currentViewDate = new Date(currentYear, currentMonth, 1);
      if (currentViewDate > maxDate) {
        setCurrentMonth(maxDate.getMonth());
        setCurrentYear(maxDate.getFullYear());
      }
    }
  }, [isOpen, maxDate, currentMonth, currentYear]);

  // Use formatDateOnly from utils for consistent date formatting
  const formatDate = (date: Date): string => {
    return formatDateOnly(date);
  };


  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check if next month navigation should be disabled (when maxDate is set)
  const canNavigateNext = (): boolean => {
    if (!maxDate) return true;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthDate = new Date(nextYear, nextMonth, 1);
    return nextMonthDate <= maxDate;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    // Ensure selected date doesn't exceed maxDate
    if (maxDate && selectedDate > maxDate) {
      return; // Don't allow selection of future dates
    }
    onChange?.(selectedDate);
    setIsOpen(false);
  };


  return (
    <div className={`${fullWidth ? "w-full" : ""}`} ref={pickerRef}>
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
            relative w-full rounded-lg
            px-4 py-2.5 text-left
            transition-all duration-200
            focus:outline-none
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          `}
          style={{
            border: `1px solid ${error ? COLORS.error : isOpen ? COLORS.accent : COLORS.border}`,
            boxShadow: isOpen ? `0 0 0 3px ${COLORS.accent}20` : "none",
            backgroundColor: COLORS.surface,
            fontSize: typography.fontSize.small,
          }}
        >
          <span className="block truncate pr-10" style={{ color: COLORS.textMuted }}>
            {value ? formatDate(value) : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5" style={{ color: COLORS.textMuted }} />
          </span>
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div
            className="absolute z-50 mt-1 w-72 rounded-lg p-4"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Month/Year Navigation */}
            <MonthYearSelector
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={setCurrentMonth}
              onYearChange={setCurrentYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              canNavigateNext={canNavigateNext()}
              minDate={minDate}
              maxDate={maxDate}
            />

            {/* Calendar Days Grid */}
            <CalendarDaysGrid
              currentMonth={currentMonth}
              currentYear={currentYear}
              selectedDate={value || null}
              minDate={minDate}
              maxDate={maxDate}
              onDateSelect={handleDateSelect}
            />

            {/* Today Button */}
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  // If maxDate is set and today is after maxDate, use maxDate instead
                  const dateToSelect = maxDate && today > maxDate ? maxDate : today;
                  setCurrentMonth(dateToSelect.getMonth());
                  setCurrentYear(dateToSelect.getFullYear());
                  onChange?.(dateToSelect);
                  setIsOpen(false);
                }}
                className="w-full py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: COLORS.accent }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Today
              </button>
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

export default DatePicker;

