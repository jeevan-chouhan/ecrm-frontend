import { useState, useEffect } from "react";
import type { FormikValues } from "formik";

/**
 * Hook to track if form data has changed since last save
 * @param formValues - Current form values
 * @param compareFn - Optional custom comparison function. If not provided, uses shallow comparison
 */
export function useDataChangeTracking<T extends FormikValues>(
  formValues: T,
  compareFn?: (lastSaved: T | null, current: T) => boolean
) {
  const [lastSavedData, setLastSavedData] = useState<T | null>(null);
  const [hasDataChanged, setHasDataChanged] = useState(false);

  useEffect(() => {
    if (lastSavedData === null) {
      setHasDataChanged(true);
      return;
    }

    const hasChanged = compareFn
      ? compareFn(lastSavedData, formValues)
      : JSON.stringify(lastSavedData) !== JSON.stringify(formValues);

    setHasDataChanged(hasChanged);
  }, [formValues, lastSavedData, compareFn]);

  const markAsSaved = (data: T) => {
    setLastSavedData({ ...data });
    setHasDataChanged(false);
  };

  return {
    lastSavedData,
    hasDataChanged,
    markAsSaved,
  };
}

