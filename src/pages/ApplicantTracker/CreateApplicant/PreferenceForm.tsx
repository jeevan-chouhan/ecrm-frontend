import React from "react";
import { Select, Button, IntakeSelector } from "../../../components";
import { programs, COLORS } from "../../../constants";
import { useTranslation } from "react-i18next";
import type { PreferenceItem } from "./types";
import type { SelectOption } from "../../../components";

interface PreferenceFormProps {
  preference: PreferenceItem;
  index: number;
  onFieldChange: (index: number, field: keyof PreferenceItem, value: string) => void;
  getFieldError: (index: number, fieldName: keyof PreferenceItem) => string | undefined;
  onCancel?: () => void;
  onAddMore?: () => void;
  showCancel?: boolean;
  showAddMore?: boolean;
  enrollmentTypeOptions?: SelectOption[]; // Enrollment types from API
  countryOptions?: SelectOption[]; // Countries from API
  universityOptions?: SelectOption[]; // Universities from API (filtered by country)
  campusOptions?: SelectOption[]; // Campuses from API (filtered by university)
  courseOptions?: SelectOption[]; // Courses from API (filtered by campus and course type)
  counselorOptions?: SelectOption[]; // Counselors from API (filtered by user role)
  agencyPartnerOptions?: SelectOption[]; // Agency partners from API
}

