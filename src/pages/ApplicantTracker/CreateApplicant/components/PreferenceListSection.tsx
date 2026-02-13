import React, { useMemo, useCallback } from "react";
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

  // Memoize callbacks to prevent re-renders - use useCallback to create stable functions per index
  const createEditHandler = useCallback((index: number) => {
    return () => onEdit(index);
  }, [onEdit]);

  const createDeleteHandler = useCallback((index: number) => {
    return () => onDelete(index);
  }, [onDelete]);

  const createSaveHandler = useCallback((index: number) => {
    return () => onSave(index);
  }, [onSave]);

  // Memoize the preferences list to avoid recreating on every render
  const preferenceCards = useMemo(() => {
    return completePreferences.map((preference) => {
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
          onEdit={createEditHandler(index)}
          onDelete={createDeleteHandler(index)}
          onSave={createSaveHandler(index)}
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
    });
  }, [
    completePreferences,
    preferenceIndexMap,
    editingIndex,
    preferenceOptionsMap,
    enrollmentTypeOptions,
    countryOptions,
    universityOptions,
    campusOptions,
    programTypeOptions,
    counselorOptions,
    agencyPartnerOptions,
    createEditHandler,
    createDeleteHandler,
    createSaveHandler,
    onCancel,
    onFieldChange,
    getFieldError,
  ]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
        {t("applicant.addedUniversityPreferences")}
      </h2>

      <div className="space-y-4">
        {preferenceCards}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PreferenceListSection);

