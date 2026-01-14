import React from "react";
import { Select, Button, IntakeSelector } from "../../../components";
import { programs, agencyPartners, COLORS } from "../../../constants";
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
  countryOptions?: SelectOption[]; // Countries from API
  universityOptions?: SelectOption[]; // Universities from API (filtered by country)
  campusOptions?: SelectOption[]; // Campuses from API (filtered by university)
  courseOptions?: SelectOption[]; // Courses from API (filtered by campus and course type)
  counselorOptions?: SelectOption[]; // Counselors from API (filtered by user role)
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
  countryOptions = [], // Default to empty array if not provided
  universityOptions = [], // Default to empty array if not provided
  campusOptions = [], // Default to empty array if not provided
  courseOptions = [], // Default to empty array if not provided
  counselorOptions = [], // Default to empty array if not provided
}: PreferenceFormProps) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={(e) => { e.preventDefault(); }}>
      <div className="space-y-4">
        {/* Form Fields Row 1: Country, Desired University, Desired Campus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Form Fields Row 2: Program, Course, Desired Intake */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Form Fields Row 3: Assign Counselor, Agency Partner Name, Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              options={agencyPartners}
              value={preference.agencyPartnerName}
              onChange={(value) => onFieldChange(index, "agencyPartnerName", value)}
              placeholder={t("applicant.selectAgencyPartner")}
              error={getFieldError(index, "agencyPartnerName")}
              fullWidth
              searchable
            />
          </div>

          <div className="w-full flex items-end justify-end gap-2">
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
        </div>
      </div>
    </form>
  );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(PreferenceForm);

