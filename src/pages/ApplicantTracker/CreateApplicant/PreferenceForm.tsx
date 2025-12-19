import { Select, Button } from "../../../components";
import { countries, programs, universities, campuses, courses, intakes, counselors, agencyPartners } from "../../../constants";
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
        {/* Form Fields Row 1: Country, Program, Desired University */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <Select
              label={`${t("applicant.desiredCountry")} *`}
              options={countries}
              value={preference.desiredCountry}
              onChange={(value) => onFieldChange(index, "desiredCountry", value)}
              placeholder={t("applicant.selectCountry")}
              error={getFieldError(index, "desiredCountry")}
              fullWidth
            />
          </div>

          <div className="w-full">
            <Select
              label={`${t("applicant.program")} *`}
              options={programs}
              value={preference.program}
              onChange={(value) => onFieldChange(index, "program", value)}
              placeholder={t("applicant.selectProgram")}
              error={getFieldError(index, "program")}
              fullWidth
            />
          </div>

          <div className="w-full">
            <Select
              label={`${t("applicant.desiredUniversity")} *`}
              options={universities}
              value={preference.desiredUniversity}
              onChange={(value) => onFieldChange(index, "desiredUniversity", value)}
              placeholder={t("applicant.selectUniversity")}
              error={getFieldError(index, "desiredUniversity")}
              fullWidth
            />
          </div>
        </div>

        {/* Form Fields Row 2: Desired Campus, Course, Desired Intake */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <Select
              label={`${t("applicant.desiredCampus")} *`}
              options={campuses}
              value={preference.desiredCampus}
              onChange={(value) => onFieldChange(index, "desiredCampus", value)}
              placeholder={t("applicant.selectCampus")}
              error={getFieldError(index, "desiredCampus")}
              fullWidth
            />
          </div>

          <div className="w-full">
            <Select
              label={`${t("applicant.course")} *`}
              options={courses}
              value={preference.course}
              onChange={(value) => onFieldChange(index, "course", value)}
              placeholder={t("applicant.selectCourse")}
              error={getFieldError(index, "course")}
              fullWidth
            />
          </div>

          <div className="w-full">
            <Select
              label={`${t("applicant.desiredIntake")} *`}
              options={intakes}
              value={preference.desiredIntake}
              onChange={(value) => onFieldChange(index, "desiredIntake", value)}
              placeholder={t("applicant.selectIntake")}
              error={getFieldError(index, "desiredIntake")}
              fullWidth
            />
          </div>
        </div>

        {/* Form Fields Row 3: Assign Counselor, Agency Partner Name, Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <Select
              label={`${t("applicant.assignCounselor")} *`}
              options={counselors}
              value={preference.assignCounselor}
              onChange={(value) => onFieldChange(index, "assignCounselor", value)}
              placeholder={t("applicant.selectCounselor")}
              error={getFieldError(index, "assignCounselor")}
              fullWidth
            />
          </div>

          <div className="w-full">
            <Select
              label={`${t("applicant.agencyPartnerName")} *`}
              options={agencyPartners}
              value={preference.agencyPartnerName}
              onChange={(value) => onFieldChange(index, "agencyPartnerName", value)}
              placeholder={t("applicant.selectAgencyPartner")}
              error={getFieldError(index, "agencyPartnerName")}
              fullWidth
            />
          </div>

          <div className="w-full flex items-end justify-end gap-2">
            {showCancel && onCancel && (
              <Button
                type="button"
                variant="cancel"
                onClick={onCancel}
              >
                {t("common.cancel")}
              </Button>
            )}
            {showAddMore && onAddMore && (
              <Button
                type="button"
                variant="accent"
                onClick={onAddMore}
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

export default PreferenceForm;

