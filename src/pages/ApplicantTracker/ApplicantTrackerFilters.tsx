import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Select, MultiSelect, DatePicker, IntakeSelector } from "../../components";
import {
  adminOptions,
  managerOptions,
  applicantStageOptions,
  agencyPartnerOptions,
  universityOptions,
} from "../../constants";
import { counselors, courses } from "../../constants/mockData";

interface ApplicantTrackerFiltersProps {
  selectedAdmin: string;
  selectedManager: string;
  selectedCounselor: string;
  selectedUniversity: string;
  selectedCourse: string;
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
  onCourseChange: (value: string) => void;
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
  selectedAdmin,
  selectedManager,
  selectedCounselor,
  selectedUniversity,
  selectedCourse,
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
  onCourseChange,
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

  const universityOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectUniversity", "Select University") },
    ...universityOptions,
  ], [t]);

  const courseOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectCourse", "Select Course") },
    ...courses,
  ], [t]);

  const agencyPartnerOptionsWithPlaceholder = useMemo(() => [
    { value: "", label: t("applicantTracker.selectAgencyPartner", "Agency Partner") },
    ...agencyPartnerOptions,
  ], [t]);

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
        <div className="w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.adminLabel", "Admin")}
            options={adminOptionsWithPlaceholder}
            value={selectedAdmin}
            onChange={onAdminChange}
            searchable
          />
        </div>

        {/* Manager Select */}
        <div className="w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.managerLabel", "Manager")}
            options={managerOptionsWithPlaceholder}
            value={selectedManager}
            onChange={onManagerChange}
            searchable
          />
        </div>

        {/* Counselor Select */}
        <div className="w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.counselorLabel", "Counselor")}
            options={counselorOptionsWithPlaceholder}
            value={selectedCounselor}
            onChange={onCounselorChange}
            searchable
          />
        </div>

        {/* University Select */}
        <div className="w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.universityLabel", "University")}
            options={universityOptionsWithPlaceholder}
            value={selectedUniversity}
            onChange={onUniversityChange}
            searchable
          />
        </div>

        {/* Course Select */}
        <div className="w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.courseLabel", "Course")}
            options={courseOptionsWithPlaceholder}
            value={selectedCourse}
            onChange={onCourseChange}
            searchable
          />
        </div>

        {/* Applicant Stage MultiSelect */}
        <div className="w-[200px]">
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
        <div className="w-[200px]">
          <IntakeSelector
            label={t("applicantTracker.intakeLabel", "Intake")}
            value={selectedIntake}
            onChange={onIntakeChange}
            placeholder={t("applicantTracker.selectIntake", "Select Intake")}
          />
        </div>
      </div>

      {/* Second Row - Agency Partner, Date Pickers and Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Agency Partner Select */}
        <div className="w-[200px] applicant-tracker-filter-placeholder">
          <Select
            label={t("applicantTracker.agencyPartnerLabel", "Agency Partner")}
            options={agencyPartnerOptionsWithPlaceholder}
            value={selectedAgencyPartner}
            onChange={onAgencyPartnerChange}
            searchable
          />
        </div>

        {/* Applied From Date Picker */}
        <div className="w-[200px]">
          <DatePicker
            label={t("applicantTracker.appliedFromDateLabel", "Applied From Date")}
            value={appliedFromDate}
            onChange={onAppliedFromDateChange}
            placeholder={t("applicantTracker.appliedFromDate", "Applied From Date")}
          />
        </div>

        {/* Applied To Date Picker */}
        <div className="w-[200px]">
          <DatePicker
            label={t("applicantTracker.appliedToDateLabel", "Applied To Date")}
            value={appliedToDate}
            onChange={onAppliedToDateChange}
            placeholder={t("applicantTracker.appliedToDate", "Applied To Date")}
          />
        </div>

        {/* Last Updated From Date Picker */}
        <div className="w-[200px]">
          <DatePicker
            label={t("applicantTracker.lastUpdatedFromDateLabel", "Last Updated From Date")}
            value={lastUpdatedFromDate}
            onChange={onLastUpdatedFromDateChange}
            placeholder={t("applicantTracker.lastUpdatedFromDate", "Last Updated From Date")}
          />
        </div>

        {/* Last Updated To Date Picker */}
        <div className="w-[200px]">
          <DatePicker
            label={t("applicantTracker.lastUpdatedToDateLabel", "Last Updated To Date")}
            value={lastUpdatedToDate}
            onChange={onLastUpdatedToDateChange}
            placeholder={t("applicantTracker.lastUpdatedToDate", "Last Updated To Date")}
          />
        </div>

        {/* Filter Buttons - aligned with inputs */}
        <div className="flex items-end gap-3 pt-6">
          <Button 
            variant="accent" 
            size="sm" 
            rounded 
            onClick={onApplyFilters}
            style={{ minWidth: "100px" }}
          >
            {t("applicantTracker.applyFilter", "Apply")}
          </Button>
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
    </div>
  );
};

export default memo(ApplicantTrackerFilters);

