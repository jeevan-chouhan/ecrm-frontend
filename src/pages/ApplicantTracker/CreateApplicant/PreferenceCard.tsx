import React, { useMemo } from "react";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";
import { Edit, Trash } from "../../../assets";
import { useTranslation } from "react-i18next";
import PreferenceForm from "./PreferenceForm";
import type { PreferenceItem } from "./types";
import type { SelectOption } from "../../../components";

// Helper function to format intake value (e.g., "jan-2026" -> "Jan - 2026")
const formatIntakeDisplay = (intakeValue: string): string => {
  if (!intakeValue) return intakeValue;
  
  const parts = intakeValue.toLowerCase().split("-");
  if (parts.length !== 2) return intakeValue;
  
  const monthName = parts[0];
  const year = parts[1];
  
  const monthMap: Record<string, string> = {
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    may: "May",
    jun: "Jun",
    jul: "Jul",
    aug: "Aug",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dec",
  };
  
  const monthDisplay = monthMap[monthName] || monthName;
  return `${monthDisplay} - ${year}`;
};

interface PreferenceCardProps {
  preference: PreferenceItem;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFieldChange: (index: number, field: keyof PreferenceItem, value: string) => void;
  getFieldError: (index: number, fieldName: keyof PreferenceItem) => string | undefined;
  enrollmentTypeOptions?: SelectOption[]; // Enrollment types from API
  countryOptions?: SelectOption[]; // Countries from API
  universityOptions?: SelectOption[]; // Universities from API (filtered by country)
  campusOptions?: SelectOption[]; // Campuses from API (filtered by university)
  programTypeOptions?: SelectOption[]; // Program types from API
  courseOptions?: SelectOption[]; // Courses from API (filtered by campus and course type)
  counselorOptions?: SelectOption[]; // Counselors from API (filtered by user role)
  agencyPartnerOptions?: SelectOption[]; // Agency partners from API
}

