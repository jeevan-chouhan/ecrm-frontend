import { useEffect, useRef } from "react";
import type { FormikValues } from "formik";

/**
 * Hook to sync formik values to parent state with optimized deep comparison
 * Only updates parent when values actually change (prevents excessive re-renders)
 * @param formValues - Current formik values
 * @param onUpdate - Callback to update parent state
 * @param compareFn - Optional custom comparison function for deep comparison
 */
export function useFormSync<T extends FormikValues>(
  formValues: T,
  onUpdate: (values: T) => void,
  compareFn?: (prev: T, current: T) => boolean
) {
  const prevValuesRef = useRef<T>(formValues);

  useEffect(() => {
    const hasChanged = compareFn
      ? compareFn(prevValuesRef.current, formValues)
      : JSON.stringify(prevValuesRef.current) !== JSON.stringify(formValues);

    if (hasChanged) {
      prevValuesRef.current = formValues;
      onUpdate(formValues);
    }
  }, [formValues, onUpdate, compareFn]);
}

