import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select, DateRangePicker, type SelectOption, type DateRange } from "../../components";
import { enrollmentTypes } from "../../constants";

interface TeamOverviewFiltersProps {
  adminOptions: SelectOption[];
  managerOptions: SelectOption[];
  counselorOptions: SelectOption[];
  selectedAdmin: string;
  selectedManager: string;
  selectedCounselor: string;
  selectedEnrollmentType: string;
  selectedDateRange: DateRange;
  onAdminChange: (value: string) => void;
  onManagerChange: (value: string) => void;
  onCounselorChange: (value: string) => void;
  onEnrollmentTypeChange: (value: string) => void;
  onDateRangeChange: (dateRange: DateRange) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const TeamOverviewFilters = ({
  adminOptions,
  managerOptions,
  counselorOptions,
  selectedAdmin,
  selectedManager,
  selectedCounselor,
  selectedEnrollmentType,
  selectedDateRange,
  onAdminChange,
  onManagerChange,
  onCounselorChange,
  onEnrollmentTypeChange,
  onDateRangeChange,
  onApplyFilters,
  onClearFilters,
}: TeamOverviewFiltersProps) => {
  const { t } = useTranslation();

  // Enrollment type options with placeholder
  const enrollmentTypeOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("dashboard.selectEnrollmentType", "Select Enrollment Type") },
    ...enrollmentTypes.map((type) => ({
      value: type.value,
      label: t(`enrollmentType.${type.value}`, type.label),
    })),
  ], [t]);

  // Admin options with placeholder
  const adminOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("dashboard.selectAdmin", "Select Admin") },
    ...adminOptions,
  ], [adminOptions, t]);

  // Manager options with placeholder
  const managerOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("dashboard.selectManager", "Select Manager") },
    ...managerOptions,
  ], [managerOptions, t]);

  // Counselor options with placeholder
  const counselorOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("dashboard.selectCounselor", "Select Counselor") },
    ...counselorOptions,
  ], [counselorOptions, t]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <style>{`
        .team-overview-filter-placeholder button > span.block.truncate {
          opacity: 0.7 !important;
        }
        .team-overview-date-range-placeholder button > span.block.truncate {
          opacity: 0.7 !important;
        }
      `}</style>
      
      {/* Admin Select */}
      <div className="w-56 team-overview-filter-placeholder">
        <Select
          label={t("reportAnalysis.teamOverview.adminLabel", "Admin")}
          options={adminOptionsWithPlaceholder}
          value={selectedAdmin}
          onChange={(value) => onAdminChange(value as string)}
          searchable
        />
      </div>

      {/* Manager Select */}
      <div className="w-56 team-overview-filter-placeholder">
        <Select
          label={t("reportAnalysis.teamOverview.managerLabel", "Manager")}
          options={managerOptionsWithPlaceholder}
          value={selectedManager}
          onChange={(value) => onManagerChange(value as string)}
          searchable
        />
      </div>

      {/* Counselor Select */}
      <div className="w-56 team-overview-filter-placeholder">
        <Select
          label={t("reportAnalysis.teamOverview.counselorLabel", "Counselor")}
          options={counselorOptionsWithPlaceholder}
          value={selectedCounselor}
          onChange={(value) => onCounselorChange(value as string)}
          searchable
        />
      </div>

      {/* Enrollment Type Select */}
      <div className="w-56 team-overview-filter-placeholder">
        <Select
          label={t("reportAnalysis.teamOverview.enrollmentTypeLabel", "Enrollment Type")}
          options={enrollmentTypeOptionsWithPlaceholder}
          value={selectedEnrollmentType}
          onChange={(value) => onEnrollmentTypeChange(value as string)}
          searchable
        />
      </div>

      {/* Date Range Picker */}
      <div className="w-56 team-overview-date-range-placeholder">
        <DateRangePicker
          label={t("reportAnalysis.teamOverview.dateRangeLabel", "Date Range")}
          value={selectedDateRange}
          onChange={onDateRangeChange}
          placeholder={t("reportAnalysis.teamOverview.selectDateRange", "Select Date Range")}
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-end gap-3 pt-6">
        <Button variant="accent" size="sm" rounded onClick={onApplyFilters}>
          {t("reportAnalysis.teamOverview.applyFilter", "Apply")}
        </Button>
        <Button variant="cancel" size="sm" rounded onClick={onClearFilters}>
          {t("reportAnalysis.teamOverview.clearFilter", "Clear Filter")}
        </Button>
      </div>
    </div>
  );
};

export default memo(TeamOverviewFilters);


