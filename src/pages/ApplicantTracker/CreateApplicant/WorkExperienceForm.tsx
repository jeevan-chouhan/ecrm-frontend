import React from "react";
import { Input, DatePicker, Checkbox, Button } from "../../../components";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../constants";
import type { WorkExperienceItem } from "./types";

interface WorkExperienceFormProps {
  workExperience: WorkExperienceItem;
  index: number;
  onFieldChange: (index: number, field: keyof WorkExperienceItem, value: string | Date | null | boolean) => void;
  getFieldError: (index: number, fieldName: keyof WorkExperienceItem) => string | undefined;
  onCancel?: () => void;
  onAddMore?: () => void;
  showCancel?: boolean;
  showAddMore?: boolean;
}

const WorkExperienceForm = ({
  workExperience,
  index,
  onFieldChange,
  getFieldError,
  onCancel,
  onAddMore,
  showCancel = false,
  showAddMore = false,
}: WorkExperienceFormProps) => {
  const { t } = useTranslation();

  const handleCurrentlyWorkingChange = (checked: boolean) => {
    onFieldChange(index, "currentlyWorking", checked);
    if (checked) {
      onFieldChange(index, "endDate", null);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); }}>
      <div className="space-y-4">
        {/* Form Fields Row 1: Company Name, Job Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
            >
              {t("applicant.companyName")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Input
              value={workExperience.companyName}
              onChange={(e) => onFieldChange(index, "companyName", e.target.value)}
              placeholder={t("applicant.enterCompanyName")}
              error={getFieldError(index, "companyName")}
              fullWidth
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
            >
              {t("applicant.jobTitle")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Input
              value={workExperience.jobTitle}
              onChange={(e) => onFieldChange(index, "jobTitle", e.target.value)}
              placeholder={t("applicant.enterJobTitle")}
              error={getFieldError(index, "jobTitle")}
              fullWidth
            />
          </div>
        </div>

        {/* Form Fields Row 2: Start Date, End Date, Currently Working */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
            >
              {t("applicant.startDate")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <DatePicker
              value={workExperience.startDate}
              onChange={(date) => onFieldChange(index, "startDate", date)}
              placeholder={t("applicant.selectStartDate")}
              error={getFieldError(index, "startDate")}
              maxDate={new Date()} // Disable future dates
              fullWidth
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
            >
              {t("applicant.endDate")}
            </label>
            <DatePicker
              value={workExperience.endDate}
              onChange={(date) => onFieldChange(index, "endDate", date)}
              placeholder={t("applicant.selectEndDate")}
              error={getFieldError(index, "endDate")}
              disabled={workExperience.currentlyWorking}
              maxDate={new Date()} // Disable future dates
              fullWidth
            />
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
            >
              &nbsp;
            </label>
            <div className="flex items-center h-[42px]">
              <Checkbox
                checked={workExperience.currentlyWorking}
                onChange={handleCurrentlyWorkingChange}
                label={t("applicant.currentlyWorking")}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {(showCancel || showAddMore) && (
          <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: COLORS.border }}>
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

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(WorkExperienceForm);
