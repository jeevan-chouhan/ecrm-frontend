import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select, MultiSelect, DatePicker, IntakeSelector, type SelectOption } from "../../components";
import {
  applicantStageOptions,
} from "../../constants";

interface ApplicantTrackerFiltersProps {
  adminOptions: SelectOption[];
  managerOptions: SelectOption[];
  counselorOptions: SelectOption[];
  universityOptions: SelectOption[];
  agencyPartnerOptions: SelectOption[];
  selectedAdmin: string;
  selectedManager: string;
  selectedCounselor: string;
  selectedUniversity: string;
  selectedApplicantStages: string[];
  selectedIntake: string;
  selectedAgencyPartner: string;
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
  onAgencyPartnerChange: (value: string) => void;
  onAppliedFromDateChange: (date: Date | null) => void;
  onAppliedToDateChange: (date: Date | null) => void;
  onLastUpdatedFromDateChange: (date: Date | null) => void;
  onLastUpdatedToDateChange: (date: Date | null) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const ApplicantTrackerFilters = ({
  adminOptions,
  managerOptions,
  counselorOptions,
  universityOptions,
  agencyPartnerOptions,
  selectedAdmin,
  selectedManager,
  selectedCounselor,
  selectedUniversity,
  selectedApplicantStages,
  selectedIntake,
  selectedAgencyPartner,
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
  onAgencyPartnerChange,
  onAppliedFromDateChange,
  onAppliedToDateChange,
  onLastUpdatedFromDateChange,
  onLastUpdatedToDateChange,
  onApplyFilters,
  onClearFilters,
}: ApplicantTrackerFiltersProps) => {
  const { t } = useTranslation();

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


  const agencyPartnerOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectAgencyPartner", "Agency Partner") },
    ...agencyPartnerOptions,
  ], [t, agencyPartnerOptions]);

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
        {/* Admin Select */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.adminLabel", "Admin")}
            options={adminOptionsWithPlaceholder}
            value={selectedAdmin}
            onChange={onAdminChange}
            searchable
          />
        </div>

        {/* Manager Select */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.managerLabel", "Manager")}
            options={managerOptionsWithPlaceholder}
            value={selectedManager}
            onChange={onManagerChange}
            searchable
          />
        </div>

        {/* Counselor Select */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.counselorLabel", "Counselor")}
            options={counselorOptionsWithPlaceholder}
            value={selectedCounselor}
            onChange={onCounselorChange}
            searchable
          />
        </div>

        {/* University Select */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.universityLabel", "University")}
            options={universityOptionsWithPlaceholder}
            value={selectedUniversity}
            onChange={onUniversityChange}
            searchable
          />
        </div>

        {/* Applicant Stage MultiSelect */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px]">
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
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px]">
          <IntakeSelector
            label={t("applicantTracker.intakeLabel", "Intake")}
            value={selectedIntake}
            onChange={onIntakeChange}
            placeholder={t("applicantTracker.selectIntake", "Select Intake")}
            fullWidth
          />
        </div>
      </div>

      {/* Second Row - Agency Partner, Date Pickers and Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Agency Partner Select */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.agencyPartnerLabel", "Agency Partner")}
            options={agencyPartnerOptionsWithPlaceholder}
            value={selectedAgencyPartner}
            onChange={onAgencyPartnerChange}
            searchable
          />
        </div>

        {/* Applied From Date Picker */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px]">
          <DatePicker
            label={t("applicantTracker.appliedFromDateLabel", "Applied From Date")}
            value={appliedFromDate}
            onChange={onAppliedFromDateChange}
            placeholder={t("applicantTracker.appliedFromDate", "Applied From Date")}
            fullWidth
            maxDate={maxDate}
          />
        </div>

        {/* Applied To Date Picker */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px]">
          <DatePicker
            label={t("applicantTracker.appliedToDateLabel", "Applied To Date")}
            value={appliedToDate}
            onChange={onAppliedToDateChange}
            placeholder={t("applicantTracker.appliedToDate", "Applied To Date")}
            fullWidth
            maxDate={maxDate}
          />
        </div>

        {/* Last Updated From Date Picker */}
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px]">
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
        <div className="w-full sm:w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc((100%-5*0.75rem)/6)] lg:min-w-[200px]">
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

