import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Button, ConfirmationPopup } from "../../../components";
import { COLORS } from "../../../constants";
import PreferenceForm from "./PreferenceForm";
import PreferenceCard from "./PreferenceCard";
import type { PreferenceItem, ApplicationPreferencesFormData } from "./types";
import { useDataChangeTracking, useFormSync, usePreferenceLogic } from "./hooks";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

interface ApplicationPreferencesProps {
  initialValues: ApplicationPreferencesFormData;
  onUpdate: (data: ApplicationPreferencesFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
  applicantId?: number | string | null; // Current applicant ID (required for API)
}

const ApplicationPreferences = ({ initialValues, onUpdate, onSaveAndNext, onBack, applicantId }: ApplicationPreferencesProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions

  // Reusable preference validation schema
  const getPreferenceSchema = useCallback(() => {
    return Yup.object().shape({
      desiredCountry: Yup.string().required(t("validation.countryRequired")),
      program: Yup.string().required(t("validation.programRequired")),
      desiredUniversity: Yup.string().required(t("validation.universityRequired")),
      desiredCampus: Yup.string().required(t("validation.campusRequired")),
      course: Yup.string().required(t("validation.courseRequired")),
      desiredIntake: Yup.string().required(t("validation.intakeRequired")),
      assignCounselor: Yup.string().nullable(),
      agencyPartnerName: Yup.string().nullable(),
    });
  }, [t, i18n.language]);

  // Validation schema using Yup with i18n messages
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        preferences: Yup.array()
          .of(getPreferenceSchema())
          .min(1, t("validation.atLeastOnePreferenceRequired")),
      }),
    [getPreferenceSchema, t]
  );

  const getEmptyPreference = (): PreferenceItem => ({
    id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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

  const isPreferenceComplete = (pref: PreferenceItem): boolean => {
    return !!(
      pref.desiredCountry &&
      pref.program &&
      pref.desiredUniversity &&
      // pref.desiredCampus &&
      pref.course &&
      pref.desiredIntake
    );
  };

  // Map program value to API course type
  const mapProgramToCourseType = useCallback((program: string): string => {
    const programMap: Record<string, string> = {
      "ug": "BACHELOR",
      "pg": "MASTER",
      "phd": "PHD",
      "diploma": "DIPLOMA",
    };
    return programMap[program.toLowerCase()] || program.toUpperCase();
  }, []);

  // Convert form preference to API payload format
  const convertPreferenceToApiFormat = useCallback((pref: PreferenceItem) => {
    return {
      desiredCountryId: parseInt(pref.desiredCountry) || 0,
      desiredUniversityId: parseInt(pref.desiredUniversity) || 0,
      desiredCourseType: mapProgramToCourseType(pref.program),
      desiredCampusId: parseInt(pref.desiredCampus) || 0,
      desiredCourseId: parseInt(pref.course) || 0,
      desiredIntake: pref.desiredIntake, // Format: "YYYY-MM"
    };
  }, [mapProgramToCourseType]);

  // Ensure we have at least one preference (empty if none exist)
  // Use JSON.stringify to detect deep changes in the preferences array
  const initialPreferencesKey = useMemo(() => 
    JSON.stringify(initialValues.preferences || []), 
    [initialValues.preferences]
  );

  const initialPreferences = useMemo(() => {
    if (initialValues.preferences && initialValues.preferences.length > 0) {
      // Create a new array reference to ensure formik detects the change
      return [...initialValues.preferences];
    }
    return [getEmptyPreference()];
  }, [initialPreferencesKey]);

  const formik = useFormik<ApplicationPreferencesFormData>({
    initialValues: {
      preferences: initialPreferences,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) {
        return;
      }

      // Check if applicantId is available
      if (!applicantId) {
        dispatch(
          addToast({
            type: "error",
            message: t("applicant.applicantIdRequired", "Please save personal details first to get applicant ID"),
          })
        );
        return;
      }

      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        // Only call API if data has changed since last save
        // This prevents duplicate API calls when clicking Save and then Save & Next with same data
        if (!hasDataChanged) {
          if (import.meta.env.DEV) {
            console.log("No changes detected. Skipping API call.");
          }
          
          // Mark data as saved (in case it wasn't marked before)
          markAsSaved({ preferences: [...values.preferences] });
          
          // Still navigate if needed
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
          return;
        }

        // Create payload object - only include saved preferences
        const savedPreferences = values.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
        
        if (savedPreferences.length === 0) {
          dispatch(
            addToast({
              type: "error",
              message: t("validation.atLeastOnePreferenceRequired", "At least one complete preference is required"),
            })
          );
          return;
        }

        // Convert to API format
        const payload = savedPreferences.map(convertPreferenceToApiFormat);

        // Call API
        const response = await applicantService.createApplicationPreferences(applicantId, payload);

        if (response.status === "success" && response.data) {
          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: response.message || t("applicant.preferencesSaved", "Application preferences saved successfully"),
            })
          );

          // Mark data as saved
          markAsSaved({ preferences: [...values.preferences] });

          // Navigate to next tab if "Save & Next" was clicked
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
        } else {
          throw new Error(response.message || "Failed to save application preferences");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save application preferences");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    },
  });

  // Use reusable hook for data change tracking with custom comparison for arrays
  const { hasDataChanged, markAsSaved } = useDataChangeTracking<ApplicationPreferencesFormData>(
    formik.values,
    (lastSavedData, current) => {
      if (!lastSavedData) return true;
      // Compare saved preferences
      const currentSaved = current.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
      const lastSaved = lastSavedData.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
      
      if (currentSaved.length !== lastSaved.length) {
        return true;
      }
      
      // Deep compare each preference
      return currentSaved.some((currentItem, index) => {
        const lastItem = lastSaved[index];
        if (!lastItem) return true;
        return (
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

  // Force formik to update when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues.preferences && initialValues.preferences.length > 0) {
      const currentPrefsString = JSON.stringify(formik.values.preferences);
      const newPrefsString = JSON.stringify(initialValues.preferences);
      if (currentPrefsString !== newPrefsString) {
        formik.setValues({
          preferences: [...initialValues.preferences],
        }, false);
      }
    }
  }, [initialPreferencesKey]); // Re-run when initialValues change

  // Check form validity - at least one complete preference required (saved or not)
  // This allows Save & Next to work even if preferences aren't saved yet (they'll be saved first)
  useEffect(() => {
    const completePreferences = formik.values.preferences.filter((pref) => 
      isPreferenceComplete(pref)
    );
    setIsFormValid(completePreferences.length > 0);
  }, [formik.values.preferences]);

  // Sync formik values to parent state with optimized comparison
  useFormSync<ApplicationPreferencesFormData>(
    formik.values,
    onUpdate,
    (prev, current) => {
      // Quick length check first
      if (current.preferences.length !== prev.preferences.length) {
        return true;
      }
      
      // Deep comparison only if lengths match
      return current.preferences.some((currentItem, index) => {
        const prevItem = prev.preferences[index];
        if (!prevItem) return true;
        return (
          currentItem.id !== prevItem.id ||
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

  // Helper functions
  const markAllFieldsAsTouched = useCallback(() => {
    return {
      desiredCountry: true,
      program: true,
      desiredUniversity: true,
      desiredCampus: true,
      course: true,
      desiredIntake: true,
      assignCounselor: true,
      agencyPartnerName: true,
    };
  }, []);

  const handleValidationErrors = useCallback((error: unknown, index: number) => {
    if (error instanceof Yup.ValidationError) {
      error.inner.forEach((err) => {
        if (err.path) {
          formik.setFieldTouched(`preferences[${index}].${err.path}`, true);
        }
      });
    }
  }, [formik]);

  // Use extracted logic hook
  const {
    getIncompletePreferences,
    getCompletePreferences,
    handleAddPreference,
    handleCancelIncompletePreference,
    handleSavePreference,
    handleEditPreference,
    handleCancelEdit,
    getFieldError,
    updatePreferenceField,
  } = usePreferenceLogic({
    formik,
    editingIndex,
    setEditingIndex,
    getPreferenceSchema,
    getEmptyPreference,
    isPreferenceComplete,
    handleValidationErrors,
  });

  const handleDeletePreference = useCallback((index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingIndex === null) return;

    const indexToDelete = deletingIndex;
    const preferenceToDelete = formik.values.preferences[indexToDelete];

    // Remove the preference
    const updatedPreferences = formik.values.preferences.filter((_, i) => i !== indexToDelete);
    formik.setFieldValue("preferences", updatedPreferences);
    
    if (editingIndex === indexToDelete) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > indexToDelete) {
      setEditingIndex(editingIndex - 1);
    }

    // Close popup and reset state
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);

    // TODO: Replace with actual API endpoint
    // const response = await fetch(`/api/applicant/preferences/${preferenceToDelete.id}`, {
    //   method: "DELETE",
    // });
    // const result = await response.json();
    if (import.meta.env.DEV) {
      console.log("Delete API call for preference:", preferenceToDelete);
    }
  }, [deletingIndex, formik, editingIndex, setEditingIndex]);

  const handleCancelDelete = useCallback(() => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    // Save all unsaved preferences first
    const unsavedPreferences = formik.values.preferences.filter((pref) => !pref.saved);
    
    if (unsavedPreferences.length > 0) {
      // Validate and save each unsaved preference
      const preferenceSchema = getPreferenceSchema();

      let hasErrors = false;
      const updatedPreferences = [...formik.values.preferences];
      const touchedPreferences = [...(formik.touched.preferences || [])];

      for (const pref of unsavedPreferences) {
        const index = formik.values.preferences.findIndex((p) => p.id === pref.id);
        try {
          await preferenceSchema.validate(pref, { abortEarly: false });
          // Mark as saved if validation passes
          updatedPreferences[index] = {
            ...updatedPreferences[index],
            saved: true,
          };
        } catch (error) {
          hasErrors = true;
          // Mark all fields as touched to show errors
          touchedPreferences[index] = markAllFieldsAsTouched();
          handleValidationErrors(error, index);
        }
      }

      // Update form state
      formik.setFieldValue("preferences", updatedPreferences);
      formik.setTouched({
        ...formik.touched,
        preferences: touchedPreferences as any,
      });

      // If there are validation errors, don't proceed with form submission
      if (hasErrors) {
        dispatch(
          addToast({
            type: "error",
            message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
          })
        );
        return;
      }
    }

    // Close edit mode if any preference was being edited
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    setShouldNavigateNext(false);
    // Submit the form (which will call API with saved preferences)
    await formik.submitForm();
  }, [isSaving, formik, editingIndex, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, dispatch, t]);

  const handleSaveAndNextClick = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    // Check if there are any unsaved preferences
    const unsavedPreferences = formik.values.preferences.filter((pref) => !pref.saved);
    if (unsavedPreferences.length > 0) {
      // Validate and save each unsaved preference first
      const preferenceSchema = getPreferenceSchema();
      let hasErrors = false;
      const updatedPreferences = [...formik.values.preferences];
      const touchedPreferences = formik.values.preferences.map((pref, index) => {
        if (!pref.saved) {
          return markAllFieldsAsTouched();
        }
        return formik.touched.preferences?.[index] || {};
      });

      for (const pref of unsavedPreferences) {
        const index = formik.values.preferences.findIndex((p) => p.id === pref.id);
        try {
          await preferenceSchema.validate(pref, { abortEarly: false });
          updatedPreferences[index] = {
            ...updatedPreferences[index],
            saved: true,
          };
        } catch (error) {
          hasErrors = true;
          touchedPreferences[index] = markAllFieldsAsTouched();
          handleValidationErrors(error, index);
        }
      }

      formik.setFieldValue("preferences", updatedPreferences);
      formik.setTouched({
        preferences: touchedPreferences as any,
      });

      if (hasErrors) {
        dispatch(
          addToast({
            type: "error",
            message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
          })
        );
        return;
      }
    }

    // Validate all saved preferences before proceeding
    const savedPreferences = formik.values.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
    if (savedPreferences.length === 0) {
      dispatch(
        addToast({
          type: "error",
          message: t("validation.atLeastOnePreferenceRequired", "At least one complete preference is required"),
        })
      );
      return;
    }

    // Close edit mode if any preference was being edited
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    setShouldNavigateNext(true);
    // Submit form and then navigate (navigation happens in onSubmit)
    await formik.submitForm();
  }, [isSaving, formik, editingIndex, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, isPreferenceComplete, dispatch, t]);


  const incomplete = getIncompletePreferences();
  const complete = getCompletePreferences();
  const firstIncomplete = incomplete.length > 0 ? incomplete[0] : null;
  const firstIncompleteIndex = firstIncomplete
    ? formik.values.preferences.findIndex((p) => p.id === firstIncomplete.id)
    : -1;

  return (
    <div className="space-y-6">
      {/* Application Preferences Form Section */}
      <div>

        {/* Show form for only the first incomplete preference */}
        {firstIncomplete && firstIncompleteIndex >= 0 && (
          <PreferenceForm
            preference={firstIncomplete}
            index={firstIncompleteIndex}
            onFieldChange={updatePreferenceField}
            getFieldError={getFieldError}
            onCancel={() => handleCancelIncompletePreference(firstIncompleteIndex)}
            onAddMore={handleAddPreference}
            showCancel={incomplete.length > 1 || complete.length > 0}
            showAddMore={true}
          />
        )}

        {/* Show Add More button if all preferences are complete */}
        {incomplete.length === 0 && formik.values.preferences.length > 0 && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="accent"
              onClick={handleAddPreference}
              rounded
            >
              {t("common.addMore")}
            </Button>
          </div>
        )}
      </div>

      {/* Added University Preferences Section */}
      {complete.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
            {t("applicant.addedUniversityPreferences")}
          </h2>

          <div className="space-y-4">
            {complete.map((preference) => {
              const index = formik.values.preferences.findIndex((p) => p.id === preference.id);
              const isEditing = editingIndex === index;

              return (
                <PreferenceCard
                  key={preference.id}
                  preference={preference}
                  index={index}
                  isEditing={isEditing}
                  onEdit={() => handleEditPreference(index)}
                  onDelete={() => handleDeletePreference(index)}
                  onSave={() => handleSavePreference(index)}
                  onCancel={handleCancelEdit}
                  onFieldChange={updatePreferenceField}
                  getFieldError={getFieldError}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Show message if no preferences added */}
      {complete.length === 0 && incomplete.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            {t("applicant.noPreferencesAdded")}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {/* Action Buttons - Responsive */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
        {onBack && (
          <Button type="button" variant="cancel" onClick={onBack} rounded className="w-full sm:w-auto">
            {t("common.back")}
          </Button>
        )}
        <Button 
          type="button" 
          variant="accent" 
          onClick={handleSave} 
          isLoading={isSaving}
          disabled={isSaving || !applicantId}
          rounded
          className="w-full sm:w-auto"
        >
          {t("applicant.save")}
        </Button>
        <Button 
          type="button" 
          variant="accent" 
          onClick={handleSaveAndNextClick}
          disabled={!isFormValid || isSaving || !applicantId}
          isLoading={isSaving}
          rounded
          className="w-full sm:w-auto"
        >
          {t("applicant.saveAndNext")}
        </Button>
      </div>

      {/* Delete Confirmation Popup */}
      <ConfirmationPopup
        isOpen={isDeletePopupOpen}
        title={t("applicant.deletePreference", "Delete Preference")}
        message={`${t("applicant.deleteConfirmation", "Are you sure you want to delete this preference?")} ${t("applicant.deleteWarning", "This action cannot be undone.")}`}
        confirmLabel={t("common.delete", "Delete")}
        variant="danger"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ApplicationPreferences;
