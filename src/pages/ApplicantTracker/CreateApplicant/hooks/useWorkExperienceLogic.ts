import { useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { WorkExperienceItem, WorkExperienceFormData } from "../types";

interface UseWorkExperienceLogicProps {
  formik: ReturnType<typeof useFormik<WorkExperienceFormData>>;
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  getWorkExperienceSchema: () => Yup.ObjectSchema<any>;
  getEmptyWorkExperience: () => WorkExperienceItem;
  handleValidationErrors: (error: unknown, index: number) => void;
}

/**
 * Custom hook to extract work experience business logic
 */
export function useWorkExperienceLogic({
  formik,
  editingIndex,
  setEditingIndex,
  getWorkExperienceSchema,
  getEmptyWorkExperience,
  handleValidationErrors,
}: UseWorkExperienceLogicProps) {
  const isWorkExperienceComplete = useCallback((we: WorkExperienceItem): boolean => {
    return !!(
      we.companyName &&
      we.jobTitle &&
      we.startDate &&
      (we.currentlyWorking || we.endDate)
    );
  }, []);

  const getIncompleteWorkExperiences = useCallback((): WorkExperienceItem[] => {
    return formik.values.workExperiences.filter((we, index) => {
      if (editingIndex === index) {
        return false;
      }
      return !we.saved;
    });
  }, [formik.values.workExperiences, editingIndex]);

  const getCompleteWorkExperiences = useCallback((): WorkExperienceItem[] => {
    return formik.values.workExperiences.filter((we, index) => {
      if (editingIndex === index) {
        return true;
      }
      return isWorkExperienceComplete(we) && we.saved;
    });
  }, [formik.values.workExperiences, editingIndex, isWorkExperienceComplete]);

  const markWorkExperienceAsSaved = useCallback((index: number) => {
    formik.setFieldValue("workExperiences", (currentWorkExperiences: WorkExperienceItem[]) => {
      const updatedWorkExperiences = [...currentWorkExperiences];
      updatedWorkExperiences[index] = {
        ...updatedWorkExperiences[index],
        saved: true,
      };
      return updatedWorkExperiences;
    });
  }, [formik]);

  const removeWorkExperience = useCallback((index: number) => {
    const updatedWorkExperiences = formik.values.workExperiences.filter((_, i) => i !== index);
    formik.setFieldValue("workExperiences", updatedWorkExperiences);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [formik, editingIndex, setEditingIndex]);

  const clearWorkExperienceErrors = useCallback((index: number) => {
    // Clear errors
    if (formik.errors.workExperiences?.[index]) {
      const updatedErrors: any[] = [...(formik.errors.workExperiences || [])];
      updatedErrors[index] = undefined;
      formik.setErrors({
        ...formik.errors,
        workExperiences: updatedErrors as any,
      });
    }
    
    // Clear touched state
    if (formik.touched.workExperiences?.[index]) {
      const updatedTouched = [...(formik.touched.workExperiences || [])];
      updatedTouched[index] = {};
      formik.setTouched({
        ...formik.touched,
        workExperiences: updatedTouched as any,
      });
    }
  }, [formik]);

  const handleAddWorkExperience = useCallback(async () => {
    if (formik.values.hasWorkExperience !== "yes") {
      return;
    }
    
    const incomplete = getIncompleteWorkExperiences();
    
    // If there's an incomplete work experience, validate it first
    if (incomplete.length > 0) {
      const firstIncomplete = incomplete[0];
      const index = formik.values.workExperiences.findIndex((w) => w.id === firstIncomplete.id);
      
      // Validate the work experience first
      const workExperienceSchema = getWorkExperienceSchema();

      try {
        await workExperienceSchema.validate(firstIncomplete, { abortEarly: false });
      } catch (error) {
        // If validation fails, mark fields as touched to show errors
        handleValidationErrors(error, index);
        return; // Don't add new form if validation fails
      }
      
      // If validation passes, mark as saved and add new work experience in a single update
      formik.setFieldValue("workExperiences", (currentWorkExperiences: WorkExperienceItem[]) => {
        const updatedWorkExperiences = currentWorkExperiences.map((w, i) => 
          i === index ? { ...w, saved: true } : w
        );
        const emptyWorkExp = getEmptyWorkExperience();
        return [...updatedWorkExperiences, emptyWorkExp];
      });
    } else {
      // No incomplete work experiences, just add a new one
      const emptyWorkExp = getEmptyWorkExperience();
      formik.setFieldValue("workExperiences", (currentWorkExperiences: WorkExperienceItem[]) => [
        ...currentWorkExperiences,
        emptyWorkExp
      ]);
    }
  }, [formik, getIncompleteWorkExperiences, getWorkExperienceSchema, getEmptyWorkExperience, handleValidationErrors]);

  const handleCancelIncompleteWorkExperience = useCallback((index: number) => {
    const incomplete = getIncompleteWorkExperiences();
    const complete = getCompleteWorkExperiences();

    if (incomplete.length === 1 && complete.length === 0) {
      const emptyWorkExp = getEmptyWorkExperience();
      const updatedWorkExperiences = [...formik.values.workExperiences];
      updatedWorkExperiences[index] = emptyWorkExp;
      formik.setFieldValue("workExperiences", updatedWorkExperiences);

      // Clear all errors and touched state for this work experience
      clearWorkExperienceErrors(index);
    } else {
      removeWorkExperience(index);
    }
  }, [formik, getIncompleteWorkExperiences, getCompleteWorkExperiences, getEmptyWorkExperience, clearWorkExperienceErrors, removeWorkExperience]);

  const handleSaveWorkExperience = useCallback(async (index: number) => {
    const workExperience = formik.values.workExperiences[index];
    const workExperienceSchema = getWorkExperienceSchema();

    try {
      await workExperienceSchema.validate(workExperience, { abortEarly: false });
      markWorkExperienceAsSaved(index);

      if (editingIndex === index) {
        setEditingIndex(null);
      }
    } catch (error) {
      handleValidationErrors(error, index);
    }
  }, [formik.values.workExperiences, getWorkExperienceSchema, markWorkExperienceAsSaved, editingIndex, setEditingIndex, handleValidationErrors]);

  const handleEditWorkExperience = useCallback((index: number) => {
    setEditingIndex(index);
  }, [setEditingIndex]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, [setEditingIndex]);

  const getFieldError = useCallback((index: number, fieldName: keyof WorkExperienceItem): string | undefined => {
    const touched = formik.touched.workExperiences?.[index]?.[fieldName];
    const error = formik.errors.workExperiences?.[index];
    if (touched && error && typeof error === "object" && fieldName in error) {
      const fieldError = error[fieldName];
      return typeof fieldError === "string" ? fieldError : undefined;
    }
    return undefined;
  }, [formik.touched.workExperiences, formik.errors.workExperiences]);

  const updateWorkExperienceField = useCallback(async (
    index: number,
    field: keyof WorkExperienceItem,
    value: string | Date | null | boolean
  ) => {
    await formik.setFieldValue(`workExperiences[${index}].${field}`, value);
    formik.setFieldTouched(`workExperiences[${index}].${field}`, true);

    if (value && formik.errors.workExperiences?.[index] && typeof formik.errors.workExperiences[index] === "object") {
      const currentErrors = { ...(formik.errors.workExperiences[index] as any) };
      if (currentErrors[field]) {
        delete currentErrors[field];
        const updatedErrors: any[] = [...(formik.errors.workExperiences || [])];
        updatedErrors[index] = Object.keys(currentErrors).length > 0 ? currentErrors : undefined;
        formik.setErrors({
          ...formik.errors,
          workExperiences: updatedErrors as any,
        });
      }
    }

    // Validate field immediately without setTimeout to prevent race conditions
    await formik.validateField(`workExperiences[${index}].${field}`);
  }, [formik]);

  return {
    isWorkExperienceComplete,
    getIncompleteWorkExperiences,
    getCompleteWorkExperiences,
    markWorkExperienceAsSaved,
    removeWorkExperience,
    clearWorkExperienceErrors,
    handleAddWorkExperience,
    handleCancelIncompleteWorkExperience,
    handleSaveWorkExperience,
    handleEditWorkExperience,
    handleCancelEdit,
    getFieldError,
    updateWorkExperienceField,
  };
}

