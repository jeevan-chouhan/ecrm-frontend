import { useCallback } from "react";
import { useAppDispatch } from "../../../../redux/hooks";
import { addToast } from "../../../../redux/slices/toast/toastSlice";
import { startTransition } from "react";
import { handleApiError } from "../../../../utils";
import type { PreferenceItem } from "../types";
import type { FormikProps } from "formik";
import type { ApplicationPreferencesFormData } from "../types";

interface UsePreferenceFormSubmissionProps {
  formik: FormikProps<ApplicationPreferencesFormData>;
  applicantId?: number | string | null;
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  editingIndex: number | null;
  setEditingIndex: (value: number | null) => void;
  shouldNavigateNext: boolean;
  setShouldNavigateNext: (value: boolean) => void;
  isSubmittingRef: React.MutableRefObject<boolean>;
  originalPreferencesRef: React.MutableRefObject<PreferenceItem[]>;
  preferencesSentToApiRef: React.MutableRefObject<Set<string>>;
  isPreferenceComplete: (pref: PreferenceItem) => boolean;
  getPreferenceSchema: () => any;
  getEmptyPreference: () => PreferenceItem;
  markAllFieldsAsTouched: () => any;
  handleValidationErrors: (error: unknown, index: number) => void;
  createMultiplePreferences: (preferences: PreferenceItem[]) => Promise<{ success: boolean }>;
  handleAddPreference: () => void;
  fetchApplicationPreferences: (id: number | string, forceRefresh?: boolean) => Promise<void>;
  onSaveAndNext?: () => void;
  t: (key: string) => string;
}

/**
 * Hook for handling form submission operations (Save, Save & Next, Add More)
 */
