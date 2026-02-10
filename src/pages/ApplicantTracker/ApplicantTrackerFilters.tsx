import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select, MultiSelect, DatePicker, IntakeSelector, type SelectOption } from "../../components";
import {
  applicantStageOptions,
  UserRole,
} from "../../constants";

interface ApplicantTrackerFiltersProps {
  adminOptions: SelectOption[];
  managerOptions: SelectOption[];
  counselorOptions: SelectOption[];
  universityOptions: SelectOption[];
  enrollmentTypeOptions: SelectOption[];
  selectedAdmin: string;
  selectedManager: string;
  selectedCounselor: string;
  selectedUniversity: string;
  selectedApplicantStages: string[];
  selectedIntake: string;
  selectedEnrollmentType: string;
  appliedFromDate: Date | null;
  appliedToDate: Date | null;
  lastUpdatedFromDate: Date | null;
  lastUpdatedToDate: Date | null;
  onAdminChange: (value: string) => void;
  onManagerChange: (value: string) => void;
  onCounselorChange: (value: string) => void;
  onUniversityChange: (value: string) => void;
  onApplicantStagesChange: (values: string[]) => void;
  onIntakeChange: (value: string) => void;
  onEnrollmentTypeChange: (value: string) => void;
  onAppliedFromDateChange: (date: Date | null) => void;
  onAppliedToDateChange: (date: Date | null) => void;
  onLastUpdatedFromDateChange: (date: Date | null) => void;
  onLastUpdatedToDateChange: (date: Date | null) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  userRole?: string | null;
  isPrimaryAdmin?: boolean;
}

