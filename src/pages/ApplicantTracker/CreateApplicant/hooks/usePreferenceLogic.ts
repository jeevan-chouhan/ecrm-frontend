import { useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { PreferenceItem, ApplicationPreferencesFormData } from "../types";

interface UsePreferenceLogicProps {
  formik: ReturnType<typeof useFormik<ApplicationPreferencesFormData>>;
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  getPreferenceSchema: () => Yup.ObjectSchema<any>;
  getEmptyPreference: () => PreferenceItem;
  isPreferenceComplete: (pref: PreferenceItem) => boolean;
  handleValidationErrors: (error: unknown, index: number) => void;
}

/**
 * Custom hook to extract preference business logic
 */
export function usePreferenceLogic({
  formik,
  editingIndex,
  setEditingIndex,
  getPreferenceSchema,
  getEmptyPreference,
  isPreferenceComplete,
  handleValidationErrors,
}: UsePreferenceLogicProps) {
  const getIncompletePreferences = useCallback((): PreferenceItem[] => {
    return formik.values.preferences.filter((pref, index) => {
      if (editingIndex === index) {
        return false;
      }
      return !pref.saved;
    });
  }, [formik.values.preferences, editingIndex]);

  const getCompletePreferences = useCallback((): PreferenceItem[] => {
    return formik.values.preferences.filter((pref, index) => {
      if (editingIndex === index) {
        return true;
      }
      // Show preferences that are saved AND either complete OR have a preferenceId (already saved to API)
      // This ensures preferences fetched from API are displayed even if enrollmentType mapping failed
      return pref.saved && (isPreferenceComplete(pref) || !!pref.preferenceId);
    });
  }, [formik.values.preferences, editingIndex, isPreferenceComplete]);

  const markPreferenceAsSaved = useCallback((index: number) => {
    formik.setFieldValue("preferences", (currentPreferences: PreferenceItem[]) => {
      const updatedPreferences = [...currentPreferences];
      updatedPreferences[index] = {
        ...updatedPreferences[index],
        saved: true,
      };
      return updatedPreferences;
    });
  }, [formik]);

  const removePreference = useCallback((index: number) => {
    const updatedPreferences = formik.values.preferences.filter((_, i) => i !== index);
    formik.setFieldValue("preferences", updatedPreferences);
    
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [formik, editingIndex, setEditingIndex]);

  const clearPreferenceErrors = useCallback((index: number) => {
    // Clear errors
    if (formik.errors.preferences?.[index]) {
      const updatedErrors: any[] = [...(formik.errors.preferences || [])];
      updatedErrors[index] = undefined;
      formik.setErrors({
        ...formik.errors,
        preferences: updatedErrors as any,
      });
    }
    
    // Clear touched state
    if (formik.touched.preferences?.[index]) {
      const updatedTouched = [...(formik.touched.preferences || [])];
      updatedTouched[index] = {};
      formik.setTouched({
        ...formik.touched,
        preferences: updatedTouched as any,
      });
    }
  }, [formik]);

  const handleAddPreference = useCallback(async () => {
    
    const incomplete = getIncompletePreferences();
    
    // If there's an incomplete preference, validate it first
    if (incomplete.length > 0) {
      const firstIncomplete = incomplete[0];
      const index = formik.values.preferences.findIndex((p) => p.id === firstIncomplete.id);
      
      // Validate the preference first
      const preferenceSchema = getPreferenceSchema();

      try {
        await preferenceSchema.validate(firstIncomplete, { abortEarly: false });
      } catch (error) {
        // If validation fails, mark fields as touched to show errors
        // Call handleValidationErrors directly (it will handle batching internally)
        handleValidationErrors(error, index);
        return; // Don't add new form if validation fails
      }
      
      // If validation passes, mark as saved and add new preference in a single update
      // Use validate: false to prevent triggering validation loops
      formik.setFieldValue("preferences", (currentPreferences: PreferenceItem[]) => {
        const updatedPreferences = currentPreferences.map((p, i) => 
          i === index ? { ...p, saved: true } : p
        );
        const emptyPref = getEmptyPreference();
        const newPreferences = [...updatedPreferences, emptyPref];
        return newPreferences;
      }, false);
    } else {
      // No incomplete preferences, just add a new one
      const emptyPref = getEmptyPreference();
      // Use setTimeout to batch the update and prevent immediate re-render
      setTimeout(() => {
        formik.setFieldValue("preferences", (currentPreferences: PreferenceItem[]) => {
          const newPreferences = [...currentPreferences, emptyPref];
          return newPreferences;
        }, false);
      }, 0);
    }
  }, [formik, getIncompletePreferences, getPreferenceSchema, getEmptyPreference, handleValidationErrors]);

  const handleCancelIncompletePreference = useCallback((index: number) => {
    const incomplete = getIncompletePreferences();
    const complete = getCompletePreferences();
    
    // Don't allow removing if it's the only preference and it's incomplete
    if (incomplete.length === 1 && complete.length === 0) {
      // Reset the first preference to empty instead of removing
      const emptyPref = getEmptyPreference();
      const updatedPreferences = [...formik.values.preferences];
      updatedPreferences[index] = emptyPref;
      formik.setFieldValue("preferences", updatedPreferences);
      
      // Clear all errors and touched state for this preference
      clearPreferenceErrors(index);
    } else {
      // Remove the incomplete preference directly without showing confirmation popup
      removePreference(index);
    }
  }, [formik, getIncompletePreferences, getCompletePreferences, getEmptyPreference, clearPreferenceErrors, removePreference]);

  const handleSavePreference = useCallback(async (index: number) => {
    const preference = formik.values.preferences[index];
    const preferenceSchema = getPreferenceSchema();

    try {
      await preferenceSchema.validate(preference, { abortEarly: false });
      markPreferenceAsSaved(index);
      
      // If editing, close edit mode
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    } catch (error) {
      // Mark fields as touched to show errors
      handleValidationErrors(error, index);
    }
  }, [formik.values.preferences, getPreferenceSchema, markPreferenceAsSaved, editingIndex, setEditingIndex, handleValidationErrors]);

  const handleEditPreference = useCallback((index: number) => {
    setEditingIndex(index);
  }, [setEditingIndex]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, [setEditingIndex]);

  const getFieldError = useCallback((index: number, fieldName: keyof PreferenceItem): string | undefined => {
    const touched = formik.touched.preferences?.[index]?.[fieldName];
    const error = formik.errors.preferences?.[index];
    if (touched && error && typeof error === 'object' && fieldName in error) {
      const fieldError = error[fieldName];
      return typeof fieldError === 'string' ? fieldError : undefined;
    }
    return undefined;
  }, [formik.touched.preferences, formik.errors.preferences]);

  const updatePreferenceField = useCallback(async (index: number, field: keyof PreferenceItem, value: string) => {
    // Update the field value only - don't mark as touched or validate yet
    // Validation will happen when user clicks "Add More" or "Save"
    await formik.setFieldValue(`preferences[${index}].${field}`, value);
    
    // Clear error for this field if value is set (to remove previous errors when user fixes them)
    if (value && formik.errors.preferences?.[index] && typeof formik.errors.preferences[index] === 'object') {
      const currentErrors = { ...(formik.errors.preferences[index] as any) };
      if (currentErrors[field]) {
        delete currentErrors[field];
        const updatedErrors: any[] = [...(formik.errors.preferences || [])];
        updatedErrors[index] = Object.keys(currentErrors).length > 0 ? currentErrors : undefined;
        formik.setErrors({
          ...formik.errors,
          preferences: updatedErrors as any,
        });
      }
    }
  }, [formik]);

  return {
    getIncompletePreferences,
    getCompletePreferences,
    markPreferenceAsSaved,
    removePreference,
    clearPreferenceErrors,
    handleAddPreference,
    handleCancelIncompletePreference,
    handleSavePreference,
    handleEditPreference,
    handleCancelEdit,
    getFieldError,
    updatePreferenceField,
  };
}