export function usePreferenceFormSubmission({
  formik,
  applicantId,
  isSaving,
  setIsSaving: _setIsSaving,
  editingIndex,
  setEditingIndex,
  shouldNavigateNext: _shouldNavigateNext,
  setShouldNavigateNext,
  isSubmittingRef,
  originalPreferencesRef,
  preferencesSentToApiRef,
  isPreferenceComplete,
  getPreferenceSchema,
  getEmptyPreference,
  markAllFieldsAsTouched,
  handleValidationErrors,
  createMultiplePreferences,
  handleAddPreference,
  fetchApplicationPreferences,
  onSaveAndNext,
  t,
}: UsePreferenceFormSubmissionProps) {
  const dispatch = useAppDispatch();

  const getPreferenceHash = useCallback((pref: PreferenceItem): string => {
    return `${pref.enrollmentType}|${pref.desiredCountry}|${pref.program}|${pref.desiredUniversity}|${pref.desiredCampus}|${pref.course}|${pref.desiredIntake}|${pref.assignCounselor}|${pref.agencyPartnerName}`;
  }, []);

  const restorePreferenceIds = useCallback(
    (preferences: PreferenceItem[]): { restored: PreferenceItem[]; updated: boolean } => {
      let restored = [...preferences];
      let updated = false;

      for (let i = 0; i < restored.length; i++) {
        const pref = restored[i];
        if (isPreferenceComplete(pref) && !pref.preferenceId) {
          const currentHash = getPreferenceHash(pref);

          if (preferencesSentToApiRef.current.has(currentHash)) {
            const matchingOriginal = originalPreferencesRef.current.find((orig) => {
              if (!orig.preferenceId) return false;
              return getPreferenceHash(orig) === currentHash;
            });

            if (matchingOriginal) {
              restored[i] = { ...pref, preferenceId: matchingOriginal.preferenceId, saved: true };
              updated = true;
              continue;
            }
          }

          const matchingOriginal = originalPreferencesRef.current.find((orig) => {
            if (!orig.preferenceId) return false;
            return (
              String(orig.enrollmentType || "").trim() === String(pref.enrollmentType || "").trim() &&
              String(orig.desiredCountry || "").trim() === String(pref.desiredCountry || "").trim() &&
              String(orig.program || "").trim() === String(pref.program || "").trim() &&
              String(orig.desiredUniversity || "").trim() === String(pref.desiredUniversity || "").trim() &&
              String(orig.desiredCampus || "").trim() === String(pref.desiredCampus || "").trim() &&
              String(orig.course || "").trim() === String(pref.course || "").trim() &&
              String(orig.desiredIntake || "").trim() === String(pref.desiredIntake || "").trim() &&
              String(orig.assignCounselor || "").trim() === String(pref.assignCounselor || "").trim() &&
              String(orig.agencyPartnerName || "").trim() === String(pref.agencyPartnerName || "").trim()
            );
          });

          if (matchingOriginal) {
            restored[i] = { ...pref, preferenceId: matchingOriginal.preferenceId, saved: true };
            preferencesSentToApiRef.current.add(currentHash);
            updated = true;
          }
        }
      }

      return { restored, updated };
    },
    [isPreferenceComplete, getPreferenceHash, preferencesSentToApiRef, originalPreferencesRef]
  );

  const handleAddPreferenceWithAPI = useCallback(async () => {
    
    if (!applicantId) {
      dispatch(addToast({ type: "error", message: t("applicant.applicantIdRequired") }));
      return;
    }

    if (isSubmittingRef.current) {
      return;
    }

    // Don't set isSubmittingRef here - createMultiplePreferences will set it itself
    // isSubmittingRef.current = true; // REMOVED - causes early return in createMultiplePreferences

    try {
      
      // Find incomplete preferences BEFORE restore (to avoid restorePreferenceIds marking them as saved)
      const incompletePreferencesBeforeRestore = formik.values.preferences.filter((pref) => !pref.saved);
      
      const { restored: restoredPreferences, updated: preferencesUpdated } = restorePreferenceIds(formik.values.preferences);
      
      // Find incomplete preferences (not saved) - use original list to avoid issues with restorePreferenceIds
      const incompletePreferences = incompletePreferencesBeforeRestore.length > 0 
        ? incompletePreferencesBeforeRestore.map(originalPref => {
            const restored = restoredPreferences.find(p => p.id === originalPref.id);
            return restored || originalPref;
          })
        : restoredPreferences.filter((pref) => !pref.saved);

      if (incompletePreferences.length > 0) {
        // Get the first incomplete preference
        const firstIncomplete = incompletePreferences[0];
        const firstIncompleteIndex = formik.values.preferences.findIndex((p) => p.id === firstIncomplete.id);

        // Validate the incomplete preference first
        const preferenceSchema = getPreferenceSchema();
        
        try {
          await preferenceSchema.validate(firstIncomplete, { abortEarly: false });
        } catch (error) {
          // Mark fields as touched to show errors
          handleValidationErrors(error, firstIncompleteIndex);
          // Don't reset isSubmittingRef here since we never set it
          return; // Don't proceed if validation fails
        }

        // If validation passes, check if preference is complete
        if (!isPreferenceComplete(firstIncomplete)) {
          dispatch(addToast({ type: "error", message: t("validation.pleaseFillRequiredFields") }));
          // Don't reset isSubmittingRef here since we never set it
          return;
        }

        // Check if this preference was already sent to API
        const preferenceHash = getPreferenceHash(firstIncomplete);
        if (preferencesSentToApiRef.current.has(preferenceHash)) {
          startTransition(() => {
            const finalPreferences = preferencesUpdated ? restoredPreferences : formik.values.preferences;
            setTimeout(() => {
              formik.setFieldValue("preferences", [...finalPreferences, getEmptyPreference()], false);
            }, 0);
          });
          // Don't reset isSubmittingRef here since we never set it
          return;
        }

        // Save the preference to API
        preferencesSentToApiRef.current.add(preferenceHash);

        const result = await createMultiplePreferences([firstIncomplete]);
        
        if (result.success) {
          // Fetch latest preferences from API to get updated data and hide the form
          // Pass forceRefresh=true to bypass "already fetched" check and get latest data
          try {
            await fetchApplicationPreferences(applicantId, true);
          } catch (error) {
          }
          
          // After fetching, add a new empty preference so user can continue adding
          startTransition(() => {
            setTimeout(() => {
              formik.setFieldValue("preferences", (currentPreferences: PreferenceItem[]) => {
                const newPreferences = [...currentPreferences, getEmptyPreference()];
                return newPreferences;
              }, false);
            }, 0);
          });
        } else {
          // Remove from sent set if save failed
          preferencesSentToApiRef.current.delete(preferenceHash);
        }
      } else {
        startTransition(() => {
          const finalPreferences = preferencesUpdated ? restoredPreferences : formik.values.preferences;
          setTimeout(() => {
            formik.setFieldValue("preferences", [...finalPreferences, getEmptyPreference()], false);
          }, 0);
        });
      }
    } catch (error) {
      const { message } = handleApiError(error, "Failed to add preference");
      dispatch(addToast({ type: "error", message }));
      // Reset isSubmittingRef if createMultiplePreferences set it
      if (isSubmittingRef.current) {
        isSubmittingRef.current = false;
      }
    } finally {
      // Only reset if it was set (by createMultiplePreferences)
      // Don't reset if we never set it
    }
  }, [applicantId, formik, isPreferenceComplete, getPreferenceHash, preferencesSentToApiRef, restorePreferenceIds, createMultiplePreferences, getEmptyPreference, handleAddPreference, fetchApplicationPreferences, isSubmittingRef, dispatch, t]);

  const handleSave = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    const allCompletePreferences = formik.values.preferences.filter(isPreferenceComplete);
    const allHavePreferenceId = allCompletePreferences.length > 0 && allCompletePreferences.every((pref) => pref.preferenceId);

    if (allHavePreferenceId) {
      dispatch(addToast({ type: "success", message: t("applicant.preferencesAlreadySaved") }));
      return;
    }

    const { restored: restoredPreferences, updated: preferencesUpdated } = restorePreferenceIds(formik.values.preferences);

    if (preferencesUpdated) {
      await formik.setFieldValue("preferences", restoredPreferences);
    }

    const completePreferences = restoredPreferences.filter((pref) => isPreferenceComplete(pref) && !pref.preferenceId);
    const preferencesNeedingSave = completePreferences.filter((pref) => !preferencesSentToApiRef.current.has(getPreferenceHash(pref)));

    if (preferencesNeedingSave.length === 0) {
      const savedPreferences = restoredPreferences.filter((pref) => isPreferenceComplete(pref) && (pref.preferenceId || preferencesSentToApiRef.current.has(getPreferenceHash(pref))));
      if (savedPreferences.length > 0) {
        dispatch(addToast({ type: "success", message: t("applicant.preferencesAlreadySaved") }));
      }
      return;
    }

    const preferenceSchema = getPreferenceSchema();
    let hasErrors = false;
    const touchedPreferences = [...(formik.touched.preferences || [])];

    for (const pref of preferencesNeedingSave) {
      const index = restoredPreferences.findIndex((p) => p.id === pref.id);
      try {
        await preferenceSchema.validate(pref, { abortEarly: false });
      } catch (error) {
        hasErrors = true;
        touchedPreferences[index] = markAllFieldsAsTouched();
        handleValidationErrors(error, index);
      }
    }

    formik.setTouched({ ...formik.touched, preferences: touchedPreferences as any });

    if (hasErrors) {
      dispatch(addToast({ type: "error", message: t("validation.pleaseFillRequiredFields") }));
      return;
    }

    // Save to API directly (like Add More does)
    try {
      const result = await createMultiplePreferences(preferencesNeedingSave);
      
      if (result.success) {
        // Fetch latest preferences from API to get updated data and hide the form
        // Pass forceRefresh=true to bypass "already fetched" check and get latest data
        await fetchApplicationPreferences(applicantId!, true);
        
        if (editingIndex !== null) {
          setEditingIndex(null);
        }
        
        setShouldNavigateNext(false);
        dispatch(addToast({ type: "success", message: t("applicant.preferencesSaved") }));
      } else {
        dispatch(addToast({ type: "error", message: t("applicant.failedToSavePreferences") }));
      }
    } catch (error) {
      const { message } = handleApiError(error, "Failed to save preferences");
      dispatch(addToast({ type: "error", message }));
    }
  }, [isSaving, formik, editingIndex, setEditingIndex, setShouldNavigateNext, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, isPreferenceComplete, getPreferenceHash, preferencesSentToApiRef, restorePreferenceIds, createMultiplePreferences, fetchApplicationPreferences, applicantId, isSubmittingRef, dispatch, t]);

  const handleSaveAndNext = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    const allCompletePreferences = formik.values.preferences.filter(isPreferenceComplete);
    const allHavePreferenceId = allCompletePreferences.length > 0 && allCompletePreferences.every((pref) => pref.preferenceId);

    if (allHavePreferenceId) {
      if (onSaveAndNext) onSaveAndNext();
      return;
    }

    const { restored: restoredPreferences, updated: preferencesUpdated } = restorePreferenceIds(formik.values.preferences);

    if (preferencesUpdated) {
      await formik.setFieldValue("preferences", restoredPreferences);
    }

    const completePreferences = restoredPreferences.filter((pref) => isPreferenceComplete(pref) && !pref.preferenceId);
    const preferencesNeedingSave = completePreferences.filter((pref) => !preferencesSentToApiRef.current.has(getPreferenceHash(pref)));

    if (preferencesNeedingSave.length === 0) {
      if (onSaveAndNext) onSaveAndNext();
      return;
    }

    const preferenceSchema = getPreferenceSchema();
    let hasErrors = false;
    const touchedPreferences = [...(formik.touched.preferences || [])];

    for (const pref of preferencesNeedingSave) {
      const index = restoredPreferences.findIndex((p) => p.id === pref.id);
      try {
        await preferenceSchema.validate(pref, { abortEarly: false });
      } catch (error) {
        hasErrors = true;
        touchedPreferences[index] = markAllFieldsAsTouched();
        handleValidationErrors(error, index);
      }
    }

    formik.setTouched({ ...formik.touched, preferences: touchedPreferences as any });

    if (hasErrors) {
      dispatch(addToast({ type: "error", message: t("validation.pleaseFillRequiredFields") }));
      return;
    }

    // Save to API directly (like Add More does)
    try {
      const result = await createMultiplePreferences(preferencesNeedingSave);
      
      if (result.success) {
        // Fetch latest preferences from API to get updated data and hide the form
        // Pass forceRefresh=true to bypass "already fetched" check and get latest data
        await fetchApplicationPreferences(applicantId!, true);
        
        if (editingIndex !== null) {
          setEditingIndex(null);
        }
        
        setShouldNavigateNext(true);
        dispatch(addToast({ type: "success", message: t("applicant.preferencesSaved") }));
        
        // Navigate to next tab after successful save
        if (onSaveAndNext) onSaveAndNext();
      } else {
        dispatch(addToast({ type: "error", message: t("applicant.failedToSavePreferences") }));
      }
    } catch (error) {
      const { message } = handleApiError(error, "Failed to save preferences");
      dispatch(addToast({ type: "error", message }));
    }
  }, [isSaving, formik, editingIndex, setEditingIndex, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, isPreferenceComplete, getPreferenceHash, preferencesSentToApiRef, restorePreferenceIds, createMultiplePreferences, fetchApplicationPreferences, applicantId, setShouldNavigateNext, isSubmittingRef, onSaveAndNext, dispatch, t]);

  return {
    handleAddPreferenceWithAPI,
    handleSave,
    handleSaveAndNext,
  };
}

