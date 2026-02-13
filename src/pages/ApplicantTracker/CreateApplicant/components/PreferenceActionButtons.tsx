import React from "react";
import { Button } from "../../../../components";
import { COLORS } from "../../../../constants";

interface PreferenceActionButtonsProps {
  onBack?: () => void;
  onSave: () => void;
  onSaveAndNext: () => void;
  isSaving: boolean;
  isFormValid: boolean;
  applicantId?: number | string | null;
  t: (key: string) => string;
}

/**
 * Component for action buttons at the bottom of the preferences form
 */
export const PreferenceActionButtons: React.FC<PreferenceActionButtonsProps> = ({
  onBack,
  onSave,
  onSaveAndNext,
  isSaving,
  isFormValid,
  applicantId,
  t,
}) => {
  return (
    <div
      className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t"
      style={{ borderColor: COLORS.border }}
    >
      {onBack && (
        <Button
          type="button"
          variant="cancel"
          onClick={onBack}
          rounded
          className="w-full sm:w-auto"
        >
          {t("common.back")}
        </Button>
      )}
      <Button
        type="button"
        variant="accent"
        onClick={onSave}
        isLoading={isSaving}
        disabled={isSaving || !applicantId}
        rounded
        className="w-full sm:w-auto"
      >
        {t("applicant.save")}
      </Button>
      <Button
        type="button"
        variant="accent"
        onClick={onSaveAndNext}
        disabled={!isFormValid || isSaving || !applicantId}
        isLoading={isSaving}
        rounded
        className="w-full sm:w-auto"
      >
        {t("applicant.saveAndNext")}
      </Button>
    </div>
  );
};

