import { COLORS } from "../../constants";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarDaysGridProps {
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onDateSelect: (day: number) => void;
}

const CalendarDaysGrid = ({
  currentMonth,
  currentYear,
  selectedDate,
  minDate,
  maxDate,
  onDateSelect,
}: CalendarDaysGridProps) => {
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
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
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

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
        onClick={() => onDateSelect(day)}
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

  return (
    <>
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
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </>
  );
};

export default CalendarDaysGrid;

