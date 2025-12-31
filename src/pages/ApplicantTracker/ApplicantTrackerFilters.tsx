import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select, MultiSelect, DatePicker } from "../../components";
import {
  adminOptions,
  managerOptions,
  applicantStageOptions,
  applicantStatusOptions,
  intakeOptions,
  enrollmentTypes,
  agencyPartnerOptions,
} from "../../constants";
import { counselors } from "../../constants/mockData";

interface ApplicantTrackerFiltersProps {
  selectedAdmin: string;
  selectedManager: string;
  selectedCounselor: string;
  selectedApplicantStages: string[];
  selectedStatus: string;
  selectedIntake: string;
  selectedEnrollmentType: string;
  selectedAgencyPartner: string;
  startDate: Date | null;
  endDate: Date | null;
  onAdminChange: (value: string) => void;
  onManagerChange: (value: string) => void;
  onCounselorChange: (value: string) => void;
  onApplicantStagesChange: (values: string[]) => void;
  onStatusChange: (value: string) => void;
  onIntakeChange: (value: string) => void;
  onEnrollmentTypeChange: (value: string) => void;
  onAgencyPartnerChange: (value: string) => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const ApplicantTrackerFilters = ({
  selectedAdmin,
  selectedManager,
  selectedCounselor,
  selectedApplicantStages,
  selectedStatus,
  selectedIntake,
  selectedEnrollmentType,
  selectedAgencyPartner,
  startDate,
  endDate,
  onAdminChange,
  onManagerChange,
  onCounselorChange,
  onApplicantStagesChange,
  onStatusChange,
  onIntakeChange,
  onEnrollmentTypeChange,
  onAgencyPartnerChange,
  onStartDateChange,
  onEndDateChange,
  onApplyFilters,
  onClearFilters,
}: ApplicantTrackerFiltersProps) => {
  const { t } = useTranslation();

  // Memoize options with placeholders to prevent recreation on every render
  const adminOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectAdmin", "Select Admin") },
    ...adminOptions,
  ], [t]);

  const managerOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectManager", "Select Manager") },
    ...managerOptions,
  ], [t]);

  const counselorOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectCounselor", "Select Counselor") },
    ...counselors,
  ], [t]);

  const statusOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectStatus", "Select Status") },
    ...applicantStatusOptions,
  ], [t]);

  const intakeOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectIntake", "Select Intake") },
    ...intakeOptions,
  ], [t]);

  const enrollmentTypeOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectEnrollmentType", "Select Enrollment Type") },
    ...enrollmentTypes,
  ], [t]);

  const agencyPartnerOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectAgencyPartner", "Agency Partner") },
    ...agencyPartnerOptions,
  ], [t]);

  return (
    <div className="space-y-3">
      {/* First Row - 6 Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Admin Select */}
        <div className="flex-1 min-w-[160px]">
          <Select
            label={t("applicantTracker.adminLabel", "Admin")}
            options={adminOptionsWithPlaceholder}
            value={selectedAdmin}
            onChange={onAdminChange}
            searchable
          />
        </div>

        {/* Manager Select */}
        <div className="flex-1 min-w-[160px]">
          <Select
            label={t("applicantTracker.managerLabel", "Manager")}
            options={managerOptionsWithPlaceholder}
            value={selectedManager}
            onChange={onManagerChange}
            searchable
          />
        </div>

        {/* Counselor Select */}
        <div className="flex-1 min-w-[160px]">
          <Select
            label={t("applicantTracker.counselorLabel", "Counselor")}
            options={counselorOptionsWithPlaceholder}
            value={selectedCounselor}
            onChange={onCounselorChange}
            searchable
          />
        </div>

        {/* Applicant Stage MultiSelect */}
        <div className="flex-1 min-w-[160px]">
          <MultiSelect
            label={t("applicantTracker.applicantStageLabel", "Applicant Stage")}
            options={applicantStageOptions}
            value={selectedApplicantStages}
            onChange={onApplicantStagesChange}
            placeholder={t("applicantTracker.selectApplicantStage", "Select Applicant Stage")}
            searchable
          />
        </div>

        {/* Status Select */}
        <div className="flex-1 min-w-[160px]">
          <Select
            label={t("applicantTracker.statusLabel", "Status")}
            options={statusOptionsWithPlaceholder}
            value={selectedStatus}
            onChange={onStatusChange}
            searchable
          />
        </div>

        {/* Intake Select */}
        <div className="flex-1 min-w-[160px]">
          <Select
            label={t("applicantTracker.intakeLabel", "Intake")}
            options={intakeOptionsWithPlaceholder}
            value={selectedIntake}
            onChange={onIntakeChange}
            searchable
          />
        </div>
      </div>

      {/* Second Row - Remaining Dropdowns, Date Pickers and Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Enrollment Type Select */}
        <div className="flex-1 min-w-[160px]">
          <Select
            label={t("applicantTracker.enrollmentTypeLabel", "Enrollment Type")}
            options={enrollmentTypeOptionsWithPlaceholder}
            value={selectedEnrollmentType}
            onChange={onEnrollmentTypeChange}
            searchable
          />
        </div>

        {/* Agency Partner Select */}
        <div className="flex-1 min-w-[160px]">
          <Select
            label={t("applicantTracker.agencyPartnerLabel", "Agency Partner")}
            options={agencyPartnerOptionsWithPlaceholder}
            value={selectedAgencyPartner}
            onChange={onAgencyPartnerChange}
            searchable
          />
        </div>

        {/* From Date Picker */}
        <div className="flex-1 min-w-[160px]">
          <DatePicker
            label={t("applicantTracker.fromDateLabel", "From Date")}
            value={startDate}
            onChange={onStartDateChange}
            placeholder={t("applicantTracker.fromDate", "From Date")}
          />
        </div>

        {/* To Date Picker */}
        <div className="flex-1 min-w-[160px]">
          <DatePicker
            label={t("applicantTracker.toDateLabel", "To Date")}
            value={endDate}
            onChange={onEndDateChange}
            placeholder={t("applicantTracker.toDate", "To Date")}
          />
        </div>

        {/* Apply Filter Button */}
        <Button 
          variant="accent" 
          size="sm" 
          rounded 
          onClick={onApplyFilters}
          style={{ minWidth: "100px" }}
        >
          {t("applicantTracker.applyFilter", "Apply")}
        </Button>

        {/* Clear Filter Button */}
        <Button 
          variant="cancel" 
          size="sm" 
          rounded 
          onClick={onClearFilters}
          style={{ minWidth: "100px" }}
        >
          {t("applicantTracker.clearFilter", "Clear Filter")}
        </Button>
      </div>
    </div>
  );
};

export default memo(ApplicantTrackerFilters);

