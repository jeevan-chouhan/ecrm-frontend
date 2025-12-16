import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "../../assets";

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
  const [currentMonth, setCurrentMonth] = useState(
    value ? value.getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );
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

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
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
      days.push(
        <button
          key={day}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateSelect(day)}
          className={`
            h-9 w-9 rounded-lg text-sm font-medium
            transition-colors duration-150
            ${isDisabled ? "text-slate-300 cursor-not-allowed" : "hover:bg-indigo-50"}
            ${isToday(day) && !isSelected(day) ? "border border-indigo-500 text-indigo-600" : ""}
            ${isSelected(day) ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-slate-700"}
          `}
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
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
            }
            ${isOpen ? "ring-2 ring-indigo-500/20 border-indigo-500" : ""}
          `}
        >
          <span className={value ? "text-slate-900" : "text-slate-400"}>
            {value ? formatDate(value) : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-slate-400" />
          </span>
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-72 bg-white rounded-lg border border-slate-200 shadow-lg p-4">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <span className="text-sm font-semibold text-slate-800">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="h-9 w-9 flex items-center justify-center text-xs font-medium text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

            {/* Today Button */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setCurrentMonth(today.getMonth());
                  setCurrentYear(today.getFullYear());
                  onChange?.(today);
                  setIsOpen(false);
                }}
                className="w-full py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default DatePicker;

