import { useState, useEffect, useRef, useCallback } from "react";
import type { FormikValues } from "formik";
import { efficientCompare } from "./useDeepCompare";

/**
 * Hook to track if form data has changed since last save
 * @param formValues - Current form values
 * @param compareFn - Optional custom comparison function. If not provided, uses efficient deep comparison
 */
export function useDataChangeTracking<T extends FormikValues>(
  formValues: T,
  compareFn?: (lastSaved: T | null, current: T) => boolean
) {
  const [lastSavedData, setLastSavedData] = useState<T | null>(null);
  const [hasDataChanged, setHasDataChanged] = useState(false);
  const compareFnRef = useRef(compareFn);

  // Keep compareFn ref updated
  useEffect(() => {
    compareFnRef.current = compareFn;
  }, [compareFn]);

  useEffect(() => {
    if (lastSavedData === null) {
      setHasDataChanged(true);
      return;
    }

    const hasChanged = compareFnRef.current
      ? compareFnRef.current(lastSavedData, formValues)
      : efficientCompare(lastSavedData, formValues);

    setHasDataChanged(hasChanged);
  }, [formValues, lastSavedData]);

  const markAsSaved = useCallback((data: T) => {
    setLastSavedData({ ...data });
    setHasDataChanged(false);
  }, []);

  return {
    lastSavedData,
    hasDataChanged,
    markAsSaved,
  };
}