const PreferenceForm = ({
  preference,
  index,
  onFieldChange,
  getFieldError,
  onCancel,
  onAddMore,
  showCancel = false,
  showAddMore = false,
  enrollmentTypeOptions = [], // Default to empty array if not provided
  countryOptions = [], // Default to empty array if not provided
  universityOptions = [], // Default to empty array if not provided
  campusOptions = [], // Default to empty array if not provided
  courseOptions = [], // Default to empty array if not provided
  counselorOptions = [], // Default to empty array if not provided
  agencyPartnerOptions = [], // Default to empty array if not provided
}: PreferenceFormProps) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={(e) => { e.preventDefault(); }}>
      <div className="space-y-4">
        {/* Form Fields Row 1: Enrolment Type, Country, Desired University */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.enrollmentType")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Select
              options={enrollmentTypeOptions}
              value={preference.enrollmentType}
              onChange={(value) => onFieldChange(index, "enrollmentType", value)}
              placeholder={t("applicant.selectEnrollmentType")}
              error={getFieldError(index, "enrollmentType")}
              fullWidth
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.desiredCountry")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Select
              options={countryOptions}
              value={preference.desiredCountry}
              onChange={(value) => onFieldChange(index, "desiredCountry", value)}
              placeholder={t("applicant.selectCountry")}
              error={getFieldError(index, "desiredCountry")}
              fullWidth
              searchable
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.desiredUniversity")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Select
              options={universityOptions}
              value={preference.desiredUniversity}
              onChange={(value) => onFieldChange(index, "desiredUniversity", value)}
              placeholder={preference.desiredCountry ? t("applicant.selectUniversity") : t("applicant.selectCountryFirst", "Please select country first")}
              error={getFieldError(index, "desiredUniversity")}
              fullWidth
              searchable
              disabled={!preference.desiredCountry}
            />
          </div>
        </div>

        {/* Form Fields Row 2: Desired Campus, Program, Course */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.desiredCampus")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Select
              options={campusOptions}
              value={preference.desiredCampus}
              onChange={(value) => onFieldChange(index, "desiredCampus", value)}
              placeholder={preference.desiredUniversity ? t("applicant.selectCampus") : t("applicant.selectUniversityFirst", "Please select university first")}
              error={getFieldError(index, "desiredCampus")}
              fullWidth
              searchable
              disabled={!preference.desiredUniversity}
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.program")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Select
              options={programs}
              value={preference.program}
              onChange={(value) => onFieldChange(index, "program", value)}
              placeholder={t("applicant.selectProgram")}
              error={getFieldError(index, "program")}
              fullWidth
              searchable
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.course")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Select
              options={courseOptions}
              value={preference.course}
              onChange={(value) => onFieldChange(index, "course", value)}
              placeholder={preference.desiredCampus && preference.program ? t("applicant.selectCourse") : t("applicant.selectCampusAndProgram", "Please select campus and program first")}
              error={getFieldError(index, "course")}
              fullWidth
              searchable
              disabled={!preference.desiredCampus || !preference.program}
            />
          </div>
        </div>

        {/* Form Fields Row 3: Desired Intake, Assign Counselor, Agency Partner Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.desiredIntake")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <IntakeSelector
              value={preference.desiredIntake}
              onChange={(value) => onFieldChange(index, "desiredIntake", value)}
              placeholder={t("applicant.selectIntake")}
              error={getFieldError(index, "desiredIntake")}
              fullWidth
              allowPastMonths={false}
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.assignCounselor")}
            </label>
            <Select
              options={counselorOptions}
              value={preference.assignCounselor}
              onChange={(value) => onFieldChange(index, "assignCounselor", value)}
              placeholder={t("applicant.selectCounselor")}
              error={getFieldError(index, "assignCounselor")}
              fullWidth
              searchable
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.agencyPartnerName")}
            </label>
            <Select
              options={agencyPartnerOptions}
              value={preference.agencyPartnerName}
              onChange={(value) => onFieldChange(index, "agencyPartnerName", value)}
              placeholder={t("applicant.selectAgencyPartner")}
              error={getFieldError(index, "agencyPartnerName")}
              fullWidth
              searchable
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        {(showCancel || showAddMore) && (
          <div className="flex items-end justify-end gap-2">
            {showCancel && onCancel && (
              <Button
                type="button"
                variant="cancel"
                onClick={onCancel}
                rounded
              >
                {t("common.cancel")}
              </Button>
            )}
            {showAddMore && onAddMore && (
              <Button
                type="button"
                variant="accent"
                onClick={onAddMore}
                rounded
              >
                {t("common.addMore")}
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

// Memoize component with custom comparison to prevent unnecessary re-renders
export default React.memo(PreferenceForm, (prevProps, nextProps) => {
  // Deep comparison for preference object
  if (prevProps.preference.id !== nextProps.preference.id) return false;
  if (prevProps.preference.enrollmentType !== nextProps.preference.enrollmentType) return false;
  if (prevProps.preference.desiredCountry !== nextProps.preference.desiredCountry) return false;
  if (prevProps.preference.program !== nextProps.preference.program) return false;
  if (prevProps.preference.desiredUniversity !== nextProps.preference.desiredUniversity) return false;
  if (prevProps.preference.desiredCampus !== nextProps.preference.desiredCampus) return false;
  if (prevProps.preference.course !== nextProps.preference.course) return false;
  if (prevProps.preference.desiredIntake !== nextProps.preference.desiredIntake) return false;
  if (prevProps.preference.assignCounselor !== nextProps.preference.assignCounselor) return false;
  if (prevProps.preference.agencyPartnerName !== nextProps.preference.agencyPartnerName) return false;
  if (prevProps.preference.saved !== nextProps.preference.saved) return false;
  
  // Compare options arrays by reference (they're memoized)
  if (prevProps.countryOptions !== nextProps.countryOptions) return false;
  if (prevProps.universityOptions !== nextProps.universityOptions) return false;
  if (prevProps.campusOptions !== nextProps.campusOptions) return false;
  if (prevProps.courseOptions !== nextProps.courseOptions) return false;
  if (prevProps.counselorOptions !== nextProps.counselorOptions) return false;
  
  // Compare other props
  if (prevProps.index !== nextProps.index) return false;
  if (prevProps.showCancel !== nextProps.showCancel) return false;
  if (prevProps.showAddMore !== nextProps.showAddMore) return false;
  
  // Functions are stable (useCallback), so we don't need to compare them
  
  return true; // Props are equal, skip re-render
});

