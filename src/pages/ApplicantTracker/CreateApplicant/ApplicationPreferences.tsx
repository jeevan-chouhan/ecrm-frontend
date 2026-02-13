import { useMemo, useEffect, useRef, useCallback } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { ConfirmationPopup } from "../../../components";
import { COLORS } from "../../../constants";
import type { PreferenceItem, ApplicationPreferencesFormData } from "./types";
import {
  useDataChangeTracking,
  useFormSync,
  usePreferenceLogic,
  usePreferenceDataFetching,
  usePreferenceOptions,
  usePreferenceApiOperations,
  usePreferenceFormValidation,
  usePreferenceFieldUpdates,
  usePreferenceState,
  usePreferenceFormSubmission,
} from "./hooks";
import { PreferenceFormSection, PreferenceListSection, PreferenceActionButtons } from "./components";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

interface ApplicationPreferencesProps {
  initialValues: ApplicationPreferencesFormData;
  onUpdate: (data: ApplicationPreferencesFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
  applicantId?: number | string | null;
  activeTab?: string;
}

const ApplicationPreferences = ({ initialValues, onUpdate, onSaveAndNext, onBack, applicantId, activeTab }: ApplicationPreferencesProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // State management hook
  const state = usePreferenceState();

  // Data fetching hook
  const dataFetching = usePreferenceDataFetching();
  const {
    countryOptions,
    universityOptions,
    campusOptions,
    counselorOptions,
    agencyPartnerOptions,
    enrollmentTypeOptions,
    programTypeOptions,
    universityOptionsMapRef,
    campusOptionsMapRef,
    courseOptionsMapRef,
    counselorOptionsMapRef,
    enrollmentTypeIdMapRef,
    programTypeIdMapRef,
    lastFetchedCourseKeyRef,
    lastFetchedCourseKey,
    hasFetchedEnrollmentTypesRef,
    fetchCountries,
    fetchUniversities,
    fetchCampuses,
    fetchCourses,
    fetchCounselorsByCountry,
    fetchAgencyPartnerNames,
    fetchEnrollmentTypes,
    fetchProgramTypes,
  } = dataFetching;

  // Form validation hook
  const { getPreferenceSchema, validationSchema, isPreferenceComplete } = usePreferenceFormValidation();

  const getEmptyPreference = (): PreferenceItem => ({
    id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    enrollmentType: "",
    desiredCountry: "",
    program: "",
    desiredUniversity: "",
    desiredCampus: "",
    course: "",
    desiredIntake: "",
    assignCounselor: "",
    agencyPartnerName: "",
    saved: false,
  });

  const initialPreferencesKey = useMemo(() => JSON.stringify(initialValues.preferences || []), [initialValues.preferences]);

  const initialPreferences = useMemo(() => {
    if (initialValues.preferences && initialValues.preferences.length > 0) {
      return [...initialValues.preferences];
    }
    return [getEmptyPreference()];
  }, [initialPreferencesKey]);

  const formik = useFormik<ApplicationPreferencesFormData>({
    initialValues: { preferences: initialPreferences },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    validationSchema,
    onSubmit: async (values) => {
      // This onSubmit is now only used as a fallback - Save and Save & Next handle API calls directly
      // Prevent duplicate API calls by checking if already submitting
      if (state.isSubmittingRef.current || !applicantId) {
        if (!applicantId) {
          dispatch(addToast({ type: "error", message: t("applicant.applicantIdRequired", "Please save personal details first to get applicant ID") }));
        }
        return;
      }

      // Only proceed if shouldNavigateNext is true (meaning Save & Next was clicked)
      // Otherwise, handleSave or handleSaveAndNext will handle the API call
      if (!state.shouldNavigateNext) {
        return;
      }

      state.isSubmittingRef.current = true;
      state.setIsSaving(true);
      dispatch(showLoader());

      try {
        const completePreferences = values.preferences.filter(isPreferenceComplete);
        if (completePreferences.length === 0) {
          dispatch(addToast({ type: "error", message: t("validation.atLeastOnePreferenceRequired", "At least one complete preference is required") }));
          return;
        }

        const preferencesToCreate = completePreferences.filter((pref) => !pref.preferenceId && pref.saved);
        if (preferencesToCreate.length === 0) {
          markAsSaved({ preferences: [...values.preferences] });
          if (state.shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            state.setShouldNavigateNext(false);
          }
          return;
        }

        const result = await apiOperations.createMultiplePreferences(preferencesToCreate);
        if (result.success) {
          // Fetch latest preferences after save
          await apiOperations.fetchApplicationPreferences(applicantId);
          dispatch(addToast({ type: "success", message: t("applicant.preferencesSaved", "Application preferences saved successfully") }));
          markAsSaved({ preferences: [...values.preferences] });
          if (state.shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            state.setShouldNavigateNext(false);
          }
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save application preferences");
        dispatch(addToast({ type: "error", message }));
      } finally {
        state.isSubmittingRef.current = false;
        state.setIsSaving(false);
        dispatch(hideLoader());
      }
    },
  });

  // API operations hook
  const apiOperations = usePreferenceApiOperations({
    formik,
    applicantId,
    user,
    enrollmentTypeIdMapRef,
    programTypeIdMapRef,
    originalPreferencesRef: state.originalPreferencesRef,
    preferencesSentToApiRef: state.preferencesSentToApiRef,
    isSubmittingRef: state.isSubmittingRef,
    isFetchingPreferencesRef: state.isFetchingPreferencesRef,
    hasFetchedPreferencesRef: state.hasFetchedPreferencesRef,
    lastFetchedApplicantIdRef: state.lastFetchedApplicantIdRef,
    fetchEnrollmentTypes,
    hasFetchedEnrollmentTypesRef,
    fetchUniversities,
    fetchCampuses,
    fetchCourses,
    fetchCounselorsByCountry,
    onUpdate,
    getEmptyPreference,
    t,
  });

  // Preference logic hook
  const {
    getIncompletePreferences,
    getCompletePreferences,
    handleAddPreference,
    handleCancelIncompletePreference,
    handleSavePreference,
    handleEditPreference: baseHandleEditPreference,
    handleCancelEdit,
    getFieldError,
    updatePreferenceField: baseUpdatePreferenceField,
  } = usePreferenceLogic({
    formik,
    editingIndex: state.editingIndex,
    setEditingIndex: state.setEditingIndex,
    getPreferenceSchema,
    getEmptyPreference,
    isPreferenceComplete,
    handleValidationErrors: (error: unknown, index: number) => {
      if (error instanceof Error && "inner" in error) {
        const errors = (error as any).inner || [];
        
        // Build touched and error objects for all fields at once to prevent multiple re-renders
        const touchedFields: Record<string, boolean> = {};
        const errorFields: Record<string, string> = {};
        
        errors.forEach((err: any) => {
          if (err.path) {
            touchedFields[err.path] = true;
            // Use the error message from validation, or a default message
            errorFields[err.path] = err.message || `${err.path} is required`;
          }
        });
        
        // Set all touched fields and errors in a single operation
        if (Object.keys(touchedFields).length > 0) {
          
          // Get current touched state
          const currentTouched = formik.touched.preferences?.[index] || {};
          
          // Merge with new touched fields
          const newTouched = { ...currentTouched, ...touchedFields };
          
          // Update touched state for this preference index only
          const updatedTouched = [...(formik.touched.preferences || [])];
          updatedTouched[index] = newTouched;
          
          // Get current errors state
          const currentErrors = (formik.errors.preferences?.[index] && typeof formik.errors.preferences[index] === 'object') 
            ? { ...(formik.errors.preferences[index] as Record<string, string>) } 
            : {};
          
          // Merge with new error fields
          const newErrors = { ...currentErrors, ...errorFields };
          
          // Update errors state for this preference index only
          const updatedErrors = [...(formik.errors.preferences || [])];
          updatedErrors[index] = newErrors;
          
          // Set all touched fields and errors synchronously in a single batch
          // Set errors first, then touched, so errors are available when component re-renders
          formik.setErrors({
            ...formik.errors,
            preferences: updatedErrors as any,
          });
          
          formik.setTouched({
            ...formik.touched,
            preferences: updatedTouched as any,
          }, false); // Use validate: false to prevent validation loops
        }
      }
    },
  });

  // Field updates hook
  const { updatePreferenceField } = usePreferenceFieldUpdates({
    formik,
    user,
    fetchUniversities,
    fetchCampuses,
    fetchCourses,
    fetchCounselorsByCountry,
    setSelectedCountryId: state.setSelectedCountryId,
    setSelectedUniversityId: state.setSelectedUniversityId,
    isUpdatingCourseFromProgramRef: state.isUpdatingCourseFromProgramRef,
    baseUpdatePreferenceField,
  });

  // Form submission hook
  const { handleAddPreferenceWithAPI, handleSave, handleSaveAndNext } = usePreferenceFormSubmission({
    formik,
    applicantId,
    isSaving: state.isSaving,
    setIsSaving: state.setIsSaving,
    editingIndex: state.editingIndex,
    setEditingIndex: state.setEditingIndex,
    shouldNavigateNext: state.shouldNavigateNext,
    setShouldNavigateNext: state.setShouldNavigateNext,
    isSubmittingRef: state.isSubmittingRef,
    originalPreferencesRef: state.originalPreferencesRef,
    preferencesSentToApiRef: state.preferencesSentToApiRef,
    isPreferenceComplete,
    getPreferenceSchema,
    getEmptyPreference,
    markAllFieldsAsTouched: () => ({
      enrollmentType: true,
      desiredCountry: true,
      program: true,
      desiredUniversity: true,
      desiredCampus: true,
      course: true,
      desiredIntake: true,
      assignCounselor: true,
      agencyPartnerName: true,
    }),
    handleValidationErrors: (error: unknown, index: number) => {
      if (error instanceof Error && "inner" in error) {
        const errors = (error as any).inner || [];
        
        // Build touched and error objects for all fields at once to prevent multiple re-renders
        const touchedFields: Record<string, boolean> = {};
        const errorFields: Record<string, string> = {};
        
        errors.forEach((err: any) => {
          if (err.path) {
            touchedFields[err.path] = true;
            // Use the error message from validation, or a default message
            errorFields[err.path] = err.message || `${err.path} is required`;
          }
        });
        
        // Set all touched fields and errors in a single operation
        if (Object.keys(touchedFields).length > 0) {
          
          // Get current touched state
          const currentTouched = formik.touched.preferences?.[index] || {};
          
          // Merge with new touched fields
          const newTouched = { ...currentTouched, ...touchedFields };
          
          // Update touched state for this preference index only
          const updatedTouched = [...(formik.touched.preferences || [])];
          updatedTouched[index] = newTouched;
          
          // Get current errors state
          const currentErrors = (formik.errors.preferences?.[index] && typeof formik.errors.preferences[index] === 'object') 
            ? { ...(formik.errors.preferences[index] as Record<string, string>) } 
            : {};
          
          // Merge with new error fields
          const newErrors = { ...currentErrors, ...errorFields };
          
          // Update errors state for this preference index only
          const updatedErrors = [...(formik.errors.preferences || [])];
          updatedErrors[index] = newErrors;
          
          // Set all touched fields and errors synchronously in a single batch
          // Use React's batching to ensure both are set before re-render
          formik.setErrors({
            ...formik.errors,
            preferences: updatedErrors as any,
          });
          
          formik.setTouched({
            ...formik.touched,
            preferences: updatedTouched as any,
          }, false); // Use validate: false to prevent validation loops
        }
      }
    },
    createMultiplePreferences: apiOperations.createMultiplePreferences,
    handleAddPreference,
    fetchApplicationPreferences: apiOperations.fetchApplicationPreferences,
    onSaveAndNext,
    t,
  });

  // Data change tracking
  const { markAsSaved } = useDataChangeTracking<ApplicationPreferencesFormData>(
    formik.values,
    (lastSavedData, current) => {
      if (!lastSavedData) return true;
      const currentSaved = current.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
      const lastSaved = lastSavedData.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
      if (currentSaved.length !== lastSaved.length) return true;
      return currentSaved.some((currentItem, index) => {
        const lastItem = lastSaved[index];
        if (!lastItem) return true;
        return (
          currentItem.enrollmentType !== lastItem.enrollmentType ||
          currentItem.desiredCountry !== lastItem.desiredCountry ||
          currentItem.program !== lastItem.program ||
          currentItem.desiredUniversity !== lastItem.desiredUniversity ||
          currentItem.desiredCampus !== lastItem.desiredCampus ||
          currentItem.course !== lastItem.course ||
          currentItem.desiredIntake !== lastItem.desiredIntake ||
          currentItem.assignCounselor !== lastItem.assignCounselor ||
          currentItem.agencyPartnerName !== lastItem.agencyPartnerName
        );
      });
    }
  );

  // Form sync
  useFormSync<ApplicationPreferencesFormData>(
    formik.values,
    onUpdate,
    (prev, current) => {
      if (current.preferences.length !== prev.preferences.length) return true;
      return current.preferences.some((currentItem, index) => {
        const prevItem = prev.preferences[index];
        if (!prevItem) return true;
        return (
          currentItem.id !== prevItem.id ||
          currentItem.enrollmentType !== prevItem.enrollmentType ||
          currentItem.desiredCountry !== prevItem.desiredCountry ||
          currentItem.program !== prevItem.program ||
          currentItem.desiredUniversity !== prevItem.desiredUniversity ||
          currentItem.desiredCampus !== prevItem.desiredCampus ||
          currentItem.course !== prevItem.course ||
          currentItem.desiredIntake !== prevItem.desiredIntake ||
          currentItem.assignCounselor !== prevItem.assignCounselor ||
          currentItem.agencyPartnerName !== prevItem.agencyPartnerName ||
          currentItem.saved !== prevItem.saved
        );
      });
    }
  );

  // Effects
  useEffect(() => {
    if (initialValues.preferences && initialValues.preferences.length > 0) {
      const currentPrefsString = JSON.stringify(formik.values.preferences);
      const newPrefsString = JSON.stringify(initialValues.preferences);
      if (currentPrefsString !== newPrefsString) {
        formik.setValues({ preferences: [...initialValues.preferences] }, false);
      }
    }
  }, [initialPreferencesKey]);

  useEffect(() => {
    if (user?.agencyId) {
      fetchCountries();
      fetchAgencyPartnerNames();
    }
    fetchEnrollmentTypes();
    fetchProgramTypes();
  }, [user?.agencyId, fetchCountries, fetchAgencyPartnerNames, fetchEnrollmentTypes, fetchProgramTypes]);

  const previousActiveTabRef = useRef<string | undefined>(activeTab);
  useEffect(() => {
    if (applicantId && !state.isFetchingPreferencesRef.current && hasFetchedEnrollmentTypesRef.current) {
      const hasAlreadyFetched = state.hasFetchedPreferencesRef.current && state.lastFetchedApplicantIdRef.current?.toString() === applicantId.toString();
      const tabJustBecameActive = previousActiveTabRef.current !== "preferences" && activeTab === "preferences";
      const shouldFetch = !hasAlreadyFetched || tabJustBecameActive;
      if (shouldFetch) {
        apiOperations.fetchApplicationPreferences(applicantId);
      }
      previousActiveTabRef.current = activeTab;
    }
  }, [applicantId, hasFetchedEnrollmentTypesRef.current, activeTab, apiOperations]); // Removed 'state' - only refs are used

  useEffect(() => {
    if (applicantId && state.lastFetchedApplicantIdRef.current?.toString() !== applicantId.toString()) {
      state.hasFetchedPreferencesRef.current = false;
    }
  }, [applicantId]); // Removed 'state' - only refs are used

  useEffect(() => {
    const prefWithCountry = formik.values.preferences.find((pref) => pref.desiredCountry && pref.desiredCountry !== "");
    if (prefWithCountry?.desiredCountry) {
      const countryIdNum = parseInt(prefWithCountry.desiredCountry);
      if (!isNaN(countryIdNum) && countryIdNum !== state.selectedCountryId && user?.agencyId) {
        state.setSelectedCountryId(countryIdNum);
        fetchUniversities(countryIdNum);
      }
    }
  }, [formik.values.preferences, state.selectedCountryId, user?.agencyId, fetchUniversities, state.setSelectedCountryId]); // Keep state.selectedCountryId, add state.setSelectedCountryId

  useEffect(() => {
    const prefWithUniversity = formik.values.preferences.find((pref) => pref.desiredUniversity && pref.desiredUniversity !== "");
    if (prefWithUniversity?.desiredUniversity) {
      const universityIdNum = parseInt(prefWithUniversity.desiredUniversity);
      if (!isNaN(universityIdNum) && universityIdNum !== state.selectedUniversityId && user?.agencyId) {
        state.setSelectedUniversityId(universityIdNum);
        fetchCampuses(universityIdNum);
      }
    }
  }, [formik.values.preferences, state.selectedUniversityId, user?.agencyId, fetchCampuses, state.setSelectedUniversityId]); // Keep state.selectedUniversityId, add state.setSelectedUniversityId

  // Only fetch courses for preferences that are complete and saved (not for incomplete ones being edited)
  // This prevents fetching courses when user is actively changing program type
  useEffect(() => {
    const validPreferences = formik.values.preferences.filter((pref) => isPreferenceComplete(pref) || !!pref.preferenceId);
    state.setIsFormValid(validPreferences.length > 0);
  }, [formik.values.preferences, isPreferenceComplete, state.setIsFormValid]); // Use setter directly instead of 'state'

  // Get preferences - memoize to prevent unnecessary recalculations
  // Use content-based keys for stable memoization
  const incompleteKey = useMemo(() => {
    return formik.values.preferences
      .filter((pref, index) => {
        if (state.editingIndex === index) return false;
        return !pref.saved;
      })
      .map(pref => `${pref.id}-${pref.saved ? 'saved' : 'unsaved'}`)
      .join('|');
  }, [formik.values.preferences, state.editingIndex]);

  const incomplete = useMemo(() => {
    const result = getIncompletePreferences();
    return result;
  }, [incompleteKey, getIncompletePreferences]);

  // Create a stable key for complete preferences to prevent unnecessary recalculations
  const completeKey = useMemo(() => {
    return formik.values.preferences
      .filter((pref, index) => {
        if (state.editingIndex === index) return true;
        return pref.saved && (isPreferenceComplete(pref) || !!pref.preferenceId);
      })
      .map(pref => `${pref.id}-${pref.saved ? 'saved' : 'unsaved'}-${pref.preferenceId || 'no-id'}-${pref.desiredCampus || ''}-${pref.program || ''}`)
      .join('|');
  }, [formik.values.preferences, state.editingIndex, isPreferenceComplete]);
  
  const complete = useMemo(() => {
    const result = getCompletePreferences();
    return result;
  }, [completeKey, getCompletePreferences]);

  // Only fetch courses for preferences that are complete and saved (not for incomplete ones being edited)
  // This prevents fetching courses when user is actively changing program type
  // Use a ref to track what we've already fetched to prevent duplicate calls
  const fetchedCombinationsRef = useRef<Set<string>>(new Set());
  const completePrefsKeyRef = useRef<string>("");
  
  useEffect(() => {
    if (!user?.agencyId) {
      return;
    }

    // Only fetch for complete preferences (saved ones), not for incomplete ones being edited
    const completePrefs = complete.filter((pref: PreferenceItem) => pref.saved);
    
    // Create a stable key from complete preferences to detect actual changes
    const completePrefsKey = completePrefs
      .map((pref: PreferenceItem) => {
        if (!pref.desiredCampus || !pref.program) return null;
        return `${pref.preferenceId || pref.id}-${pref.desiredCampus}-${pref.program}`;
      })
      .filter(Boolean)
      .sort()
      .join('|');
    
    // Only proceed if the complete preferences actually changed
    if (completePrefsKeyRef.current === completePrefsKey) {
      return; // No change, skip
    }
    
    // Don't run if we're in the middle of adding a preference
    const hasIncomplete = formik.values.preferences.some(pref => !pref.saved);
    if (hasIncomplete && completePrefsKeyRef.current === "") {
      return;
    }

    completePrefsKeyRef.current = completePrefsKey;
    
    const combinations = new Set<string>();
    completePrefs.forEach((pref: PreferenceItem) => {
      if (pref.desiredCampus && pref.program) {
        combinations.add(`${pref.desiredCampus}-${pref.program}`);
      }
    });
    
    // Track timeouts for cleanup
    const timeouts: NodeJS.Timeout[] = [];
    
    // Only fetch for combinations we haven't fetched yet
    combinations.forEach((combination) => {
      if (!fetchedCombinationsRef.current.has(combination) && !courseOptionsMapRef.current.has(combination)) {
        const [campusIdStr, program] = combination.split("-");
        const campusIdNum = parseInt(campusIdStr);
        if (!isNaN(campusIdNum) && program) {
          fetchedCombinationsRef.current.add(combination);
          // Use setTimeout to debounce and prevent rapid successive calls
          const timeout = setTimeout(() => {
            fetchCourses(campusIdNum, program);
          }, 100);
          timeouts.push(timeout);
        }
      }
    });
    
    // Clean up combinations that are no longer in complete preferences
    fetchedCombinationsRef.current.forEach((combination) => {
      if (!combinations.has(combination)) {
        fetchedCombinationsRef.current.delete(combination);
      }
    });
    
    // Cleanup function to clear timeouts if component unmounts or dependencies change
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [complete, user?.agencyId, fetchCourses, courseOptionsMapRef, formik.values.preferences]);

  // Wrapper for handleEditPreference that fetches dropdowns
  const handleEditPreference = useCallback(async (index: number) => {
    const preference = formik.values.preferences[index];
    if (!user?.agencyId) {
      baseHandleEditPreference(index);
      return;
    }
    if (preference.desiredCountry) {
      await fetchUniversities(parseInt(preference.desiredCountry));
      await fetchCounselorsByCountry(parseInt(preference.desiredCountry));
    }
    if (preference.desiredUniversity) {
      await fetchCampuses(parseInt(preference.desiredUniversity));
    }
    if (preference.desiredCampus && preference.program) {
      await fetchCourses(parseInt(preference.desiredCampus), preference.program);
    }
    baseHandleEditPreference(index);
  }, [user?.agencyId, fetchUniversities, fetchCounselorsByCountry, fetchCampuses, fetchCourses, baseHandleEditPreference, formik.values.preferences]);

  // Wrapper for handleSavePreference that calls API
  const handleSavePreferenceWithAPI = useCallback(async (index: number) => {
    const preference = formik.values.preferences[index];
    if (preference.preferenceId && applicantId) {
      await apiOperations.updatePreference(index, preference);
      if (state.editingIndex === index) {
        state.setEditingIndex(null);
      }
    } else if (applicantId) {
      await apiOperations.createPreference(index, preference);
      if (state.editingIndex === index) {
        state.setEditingIndex(null);
      }
    } else {
      handleSavePreference(index);
    }
  }, [applicantId, apiOperations, state.editingIndex, state.setEditingIndex, handleSavePreference, formik.values.preferences]);

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (state.deletingIndex === null) return;
    const preference = formik.values.preferences[state.deletingIndex];
    if (preference.preferenceId && applicantId) {
      state.setIsDeleting(true);
      await apiOperations.deletePreference(state.deletingIndex, preference.preferenceId);
      state.setIsDeletePopupOpen(false);
      state.setDeletingIndex(null);
      state.setIsDeleting(false);
      if (state.editingIndex === state.deletingIndex) {
        state.setEditingIndex(null);
      }
        } else {
      handleCancelIncompletePreference(state.deletingIndex);
      state.setIsDeletePopupOpen(false);
      state.setDeletingIndex(null);
    }
  };

  // Create preference index map
  const preferenceIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    formik.values.preferences.forEach((pref, index) => {
      map.set(pref.id, index);
    });
    return map;
  }, [formik.values.preferences]);
  