const PreferenceCard = ({
  preference,
  index,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onFieldChange,
  getFieldError,
  enrollmentTypeOptions = [], // Default to empty array if not provided
  countryOptions = [], // Default to empty array if not provided
  universityOptions = [], // Default to empty array if not provided
  campusOptions = [], // Default to empty array if not provided
  programTypeOptions = [], // Default to empty array if not provided
  courseOptions = [], // Default to empty array if not provided
  counselorOptions = [], // Default to empty array if not provided
  agencyPartnerOptions = [], // Default to empty array if not provided
}: PreferenceCardProps) => {
  const { t } = useTranslation();

  // Check if agency partner name should be shown
  const shouldShowAgencyPartner = preference.enrollmentType !== "WALK_IN";

  // Memoize label lookups to prevent recalculation on every render
  const labels = useMemo(() => ({
    enrollmentType: enrollmentTypeOptions.find((e) => e.value === preference.enrollmentType)?.label || preference.enrollmentType,
    country: countryOptions.find((c) => c.value === preference.desiredCountry)?.label || preference.desiredCountry,
    program: programTypeOptions.find((p) => p.value === preference.program)?.label || preference.program,
    university: universityOptions.find((u) => u.value === preference.desiredUniversity)?.label || preference.desiredUniversity,
    campus: campusOptions.find((c) => c.value === preference.desiredCampus)?.label || preference.desiredCampus,
    course: preference.courseName || courseOptions.find((c) => c.value === preference.course)?.label || preference.course,
    intake: formatIntakeDisplay(preference.desiredIntake),
    counselor: counselorOptions.find((c) => c.value === preference.assignCounselor)?.label || preference.assignCounselor,
    agency: agencyPartnerOptions.find((a) => a.value === preference.agencyPartnerName)?.label || preference.agencyPartnerName,
  }), [
    preference.enrollmentType,
    preference.desiredCountry,
    preference.program,
    preference.desiredUniversity,
    preference.desiredCampus,
    preference.course,
    preference.courseName,
    preference.desiredIntake,
    preference.assignCounselor,
    preference.agencyPartnerName,
    enrollmentTypeOptions,
    countryOptions,
    universityOptions,
    campusOptions,
    programTypeOptions,
    courseOptions,
    counselorOptions,
    agencyPartnerOptions,
  ]);

  if (isEditing) {
    return (
      <div
        className="p-4 rounded-lg border"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
      >
        <PreferenceForm
          preference={preference}
          index={index}
          onFieldChange={onFieldChange}
          getFieldError={getFieldError}
          showCancel={false}
          showAddMore={false}
          enrollmentTypeOptions={enrollmentTypeOptions}
          countryOptions={countryOptions}
          universityOptions={universityOptions}
          campusOptions={campusOptions}
          programTypeOptions={programTypeOptions}
          courseOptions={courseOptions}
          counselorOptions={counselorOptions}
          agencyPartnerOptions={agencyPartnerOptions}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <Button
            type="button"
            variant="accent"
            onClick={onSave}
            rounded
          >
            {t("common.save")}
          </Button>
          <Button
            type="button"
            variant="cancel"
            onClick={onCancel}
            rounded
          >
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
    >
      <div className="space-y-3">
        {/* Display mode - show read-only values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.enrollmentType")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.enrollmentType}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredCountry")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.country}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredUniversity")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.university}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredCampus")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.campus}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.program")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.program}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.course")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.course}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredIntake")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.intake}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.assignCounselor")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.counselor}
            </p>
          </div>
          {shouldShowAgencyPartner && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
                {t("applicant.agencyPartnerName")}
              </p>
              <p className="text-sm" style={{ color: COLORS.textDark }}>
                {labels.agency}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Edit className="h-5 w-5" style={{ color: COLORS.accent }} />}
            iconOnly
            onClick={onEdit}
            title={t("common.edit")}
            rounded
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Trash className="h-5 w-5" style={{ color: COLORS.error }} />}
            iconOnly
            onClick={onDelete}
            title={t("common.delete")}
            rounded
          />
        </div>
      </div>
    </div>
  );
};

// Memoize component with custom comparison to prevent unnecessary re-renders
export default React.memo(PreferenceCard, (prevProps, nextProps) => {
  // Compare preference object fields
  if (prevProps.preference.id !== nextProps.preference.id) return false;
  if (prevProps.preference.enrollmentType !== nextProps.preference.enrollmentType) return false;
  if (prevProps.preference.desiredCountry !== nextProps.preference.desiredCountry) return false;
  if (prevProps.preference.program !== nextProps.preference.program) return false;
  if (prevProps.preference.desiredUniversity !== nextProps.preference.desiredUniversity) return false;
  if (prevProps.preference.desiredCampus !== nextProps.preference.desiredCampus) return false;
  if (prevProps.preference.course !== nextProps.preference.course) return false;
  if (prevProps.preference.courseName !== nextProps.preference.courseName) return false;
  if (prevProps.preference.desiredIntake !== nextProps.preference.desiredIntake) return false;
  if (prevProps.preference.assignCounselor !== nextProps.preference.assignCounselor) return false;
  if (prevProps.preference.agencyPartnerName !== nextProps.preference.agencyPartnerName) return false;
  if (prevProps.preference.saved !== nextProps.preference.saved) return false;
  if (prevProps.isEditing !== nextProps.isEditing) return false;
  if (prevProps.index !== nextProps.index) return false;
  
  // Compare options arrays by reference (they should be memoized)
  // Use shallow comparison - if references are the same, arrays haven't changed
  if (prevProps.enrollmentTypeOptions !== nextProps.enrollmentTypeOptions) return false;
  if (prevProps.countryOptions !== nextProps.countryOptions) return false;
  if (prevProps.universityOptions !== nextProps.universityOptions) return false;
  if (prevProps.campusOptions !== nextProps.campusOptions) return false;
  if (prevProps.courseOptions !== nextProps.courseOptions) return false;
  if (prevProps.counselorOptions !== nextProps.counselorOptions) return false;
  if (prevProps.agencyPartnerOptions !== nextProps.agencyPartnerOptions) return false;
  
  // Functions are stable (useCallback), so we don't need to compare them
  
  return true; // Props are equal, skip re-render
});

