import React from "react";
import { Select, Button, IntakeSelector } from "../../../components";
import { countries, programs, universities, campuses, courses, counselors, agencyPartners, COLORS } from "../../../constants";
import { useTranslation } from "react-i18next";
import type { PreferenceItem } from "./types";

interface PreferenceFormProps {
  preference: PreferenceItem;
  index: number;
  onFieldChange: (index: number, field: keyof PreferenceItem, value: string) => void;
  getFieldError: (index: number, fieldName: keyof PreferenceItem) => string | undefined;
  onCancel?: () => void;
  onAddMore?: () => void;
  showCancel?: boolean;
  showAddMore?: boolean;
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
              options={countries}
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
              options={universities}
              value={preference.desiredUniversity}
              onChange={(value) => onFieldChange(index, "desiredUniversity", value)}
              placeholder={t("applicant.selectUniversity")}
              error={getFieldError(index, "desiredUniversity")}
              fullWidth
              searchable
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
              options={campuses}
              value={preference.desiredCampus}
              onChange={(value) => onFieldChange(index, "desiredCampus", value)}
              placeholder={t("applicant.selectCampus")}
              error={getFieldError(index, "desiredCampus")}
              fullWidth
              searchable
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
              options={courses}
              value={preference.course}
              onChange={(value) => onFieldChange(index, "course", value)}
              placeholder={t("applicant.selectCourse")}
              error={getFieldError(index, "course")}
              fullWidth
              searchable
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
              options={counselors}
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