const ApplicantTrackerFilters = ({
  adminOptions,
  managerOptions,
  counselorOptions,
  universityOptions,
  enrollmentTypeOptions,
  selectedAdmin,
  selectedManager,
  selectedCounselor,
  selectedUniversity,
  selectedApplicantStages,
  selectedIntake,
  selectedEnrollmentType,
  appliedFromDate,
  appliedToDate,
  lastUpdatedFromDate,
  lastUpdatedToDate,
  onAdminChange,
  onManagerChange,
  onCounselorChange,
  onUniversityChange,
  onApplicantStagesChange,
  onIntakeChange,
  onEnrollmentTypeChange,
  onAppliedFromDateChange,
  onAppliedToDateChange,
  onLastUpdatedFromDateChange,
  onLastUpdatedToDateChange,
  onApplyFilters,
  onClearFilters,
  userRole,
  isPrimaryAdmin,
}: ApplicantTrackerFiltersProps) => {
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

  // Check if any dropdown is hidden (to determine if Enrollment Type should move to first row)
  const hasHiddenDropdowns = useMemo(() => {
    return !showAdminFilter || !showManagerFilter || !showCounselorFilter;
  }, [showAdminFilter, showManagerFilter, showCounselorFilter]);

  // Check if user is Manager, Manager_Billing, or Counsellor
  // For these roles, we show Applied dates in first row after Enrollment Type
  const isCounselorOnly = useMemo(() => {
    const role = userRole?.toUpperCase() || "";
    // For MANAGER/MANAGER_BILLING: Admin and Manager filters are hidden, only Counselor filter is visible
    // For COUNSELLOR: Admin, Manager, and Counselor filters are all hidden
    const isManagerOrManagerBilling = role === UserRole.MANAGER || role === "MANAGER_BILLING";
    const isCounsellor = role === UserRole.COUNSELLOR;
    
    // For Manager/Manager_Billing: Admin hidden AND Manager hidden AND Counselor visible
    if (isManagerOrManagerBilling) {
      return !showAdminFilter && !showManagerFilter && showCounselorFilter;
    }
    
    // For Counsellor: Admin hidden AND Manager hidden AND Counselor hidden
    if (isCounsellor) {
      return !showAdminFilter && !showManagerFilter && !showCounselorFilter;
    }
    
    return false;
  }, [userRole, showAdminFilter, showManagerFilter, showCounselorFilter]);

  // Fixed width class to maintain original dropdown size
  const filterWidthClass = "w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px]";

  // Set max date to today to disable future dates
  const maxDate = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    return today;
  }, []);

  // Memoize options with placeholders to prevent recreation on every render
  const adminOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectAdmin", "Select Admin") },
    ...adminOptions,
  ], [t, adminOptions]);

  const managerOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectManager", "Select Manager") },
    ...managerOptions,
  ], [t, managerOptions]);

  const counselorOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectCounselor", "Select Counselor") },
    ...counselorOptions,
  ], [t, counselorOptions]);

  const universityOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectUniversity", "Select University") },
    ...universityOptions,
  ], [t, universityOptions]);


  const enrollmentTypeOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectEnrollmentType", "Select Enrolment Type") },
    ...enrollmentTypeOptions,
  ], [t, enrollmentTypeOptions]);

  return (
    <div className="space-y-3">
      <style>{`
        /* Override placeholder colors with opacity for date pickers and agency filter */
        .applicant-tracker-filter-placeholder button > span.block.truncate {
          opacity: 0.7 !important;
        }
      `}</style>
      {/* First Row - Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Admin Select - Only show for PRIMARY_ADMIN */}
        {showAdminFilter && (
          <div className={`${filterWidthClass} applicant-tracker-filter-placeholder`}>
            <Select
              label={t("applicantTracker.adminLabel", "Admin")}
              options={adminOptionsWithPlaceholder}
              value={selectedAdmin}
              onChange={onAdminChange}
              searchable
            />
          </div>
        )}

        {/* Manager Select - Show for PRIMARY_ADMIN and ADMIN */}
        {showManagerFilter && (
          <div className={`${filterWidthClass} applicant-tracker-filter-placeholder`}>
            <Select
              label={t("applicantTracker.managerLabel", "Manager")}
              options={managerOptionsWithPlaceholder}
              value={selectedManager}
              onChange={onManagerChange}
              searchable
            />
          </div>
        )}

        {/* Counselor Select - Show for PRIMARY_ADMIN, ADMIN, and MANAGER */}
        {showCounselorFilter && (
          <div className={`${filterWidthClass} applicant-tracker-filter-placeholder`}>
            <Select
              label={t("applicantTracker.counselorLabel", "Counselor")}
              options={counselorOptionsWithPlaceholder}
              value={selectedCounselor}
              onChange={onCounselorChange}
              searchable
            />
          </div>
        )}

        {/* University Select */}
        <div className={`${filterWidthClass} applicant-tracker-filter-placeholder`}>
          <Select
            label={t("applicantTracker.universityLabel", "University")}
            options={universityOptionsWithPlaceholder}
            value={selectedUniversity}
            onChange={onUniversityChange}
            searchable
          />
        </div>

        {/* Applicant Stage MultiSelect */}
        <div className={filterWidthClass}>
          <MultiSelect
            label={t("applicantTracker.applicantStageLabel", "Applicant Stage")}
            options={applicantStageOptions}
            value={selectedApplicantStages}
            onChange={onApplicantStagesChange}
            placeholder={t("applicantTracker.selectApplicantStage", "Select Applicant Stage")}
            searchable
          />
        </div>

        {/* Intake Select */}
        <div className={filterWidthClass}>
          <IntakeSelector
            label={t("applicantTracker.intakeLabel", "Intake")}
            value={selectedIntake}
            onChange={onIntakeChange}
            placeholder={t("applicantTracker.selectIntake", "Select Intake")}
            fullWidth
          />
        </div>

        {/* Enrollment Type Select - Show in first row if any dropdowns are hidden */}
        {hasHiddenDropdowns && (
          <div className={`${filterWidthClass} applicant-tracker-filter-placeholder`}>
            <Select
              label={t("applicantTracker.enrollmentTypeLabel", "Enrolment Type")}
              options={enrollmentTypeOptionsWithPlaceholder}
              value={selectedEnrollmentType}
              onChange={onEnrollmentTypeChange}
              searchable
            />
          </div>
        )}

        {/* Applied From Date - Show in first row after Enrollment Type for Counselor role */}
        {isCounselorOnly && (
          <div className={filterWidthClass}>
            <DatePicker
              label={t("applicantTracker.appliedFromDateLabel", "Applied From Date")}
              value={appliedFromDate}
              onChange={onAppliedFromDateChange}
              placeholder={t("applicantTracker.appliedFromDate", "Applied From Date")}
              fullWidth
              maxDate={maxDate}
            />
          </div>
        )}

        {/* Applied To Date - Show in first row after Agency for Counselor role */}
        {isCounselorOnly && (
          <div className={filterWidthClass}>
            <DatePicker
              label={t("applicantTracker.appliedToDateLabel", "Applied To Date")}
              value={appliedToDate}
              onChange={onAppliedToDateChange}
              placeholder={t("applicantTracker.appliedToDate", "Applied To Date")}
              fullWidth
              maxDate={maxDate}
            />
          </div>
        )}
      </div>

      {/* Second Row - Enrollment Type (if no dropdowns hidden), Date Pickers and Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Enrollment Type Select - Show in second row only if no dropdowns are hidden */}
        {!hasHiddenDropdowns && (
          <div className={`${filterWidthClass} applicant-tracker-filter-placeholder`}>
            <Select
              label={t("applicantTracker.enrollmentTypeLabel", "Enrolment Type")}
              options={enrollmentTypeOptionsWithPlaceholder}
              value={selectedEnrollmentType}
              onChange={onEnrollmentTypeChange}
              searchable
            />
          </div>
        )}

        {/* Applied From Date Picker - Show in second row only if NOT Counselor role */}
        {!isCounselorOnly && (
          <div className={filterWidthClass}>
            <DatePicker
              label={t("applicantTracker.appliedFromDateLabel", "Applied From Date")}
              value={appliedFromDate}
              onChange={onAppliedFromDateChange}
              placeholder={t("applicantTracker.appliedFromDate", "Applied From Date")}
              fullWidth
              maxDate={maxDate}
            />
          </div>
        )}

        {/* Applied To Date Picker - Show in second row only if NOT Counselor role */}
        {!isCounselorOnly && (
          <div className={filterWidthClass}>
            <DatePicker
              label={t("applicantTracker.appliedToDateLabel", "Applied To Date")}
              value={appliedToDate}
              onChange={onAppliedToDateChange}
              placeholder={t("applicantTracker.appliedToDate", "Applied To Date")}
              fullWidth
              maxDate={maxDate}
            />
          </div>
        )}

        {/* Last Updated From Date Picker */}
        <div className={filterWidthClass}>
          <DatePicker
            label={t("applicantTracker.lastUpdatedFromDateLabel", "Last Updated From Date")}
            value={lastUpdatedFromDate}
            onChange={onLastUpdatedFromDateChange}
            placeholder={t("applicantTracker.lastUpdatedFromDate", "Last Updated From Date")}
            fullWidth
            maxDate={maxDate}
          />
        </div>

        {/* Last Updated To Date Picker */}
        <div className={filterWidthClass}>
          <DatePicker
            label={t("applicantTracker.lastUpdatedToDateLabel", "Last Updated To Date")}
            value={lastUpdatedToDate}
            onChange={onLastUpdatedToDateChange}
            placeholder={t("applicantTracker.lastUpdatedToDate", "Last Updated To Date")}
            fullWidth
            maxDate={maxDate}
          />
        </div>

        {/* Filter Buttons - aligned with inputs */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-auto lg:w-auto flex items-end gap-3 pt-0 sm:pt-6">
          <Button 
            variant="accent" 
            size="sm" 
            rounded 
            onClick={onApplyFilters}
            className="w-full sm:w-auto"
            style={{ minWidth: "100px" }}
          >
            {t("applicantTracker.applyFilter", "Apply")}
          </Button>
          <Button 
            variant="cancel" 
            size="sm" 
            rounded 
            onClick={onClearFilters}
            className="w-full sm:w-auto"
            style={{ minWidth: "100px" }}
          >
            {t("applicantTracker.clearFilter", "Clear Filter")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(ApplicantTrackerFilters);

