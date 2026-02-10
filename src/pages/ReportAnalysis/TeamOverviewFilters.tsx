import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select, DatePicker, type SelectOption } from "../../components";
import { UserRole } from "../../constants";

interface TeamOverviewFiltersProps {
  adminOptions: SelectOption[];
  managerOptions: SelectOption[];
  counselorOptions: SelectOption[];
  enrollmentTypeOptions: SelectOption[];
  selectedAdmin: string;
  selectedManager: string;
  selectedCounselor: string;
  selectedEnrollmentType: string;
  selectedFromDate: Date | null;
  selectedToDate: Date | null;
  onAdminChange: (value: string) => void;
  onManagerChange: (value: string) => void;
  onCounselorChange: (value: string) => void;
  onEnrollmentTypeChange: (value: string) => void;
  onFromDateChange: (date: Date | null) => void;
  onToDateChange: (date: Date | null) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  userRole?: string | null;
  isPrimaryAdmin?: boolean;
}

const TeamOverviewFilters = ({
  adminOptions,
  managerOptions,
  counselorOptions,
  enrollmentTypeOptions,
  selectedAdmin,
  selectedManager,
  selectedCounselor,
  selectedEnrollmentType,
  selectedFromDate,
  selectedToDate,
  onAdminChange,
  onManagerChange,
  onCounselorChange,
  onEnrollmentTypeChange,
  onFromDateChange,
  onToDateChange,
  onApplyFilters,
  onClearFilters,
  userRole,
  isPrimaryAdmin,
}: TeamOverviewFiltersProps) => {
  const { t } = useTranslation();

  // Determine which filters to show based on user role
  const showAdminFilter = useMemo(() => {
    const role = userRole?.toUpperCase() || "";
    return isPrimaryAdmin || role === UserRole.PRIMARY_ADMIN;
  }, [userRole, isPrimaryAdmin]);

  const showManagerFilter = useMemo(() => {
    const role = userRole?.toUpperCase() || "";
    // Show for PRIMARY_ADMIN, ADMIN, and ADMIN_BILLING
    return isPrimaryAdmin || role === UserRole.PRIMARY_ADMIN || role === UserRole.ADMIN || role === "ADMIN_BILLING";
  }, [userRole, isPrimaryAdmin]);

  const showCounselorFilter = useMemo(() => {
    const role = userRole?.toUpperCase() || "";
    // Show for PRIMARY_ADMIN, ADMIN, ADMIN_BILLING, MANAGER, and MANAGER_BILLING
    return isPrimaryAdmin || role === UserRole.PRIMARY_ADMIN || role === UserRole.ADMIN || role === "ADMIN_BILLING" || role === UserRole.MANAGER || role === "MANAGER_BILLING";
  }, [userRole, isPrimaryAdmin]);

  // Set max date to today to disable future dates
  const maxDate = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    return today;
  }, []);

  // Enrollment type options with placeholder
  const enrollmentTypeOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("dashboard.selectEnrollmentType", "Select Enrolment Type") },
    ...enrollmentTypeOptions,
  ], [t, enrollmentTypeOptions]);

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
    <div className="flex flex-wrap items-end gap-3">
      <style>{`
        .team-overview-filter-placeholder button > span.block.truncate {
          opacity: 0.7 !important;
        }
      `}</style>
      
      {/* Admin Select - Only show for PRIMARY_ADMIN */}
      {showAdminFilter && (
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-7*0.75rem)/8)] lg:min-w-[180px] team-overview-filter-placeholder">
          <Select
            label={t("reportAnalysis.teamOverview.adminLabel", "Admin")}
            options={adminOptionsWithPlaceholder}
            value={selectedAdmin}
            onChange={(value) => onAdminChange(value as string)}
            searchable
          />
        </div>
      )}

      {/* Manager Select - Show for PRIMARY_ADMIN and ADMIN */}
      {showManagerFilter && (
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-7*0.75rem)/8)] lg:min-w-[180px] team-overview-filter-placeholder">
          <Select
            label={t("reportAnalysis.teamOverview.managerLabel", "Manager")}
            options={managerOptionsWithPlaceholder}
            value={selectedManager}
            onChange={(value) => onManagerChange(value as string)}
            searchable
          />
        </div>
      )}

      {/* Counselor Select - Show for PRIMARY_ADMIN, ADMIN, and MANAGER */}
      {showCounselorFilter && (
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-7*0.75rem)/8)] lg:min-w-[180px] team-overview-filter-placeholder">
          <Select
            label={t("reportAnalysis.teamOverview.counselorLabel", "Counselor")}
            options={counselorOptionsWithPlaceholder}
            value={selectedCounselor}
            onChange={(value) => onCounselorChange(value as string)}
            searchable
          />
        </div>
      )}

      {/* Enrolment Type Select */}
      <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-7*0.75rem)/8)] lg:min-w-[180px] team-overview-filter-placeholder">
        <Select
          label={t("reportAnalysis.teamOverview.enrollmentTypeLabel", "Enrolment Type")}
          options={enrollmentTypeOptionsWithPlaceholder}
          value={selectedEnrollmentType}
          onChange={(value) => onEnrollmentTypeChange(value as string)}
          searchable
        />
      </div>

      {/* From Date Picker */}
      <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-7*0.75rem)/8)] lg:min-w-[180px]">
        <DatePicker
          label={t("reportAnalysis.teamOverview.fromDateLabel", "From Date")}
          value={selectedFromDate}
          onChange={onFromDateChange}
          placeholder={t("reportAnalysis.teamOverview.selectFromDate", "Select From Date")}
          fullWidth
          maxDate={maxDate}
        />
      </div>

      {/* To Date Picker */}
      <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-7*0.75rem)/8)] lg:min-w-[180px]">
        <DatePicker
          label={t("reportAnalysis.teamOverview.toDateLabel", "To Date")}
          value={selectedToDate}
          onChange={onToDateChange}
          placeholder={t("reportAnalysis.teamOverview.selectToDate", "Select To Date")}
          fullWidth
          maxDate={maxDate}
        />
      </div>

      {/* Filter Buttons */}
      <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-auto lg:w-auto flex items-end gap-3">
        <Button 
          variant="accent" 
          size="sm" 
          rounded 
          onClick={onApplyFilters}
          className="w-full sm:w-auto"
          style={{ minWidth: "100px" }}
        >
          {t("reportAnalysis.teamOverview.applyFilter", "Apply")}
        </Button>
        <Button 
          variant="cancel" 
          size="sm" 
          rounded 
          onClick={onClearFilters}
          className="w-full sm:w-auto"
          style={{ minWidth: "100px" }}
        >
          {t("reportAnalysis.teamOverview.clearFilter", "Clear Filter")}
        </Button>
      </div>
    </div>
  );
};

export default memo(TeamOverviewFilters);


