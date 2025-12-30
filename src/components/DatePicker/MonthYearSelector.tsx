import { ChevronLeft, ChevronRight } from "../../assets";
import { COLORS } from "../../constants";
import type { SelectOption } from "../Select/Select";
import Select from "../Select/Select";

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

interface MonthYearSelectorProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canNavigateNext: boolean;
  minDate?: Date;
  maxDate?: Date;
  onMonthYearChange?: (month: number, year: number) => void;
}

const MonthYearSelector = ({
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
  onPrevMonth,
  onNextMonth,
  canNavigateNext,
  minDate,
  maxDate,
  onMonthYearChange,
}: MonthYearSelectorProps) => {
  // Generate year options based on minDate and maxDate
  const getYearOptions = (): SelectOption[] => {
    const currentYearValue = new Date().getFullYear();
    const startYear = minDate ? minDate.getFullYear() : 1950;
    const endYear = maxDate ? maxDate.getFullYear() : currentYearValue + 10;
    const years: SelectOption[] = [];

    for (let year = startYear; year <= endYear; year++) {
      years.push({ value: year.toString(), label: year.toString() });
    }

    return years.reverse(); // Show most recent years first
  };

  // Generate month options
  const getMonthOptions = (): SelectOption[] => {
    return MONTHS.map((month, index) => ({
      value: index.toString(),
      label: month,
    }));
  };

  const handleMonthSelect = (monthIndex: string) => {
    const month = parseInt(monthIndex, 10);

    // Validate against minDate and maxDate
    const newDate = new Date(currentYear, month, 1);
    if (minDate && newDate < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
      const finalYear = minDate.getFullYear();
      const finalMonth = minDate.getMonth();
      onMonthChange(finalMonth);
      onYearChange(finalYear);
      onMonthYearChange?.(finalMonth, finalYear);
    } else if (maxDate && newDate > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      const finalYear = maxDate.getFullYear();
      const finalMonth = maxDate.getMonth();
      onMonthChange(finalMonth);
      onYearChange(finalYear);
      onMonthYearChange?.(finalMonth, finalYear);
    } else {
      onMonthChange(month);
      onMonthYearChange?.(month, currentYear);
    }
  };

  const handleYearSelect = (yearValue: string) => {
    const year = parseInt(yearValue, 10);

    // Validate against minDate and maxDate
    const newDate = new Date(year, currentMonth, 1);
    if (minDate && newDate < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
      const finalYear = minDate.getFullYear();
      const finalMonth = minDate.getMonth();
      onMonthChange(finalMonth);
      onYearChange(finalYear);
      onMonthYearChange?.(finalMonth, finalYear);
    } else if (maxDate && newDate > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      const finalYear = maxDate.getFullYear();
      const finalMonth = maxDate.getMonth();
      onMonthChange(finalMonth);
      onYearChange(finalYear);
      onMonthYearChange?.(finalMonth, finalYear);
    } else {
      onYearChange(year);
      onMonthYearChange?.(currentMonth, year);
    }
  };


  return (
    <div className="flex items-center justify-between mb-4">
      <button
        type="button"
        onClick={onPrevMonth}
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

      {/* Month and Year Selectors */}
      <div className="flex items-center gap-2">
        {/* Month Selector */}
        <div className="w-32">
          <Select
            options={getMonthOptions()}
            value={currentMonth.toString()}
            onChange={handleMonthSelect}
            placeholder="Select month"
            searchable
            searchPlaceholder="Search month..."
            fullWidth
          />
        </div>

        {/* Year Selector */}
        <div className="w-24">
          <Select
            options={getYearOptions()}
            value={currentYear.toString()}
            onChange={handleYearSelect}
            placeholder="Select year"
            searchable
            searchPlaceholder="Search year..."
            fullWidth
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNextMonth}
        disabled={!canNavigateNext}
        className="p-1.5 rounded-lg transition-colors"
        style={{
          color: canNavigateNext ? COLORS.textMuted : COLORS.border,
          cursor: canNavigateNext ? "pointer" : "not-allowed",
          opacity: canNavigateNext ? 1 : 0.5,
        }}
        onMouseEnter={(e) => {
          if (canNavigateNext) {
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
  );
};

export default MonthYearSelector;

