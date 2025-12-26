import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "../../assets";
import { COLORS } from "../../constants";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  label?: string;
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minDate?: Date;
  maxDate?: Date;
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

const DateRangePicker = ({
  label,
  value,
  onChange,
  placeholder = "Select date range",
  error,
  disabled = false,
  fullWidth = false,
  minDate,
  maxDate,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Initialize current month/year
  const getInitialMonth = (): number => {
    if (value?.startDate) return value.startDate.getMonth();
    if (maxDate) {
      const today = new Date();
      return today > maxDate ? maxDate.getMonth() : today.getMonth();
    }
    return new Date().getMonth();
  };

  const getInitialYear = (): number => {
    if (value?.startDate) return value.startDate.getFullYear();
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
        setSelectingEnd(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateRange = (): string => {
    if (!value?.startDate && !value?.endDate) return "";
    if (value?.startDate && !value?.endDate) return formatDate(value.startDate);
    if (value?.startDate && value?.endDate) {
      return `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`;
    }
    return "";
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

  const canNavigateNext = (): boolean => {
    if (!maxDate) return true;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthDate = new Date(nextYear, nextMonth, 1);
    return nextMonthDate <= maxDate;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);

    if (maxDate && selectedDate > maxDate) {
      return;
    }

    if (!selectingEnd || !value?.startDate) {
      // Selecting start date
      onChange?.({ startDate: selectedDate, endDate: null });
      setSelectingEnd(true);
    } else {
      // Selecting end date
      if (selectedDate < value.startDate) {
        // If end date is before start date, swap them
        onChange?.({ startDate: selectedDate, endDate: value.startDate });
      } else {
        onChange?.({ startDate: value.startDate, endDate: selectedDate });
      }
      setSelectingEnd(false);
      setIsOpen(false);
    }
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

  const isStartDate = (day: number): boolean => {
    if (!value?.startDate) return false;
    return (
      day === value.startDate.getDate() &&
      currentMonth === value.startDate.getMonth() &&
      currentYear === value.startDate.getFullYear()
    );
  };

  const isEndDate = (day: number): boolean => {
    if (!value?.endDate) return false;
    return (
      day === value.endDate.getDate() &&
      currentMonth === value.endDate.getMonth() &&
      currentYear === value.endDate.getFullYear()
    );
  };

  const isInRange = (day: number): boolean => {
    if (!value?.startDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    const endDate = value.endDate || hoverDate;
    if (!endDate) return false;

    const start = value.startDate < endDate ? value.startDate : endDate;
    const end = value.startDate < endDate ? endDate : value.startDate;

    return date > start && date < end;
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
      const isStart = isStartDate(day);
      const isEnd = isEndDate(day);
      const inRange = isInRange(day);
      const today = isToday(day);

      days.push(
        <button
          key={day}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateSelect(day)}
          onMouseEnter={() => {
            if (selectingEnd && value?.startDate) {
              setHoverDate(new Date(currentYear, currentMonth, day));
            }
          }}
          onMouseLeave={() => setHoverDate(null)}
          className="h-9 w-9 rounded-lg text-sm font-medium transition-colors duration-150"
          style={{
            backgroundColor: isStart || isEnd
              ? COLORS.accent
              : inRange
              ? `${COLORS.accent}20`
              : "transparent",
            color: isStart || isEnd
              ? COLORS.textWhite
              : isDisabled
              ? COLORS.border
              : COLORS.textDark,
            border: today && !isStart && !isEnd ? `1px solid ${COLORS.accent}` : "none",
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
          onMouseOver={(e) => {
            if (!isDisabled && !isStart && !isEnd && !inRange) {
              e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
            }
          }}
          onMouseOut={(e) => {
            if (!isDisabled && !isStart && !isEnd && !inRange) {
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

  const handleClear = () => {
    onChange?.({ startDate: null, endDate: null });
    setSelectingEnd(false);
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
          <span
            style={{
              color: formatDateRange() ? COLORS.textDark : COLORS.textDark,
              opacity: formatDateRange() ? 1 : 0.7,
            }}
          >
            {formatDateRange() || placeholder}
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
            {/* Selection Indicator */}
            <div
              className="text-xs font-medium mb-3 text-center"
              style={{ color: COLORS.textMuted }}
            >
              {selectingEnd && value?.startDate
                ? "Select end date"
                : "Select start date"}
            </div>

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
              <span
                className="text-sm font-semibold"
                style={{ color: COLORS.textDark }}
              >
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

            {/* Clear Button */}
            {(value?.startDate || value?.endDate) && (
              <div
                className="mt-3 pt-3"
                style={{ borderTop: `1px solid ${COLORS.border}` }}
              >
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: COLORS.error }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Clear
                </button>
              </div>
            )}
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

export default DateRangePicker;

