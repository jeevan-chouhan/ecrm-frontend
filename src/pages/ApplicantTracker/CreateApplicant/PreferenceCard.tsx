import React, { useMemo } from "react";
import { Button } from "../../../components";
import { COLORS, countries, programs, universities, campuses, courses, intakes, counselors, agencyPartners } from "../../../constants";
import { Edit, Trash } from "../../../assets";
import { useTranslation } from "react-i18next";
import PreferenceForm from "./PreferenceForm";
import type { PreferenceItem } from "./types";

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
}: PreferenceCardProps) => {
  const { t } = useTranslation();

  // Memoize label lookups to prevent recalculation on every render
  const labels = useMemo(() => ({
    country: countries.find((c) => c.value === preference.desiredCountry)?.label || preference.desiredCountry,
    program: programs.find((p) => p.value === preference.program)?.label || preference.program,
    university: universities.find((u) => u.value === preference.desiredUniversity)?.label || preference.desiredUniversity,
    campus: campuses.find((c) => c.value === preference.desiredCampus)?.label || preference.desiredCampus,
    course: courses.find((c) => c.value === preference.course)?.label || preference.course,
    intake: intakes.find((i) => i.value === preference.desiredIntake)?.label || preference.desiredIntake,
    counselor: counselors.find((c) => c.value === preference.assignCounselor)?.label || preference.assignCounselor,
    agency: agencyPartners.find((a) => a.value === preference.agencyPartnerName)?.label || preference.agencyPartnerName,
  }), [
    preference.desiredCountry,
    preference.program,
    preference.desiredUniversity,
    preference.desiredCampus,
    preference.course,
    preference.desiredIntake,
    preference.assignCounselor,
    preference.agencyPartnerName,
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
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.program")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.program}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.course")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.course}
            </p>
          </div>
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.agencyPartnerName")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.agency}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredCampus")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {labels.campus}
            </p>
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
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(PreferenceCard);

