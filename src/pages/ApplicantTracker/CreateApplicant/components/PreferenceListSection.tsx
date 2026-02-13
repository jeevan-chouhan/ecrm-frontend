import React from "react";
import PreferenceCard from "../PreferenceCard";
import { COLORS } from "../../../../constants";
import type { PreferenceItem } from "../types";
import type { SelectOption } from "../../../../components";

interface PreferenceListSectionProps {
  completePreferences: PreferenceItem[];
  preferenceIndexMap: Map<string, number>;
  editingIndex: number | null;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onSave: (index: number) => void;
  onCancel: () => void;
  onFieldChange: (index: number, field: keyof PreferenceItem, value: string) => void;
  getFieldError: (index: number, fieldName: keyof PreferenceItem) => string | undefined;
  preferenceOptionsMap: Map<string, {
    universityOptions: SelectOption[];
    campusOptions: SelectOption[];
    courseOptions: SelectOption[];
    counselorOptions: SelectOption[];
  }>;
  enrollmentTypeOptions: SelectOption[];
  countryOptions: SelectOption[];
  universityOptions: SelectOption[];
  campusOptions: SelectOption[];
  programTypeOptions: SelectOption[];
  counselorOptions: SelectOption[];
  agencyPartnerOptions: SelectOption[];
  t: (key: string) => string;
}

/**
 * Component for displaying the list of complete preferences
 */
export const PreferenceListSection: React.FC<PreferenceListSectionProps> = ({
  completePreferences,
  preferenceIndexMap,
  editingIndex,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onFieldChange,
  getFieldError,
  preferenceOptionsMap,
  enrollmentTypeOptions,
  countryOptions,
  universityOptions,
  campusOptions,
  programTypeOptions,
  counselorOptions,
  agencyPartnerOptions,
  t,
}) => {
  if (completePreferences.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
        {t("applicant.addedUniversityPreferences")}
      </h2>

      <div className="space-y-4">
        {completePreferences.map((preference) => {
          const index = preferenceIndexMap.get(preference.id) ?? -1;
          const isEditing = editingIndex === index;

          const options = preferenceOptionsMap.get(preference.id) || {
            universityOptions,
            campusOptions,
            courseOptions: [],
            counselorOptions,
          };

          return (
            <PreferenceCard
              key={preference.id}
              preference={preference}
              index={index}
              isEditing={isEditing}
              onEdit={() => onEdit(index)}
              onDelete={() => onDelete(index)}
              onSave={() => onSave(index)}
              onCancel={onCancel}
              onFieldChange={onFieldChange}
              getFieldError={getFieldError}
              enrollmentTypeOptions={enrollmentTypeOptions}
              countryOptions={countryOptions}
              universityOptions={options.universityOptions}
              campusOptions={options.campusOptions}
              programTypeOptions={programTypeOptions}
              courseOptions={options.courseOptions}
              counselorOptions={options.counselorOptions}
              agencyPartnerOptions={agencyPartnerOptions}
            />
          );
        })}
      </div>
    </div>
  );
};

