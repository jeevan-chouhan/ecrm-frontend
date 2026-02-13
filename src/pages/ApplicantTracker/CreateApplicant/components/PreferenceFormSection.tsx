import React from "react";
import { Button } from "../../../../components";
import PreferenceForm from "../PreferenceForm";
import type { PreferenceItem } from "../types";
import type { SelectOption } from "../../../../components";

interface PreferenceFormSectionProps {
  firstIncomplete: PreferenceItem | null;
  firstIncompleteIndex: number;
  incompleteCount: number;
  completeCount: number;
  onFieldChange: (index: number, field: keyof PreferenceItem, value: string) => void;
  getFieldError: (index: number, fieldName: keyof PreferenceItem) => string | undefined;
  onCancel: (index: number) => void;
  onAddMore: () => void;
  enrollmentTypeOptions: SelectOption[];
  countryOptions: SelectOption[];
  universityOptions: SelectOption[];
  campusOptions: SelectOption[];
  programTypeOptions: SelectOption[];
  courseOptions: SelectOption[];
  counselorOptions: SelectOption[];
  agencyPartnerOptions: SelectOption[];
  applicantId?: number | string | null;
  isSaving: boolean;
  t: (key: string) => string;
}

/**
 * Component for displaying the form section for incomplete preferences
 */
export const PreferenceFormSection: React.FC<PreferenceFormSectionProps> = ({
  firstIncomplete,
  firstIncompleteIndex,
  incompleteCount,
  completeCount,
  onFieldChange,
  getFieldError,
  onCancel,
  onAddMore,
  enrollmentTypeOptions,
  countryOptions,
  universityOptions,
  campusOptions,
  programTypeOptions,
  courseOptions,
  counselorOptions,
  agencyPartnerOptions,
  isSaving,
  t,
}) => {
  // If there's an incomplete preference, show the form
  if (firstIncomplete && firstIncompleteIndex >= 0) {
    return (
      <>
        <PreferenceForm
          preference={firstIncomplete}
          index={firstIncompleteIndex}
          onFieldChange={onFieldChange}
          getFieldError={getFieldError}
          onCancel={() => onCancel(firstIncompleteIndex)}
          onAddMore={onAddMore}
          showCancel={incompleteCount > 1 || completeCount > 0}
          showAddMore={true}
          enrollmentTypeOptions={enrollmentTypeOptions}
          countryOptions={countryOptions}
          universityOptions={universityOptions}
          campusOptions={campusOptions}
          programTypeOptions={programTypeOptions}
          courseOptions={courseOptions}
          counselorOptions={counselorOptions}
          agencyPartnerOptions={agencyPartnerOptions}
        />
      </>
    );
  }

  // If all preferences are complete, show Add More button
  if (incompleteCount === 0) {
    return (
      <div className="flex justify-end">
        <Button
          type="button"
          variant="accent"
          onClick={() => {
            onAddMore();
          }}
          disabled={isSaving}
          isLoading={isSaving}
          rounded
        >
          {t("common.addMore")}
        </Button>
      </div>
    );
  }

  // No preferences at all, return null
  return null;
};

