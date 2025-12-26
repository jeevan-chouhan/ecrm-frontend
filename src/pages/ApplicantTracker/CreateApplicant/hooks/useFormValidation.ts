import { useCallback } from "react";
import type { FormikProps } from "formik";

/**
 * Hook providing reusable form validation utilities
 */
export function useFormValidation<T extends FormikProps<any>>(formik: T) {
  /**
   * Mark all form fields as touched to show validation errors
   */
  const markAllFieldsAsTouched = useCallback(() => {
    const touchedFields: Record<string, boolean> = {};
    Object.keys(formik.values).forEach((key) => {
      touchedFields[key] = true;
    });
    formik.setTouched(touchedFields);
  }, [formik]);

  /**
   * Validate form and mark all fields as touched if there are errors
   * @returns true if form is valid, false otherwise
   */
  const validateAndMarkTouched = useCallback(async (): Promise<boolean> => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      markAllFieldsAsTouched();
      return false;
    }
    return true;
  }, [formik, markAllFieldsAsTouched]);

  return {
    markAllFieldsAsTouched,
    validateAndMarkTouched,
  };
}

