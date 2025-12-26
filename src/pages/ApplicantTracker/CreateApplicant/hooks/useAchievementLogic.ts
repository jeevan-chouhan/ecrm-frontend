import { useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { AchievementItem, AchievementFormData } from "../types";

interface UseAchievementLogicProps {
  formik: ReturnType<typeof useFormik<AchievementFormData>>;
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  getAchievementSchema: () => Yup.ObjectSchema<any>;
  getEmptyAchievement: () => AchievementItem;
  handleValidationErrors: (error: unknown, index: number) => void;
}

/**
 * Custom hook to extract achievement business logic
 */
export function useAchievementLogic({
  formik,
  editingIndex,
  setEditingIndex,
  getAchievementSchema,
  getEmptyAchievement,
  handleValidationErrors,
}: UseAchievementLogicProps) {
  const isAchievementComplete = useCallback((a: AchievementItem): boolean => {
    return !!(a.category && a.description);
  }, []);

  const findAchievementIndex = useCallback((id: string): number => {
    return formik.values.achievements.findIndex((a) => a.id === id);
  }, [formik.values.achievements]);

  const getIncompleteAchievements = useCallback((): AchievementItem[] => {
    return formik.values.achievements.filter((a, index) => {
      if (editingIndex === index) {
        return false;
      }
      return !a.saved;
    });
  }, [formik.values.achievements, editingIndex]);

  const getCompleteAchievements = useCallback((): AchievementItem[] => {
    return formik.values.achievements.filter((a, index) => {
      if (editingIndex === index) {
        return true;
      }
      return isAchievementComplete(a) && a.saved;
    });
  }, [formik.values.achievements, editingIndex, isAchievementComplete]);

  const markAchievementAsSaved = useCallback((index: number) => {
    formik.setFieldValue("achievements", (currentAchievements: AchievementItem[]) => {
      const updatedAchievements = [...currentAchievements];
      updatedAchievements[index] = {
        ...updatedAchievements[index],
        saved: true,
      };
      return updatedAchievements;
    });
  }, [formik]);

  const removeAchievement = useCallback((index: number) => {
    const updatedAchievements = formik.values.achievements.filter((_, i) => i !== index);
    formik.setFieldValue("achievements", updatedAchievements);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [formik, editingIndex, setEditingIndex]);

  const clearAchievementErrors = useCallback((index: number) => {
    // Clear errors
    if (formik.errors.achievements?.[index]) {
      const updatedErrors: any[] = [...(formik.errors.achievements || [])];
      updatedErrors[index] = undefined;
      formik.setErrors({
        ...formik.errors,
        achievements: updatedErrors as any,
      });
    }
    
    // Clear touched state
    if (formik.touched.achievements?.[index]) {
      const updatedTouched = [...(formik.touched.achievements || [])];
      updatedTouched[index] = {};
      formik.setTouched({
        ...formik.touched,
        achievements: updatedTouched as any,
      });
    }
  }, [formik]);

  const validateAndSaveAchievement = useCallback(async (
    achievement: AchievementItem,
    index: number
  ): Promise<boolean> => {
    const achievementSchema = getAchievementSchema();
    try {
      await achievementSchema.validate(achievement, { abortEarly: false });
      markAchievementAsSaved(index);
      return true;
    } catch (error) {
      handleValidationErrors(error, index);
      return false;
    }
  }, [getAchievementSchema, markAchievementAsSaved, handleValidationErrors]);

  const validateAndSaveAllUnsavedAchievements = useCallback(async (): Promise<boolean> => {
    const unsavedAchievements = formik.values.achievements.filter((a) => !a.saved);

    if (unsavedAchievements.length === 0 || formik.values.hasAchievements !== "yes") {
      return true;
    }

    let hasErrors = false;
    const touchedAchievements = [...(formik.touched.achievements || [])];

    for (const a of unsavedAchievements) {
      const index = findAchievementIndex(a.id);
      const isValid = await validateAndSaveAchievement(a, index);
      
      if (!isValid) {
        hasErrors = true;
        touchedAchievements[index] = {
          category: true,
          description: true,
          documents: true,
        };
      }
    }

    formik.setTouched({
      ...formik.touched,
      achievements: touchedAchievements as any,
    });

    return !hasErrors;
  }, [formik.values.achievements, formik.values.hasAchievements, formik.touched.achievements, formik.setTouched, findAchievementIndex, validateAndSaveAchievement]);

  const handleAddAchievement = useCallback(async () => {
    if (formik.values.hasAchievements !== "yes") {
      return;
    }
    
    const incomplete = getIncompleteAchievements();
    
    // If there's an incomplete achievement, validate it first
    if (incomplete.length > 0) {
      const firstIncomplete = incomplete[0];
      const index = findAchievementIndex(firstIncomplete.id);
      
      // Validate the achievement first
      const achievementSchema = getAchievementSchema();
      try {
        await achievementSchema.validate(firstIncomplete, { abortEarly: false });
      } catch (error) {
        // If validation fails, mark fields as touched to show errors
        handleValidationErrors(error, index);
        return; // Don't add new form if validation fails
      }
      
      // If validation passes, mark as saved and add new achievement in a single update
      formik.setFieldValue("achievements", (currentAchievements: AchievementItem[]) => {
        const updatedAchievements = currentAchievements.map((a, i) => 
          i === index ? { ...a, saved: true } : a
        );
        const emptyAchievement = getEmptyAchievement();
        return [...updatedAchievements, emptyAchievement];
      });
    } else {
      // No incomplete achievements, just add a new one
      const emptyAchievement = getEmptyAchievement();
      formik.setFieldValue("achievements", (currentAchievements: AchievementItem[]) => [
        ...currentAchievements,
        emptyAchievement
      ]);
    }
  }, [formik, getIncompleteAchievements, findAchievementIndex, getAchievementSchema, getEmptyAchievement, handleValidationErrors]);

  const handleCancelIncompleteAchievement = useCallback((index: number) => {
    const incomplete = getIncompleteAchievements();
    const complete = getCompleteAchievements();

    if (incomplete.length === 1 && complete.length === 0) {
      const emptyAchievement = getEmptyAchievement();
      const updatedAchievements = [...formik.values.achievements];
      updatedAchievements[index] = emptyAchievement;
      formik.setFieldValue("achievements", updatedAchievements);

      // Clear all errors and touched state for this achievement
      clearAchievementErrors(index);
    } else {
      removeAchievement(index);
    }
  }, [formik, getIncompleteAchievements, getCompleteAchievements, getEmptyAchievement, clearAchievementErrors, removeAchievement]);

  const handleSaveAchievement = useCallback(async (index: number) => {
    const achievement = formik.values.achievements[index];
    const isValid = await validateAndSaveAchievement(achievement, index);
    
    if (isValid && editingIndex === index) {
      setEditingIndex(null);
    }
  }, [formik.values.achievements, validateAndSaveAchievement, editingIndex, setEditingIndex]);

  const handleEditAchievement = useCallback((index: number) => {
    setEditingIndex(index);
  }, [setEditingIndex]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, [setEditingIndex]);

  const getFieldError = useCallback((index: number, fieldName: keyof AchievementItem): string | undefined => {
    const touched = formik.touched.achievements?.[index]?.[fieldName];
    const error = formik.errors.achievements?.[index];
    if (touched && error && typeof error === "object" && fieldName in error) {
      const fieldError = error[fieldName];
      return typeof fieldError === "string" ? fieldError : undefined;
    }
    return undefined;
  }, [formik.touched.achievements, formik.errors.achievements]);

  const updateAchievementField = useCallback(async (
    index: number,
    field: keyof AchievementItem,
    value: string | File | null
  ) => {
    await formik.setFieldValue(`achievements[${index}].${field}`, value);
    formik.setFieldTouched(`achievements[${index}].${field}`, true);

    if (value && formik.errors.achievements?.[index] && typeof formik.errors.achievements[index] === "object") {
      const currentErrors = { ...(formik.errors.achievements[index] as any) };
      if (currentErrors[field]) {
        delete currentErrors[field];
        const updatedErrors: any[] = [...(formik.errors.achievements || [])];
        updatedErrors[index] = Object.keys(currentErrors).length > 0 ? currentErrors : undefined;
        formik.setErrors({
          ...formik.errors,
          achievements: updatedErrors as any,
        });
      }
    }

    // Validate field immediately without setTimeout to prevent race conditions
    await formik.validateField(`achievements[${index}].${field}`);
  }, [formik]);

  return {
    isAchievementComplete,
    findAchievementIndex,
    getIncompleteAchievements,
    getCompleteAchievements,
    markAchievementAsSaved,
    removeAchievement,
    clearAchievementErrors,
    validateAndSaveAchievement,
    validateAndSaveAllUnsavedAchievements,
    handleAddAchievement,
    handleCancelIncompleteAchievement,
    handleSaveAchievement,
    handleEditAchievement,
    handleCancelEdit,
    getFieldError,
    updateAchievementField,
  };
}

