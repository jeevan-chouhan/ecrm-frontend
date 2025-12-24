import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "../../assets";
import { COLORS } from "../../constants";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
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

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
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

  const isDateDisabled = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number): boolean => {
    if (!value) return false;
    return (
      day === value.getDate() &&
      currentMonth === value.getMonth() &&
      currentYear === value.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isDisabled = isDateDisabled(day);
      const selected = isSelected(day);
      const today = isToday(day);
      days.push(
        <button
          key={day}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateSelect(day)}
          className="h-9 w-9 rounded-lg text-sm font-medium transition-colors duration-150"
          style={{
            backgroundColor: selected ? COLORS.accent : "transparent",
            color: selected ? COLORS.textWhite : isDisabled ? COLORS.border : COLORS.textDark,
            border: today && !selected ? `1px solid ${COLORS.accent}` : "none",
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isDisabled && !selected) {
              e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled && !selected) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          {day}
        </button>
      );
    }

    return days;
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
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
          }}
        >
          <span style={{ color: value ? COLORS.textDark : COLORS.textDark, opacity: value ? 1 : 0.7 }}>
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
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: COLORS.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold" style={{ color: COLORS.textDark }}>
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={!canNavigateNext()}
                className="p-1.5 rounded-lg transition-colors"
                style={{ 
                  color: canNavigateNext() ? COLORS.textMuted : COLORS.border,
                  cursor: canNavigateNext() ? "pointer" : "not-allowed",
                  opacity: canNavigateNext() ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (canNavigateNext()) {
                    e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="h-9 w-9 flex items-center justify-center text-xs font-medium"
                  style={{ color: COLORS.textMuted }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

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

