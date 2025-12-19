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

  const countryLabel = countries.find((c) => c.value === preference.desiredCountry)?.label || preference.desiredCountry;
  const programLabel = programs.find((p) => p.value === preference.program)?.label || preference.program;
  const universityLabel = universities.find((u) => u.value === preference.desiredUniversity)?.label || preference.desiredUniversity;
  const campusLabel = campuses.find((c) => c.value === preference.desiredCampus)?.label || preference.desiredCampus;
  const courseLabel = courses.find((c) => c.value === preference.course)?.label || preference.course;
  const intakeLabel = intakes.find((i) => i.value === preference.desiredIntake)?.label || preference.desiredIntake;
  const counselorLabel = counselors.find((c) => c.value === preference.assignCounselor)?.label || preference.assignCounselor;
  const agencyLabel = agencyPartners.find((a) => a.value === preference.agencyPartnerName)?.label || preference.agencyPartnerName;

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
          >
            {t("common.save")}
          </Button>
          <Button
            type="button"
            variant="cancel"
            onClick={onCancel}
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
              {countryLabel}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredUniversity")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {universityLabel}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.program")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {programLabel}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.course")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {courseLabel}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredIntake")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {intakeLabel}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.assignCounselor")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {counselorLabel}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.agencyPartnerName")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {agencyLabel}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("applicant.desiredCampus")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {campusLabel}
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
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Trash className="h-5 w-5" style={{ color: COLORS.error }} />}
              iconOnly
              onClick={onDelete}
              title={t("common.delete")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferenceCard;