  // Memoize first incomplete preference
  const firstIncomplete = useMemo(() => (incomplete.length > 0 ? incomplete[0] : null), [incomplete]);
  const firstIncompleteIndex = useMemo(() => {
    if (!firstIncomplete) return -1;
    return preferenceIndexMap.get(firstIncomplete.id) ?? -1;
  }, [firstIncomplete, preferenceIndexMap]);

  // Options hook
  const { preferenceOptionsMap, incompleteCourseOptions } = usePreferenceOptions({
    completePreferences: complete,
    universityOptions,
    campusOptions,
    counselorOptions,
    universityOptionsMapRef,
    campusOptionsMapRef,
    courseOptionsMapRef,
    counselorOptionsMapRef,
    lastFetchedCourseKeyRef,
    lastFetchedCourseKey,
    firstIncomplete,
  });

  return (
    <div className="space-y-6">
      <PreferenceFormSection
        firstIncomplete={firstIncomplete}
        firstIncompleteIndex={firstIncompleteIndex}
        incompleteCount={incomplete.length}
        completeCount={complete.length}
            onFieldChange={updatePreferenceField}
            getFieldError={getFieldError}
        onCancel={handleCancelIncompletePreference}
            onAddMore={handleAddPreferenceWithAPI}
            enrollmentTypeOptions={enrollmentTypeOptions}
            countryOptions={countryOptions}
            universityOptions={universityOptions}
            campusOptions={campusOptions}
        programTypeOptions={programTypeOptions}
        courseOptions={incompleteCourseOptions}
            counselorOptions={counselorOptions}
            agencyPartnerOptions={agencyPartnerOptions}
        applicantId={applicantId}
        isSaving={state.isSaving}
        t={t}
      />

      <PreferenceListSection
        completePreferences={complete}
        preferenceIndexMap={preferenceIndexMap}
        editingIndex={state.editingIndex}
        onEdit={handleEditPreference}
        onDelete={state.handleDeletePreference}
        onSave={handleSavePreferenceWithAPI}
                  onCancel={handleCancelEdit}
                  onFieldChange={updatePreferenceField}
                  getFieldError={getFieldError}
        preferenceOptionsMap={preferenceOptionsMap}
                  enrollmentTypeOptions={enrollmentTypeOptions}
                  countryOptions={countryOptions}
        universityOptions={universityOptions}
        campusOptions={campusOptions}
        programTypeOptions={programTypeOptions}
        counselorOptions={counselorOptions}
                  agencyPartnerOptions={agencyPartnerOptions}
        t={t}
                />

      {complete.length === 0 && incomplete.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            {t("applicant.noPreferencesAdded")}
          </p>
        </div>
      )}

      <PreferenceActionButtons
        onBack={onBack}
        onSave={handleSave}
        onSaveAndNext={handleSaveAndNext}
        isSaving={state.isSaving}
        isFormValid={state.isFormValid}
        applicantId={applicantId}
        t={t}
      />

      <ConfirmationPopup
        isOpen={state.isDeletePopupOpen}
        title={t("applicant.deletePreference", "Delete Preference")}
        message={`${t("applicant.deleteConfirmation", "Are you sure you want to delete this preference?")} ${t("applicant.deleteWarning", "This action cannot be undone.")}`}
        confirmLabel={t("common.delete", "Delete")}
        variant="danger"
        isLoading={state.isDeleting}
        isDisabled={state.isDeleting}
        onClose={state.handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ApplicationPreferences;
