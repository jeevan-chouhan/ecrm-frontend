import { useEffect, useRef } from "react";
import type { FormikValues } from "formik";
import { efficientCompare } from "./useDeepCompare";

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
  const onUpdateRef = useRef(onUpdate);
  const compareFnRef = useRef(compareFn);

  // Keep refs updated
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    compareFnRef.current = compareFn;
  }, [onUpdate, compareFn]);

  useEffect(() => {
    const hasChanged = compareFnRef.current
      ? compareFnRef.current(prevValuesRef.current, formValues)
      : efficientCompare(prevValuesRef.current, formValues);

    if (hasChanged) {
      prevValuesRef.current = formValues;
      onUpdateRef.current(formValues);
    }
  }, [formValues]);
}

