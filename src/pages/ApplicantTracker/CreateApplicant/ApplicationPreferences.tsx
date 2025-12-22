import { useMemo, useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Button, Popup } from "../../../components";
import { COLORS } from "../../../constants";
import PreferenceForm from "./PreferenceForm";
import PreferenceCard from "./PreferenceCard";
import type { PreferenceItem, ApplicationPreferencesFormData } from "./types";

const ApplicationPreferences = ({ onSaveAndNext }: { onSaveAndNext?: () => void }) => {
  const { t, i18n } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Reusable preference validation schema
  const getPreferenceSchema = useCallback(() => {
    return Yup.object().shape({
      desiredCountry: Yup.string().required(t("validation.countryRequired")),
      program: Yup.string().required(t("validation.programRequired")),
      desiredUniversity: Yup.string().required(t("validation.universityRequired")),
      desiredCampus: Yup.string().required(t("validation.campusRequired")),
      course: Yup.string().required(t("validation.courseRequired")),
      desiredIntake: Yup.string().required(t("validation.intakeRequired")),
      assignCounselor: Yup.string().required(t("validation.counselorRequired")),
      agencyPartnerName: Yup.string().required(t("validation.agencyPartnerRequired")),
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
      pref.desiredCampus &&
      pref.course &&
      pref.desiredIntake &&
      pref.assignCounselor &&
      pref.agencyPartnerName
    );
  };

  const formik = useFormik<ApplicationPreferencesFormData>({
    initialValues: {
      preferences: [getEmptyPreference()], // Initialize with one empty preference form open
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Create payload object - only include saved preferences
        const savedPreferences = values.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
        const payload = {
          preferences: savedPreferences.map((pref) => ({
            desiredCountry: pref.desiredCountry,
            program: pref.program,
            desiredUniversity: pref.desiredUniversity,
            desiredCampus: pref.desiredCampus,
            course: pref.course,
            desiredIntake: pref.desiredIntake,
            assignCounselor: pref.assignCounselor,
            agencyPartnerName: pref.agencyPartnerName,
          })),
        };

        // TODO: Replace with actual API endpoint
        // const response = await fetch("/api/applicant/preferences", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify(payload),
        // });
        // const result = await response.json();

        console.log("Payload ready for API:", payload);
      } catch (error) {
        console.error("Error saving application preferences:", error);
      }
    },
  });

  // Reusable helper functions (defined after formik)
  const markPreferenceAsSaved = useCallback((index: number) => {
    const updatedPreferences = [...formik.values.preferences];
    updatedPreferences[index] = {
      ...updatedPreferences[index],
      saved: true,
    };
    formik.setFieldValue("preferences", updatedPreferences);
  }, [formik]);

  const removePreference = useCallback((index: number) => {
    const updatedPreferences = formik.values.preferences.filter((_, i) => i !== index);
    formik.setFieldValue("preferences", updatedPreferences);
    
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [formik, editingIndex]);

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

  const clearPreferenceErrors = useCallback((index: number) => {
    // Clear errors
    if (formik.errors.preferences?.[index]) {
      const updatedErrors: any[] = [...(formik.errors.preferences || [])];
      updatedErrors[index] = undefined;
      formik.setErrors({
        ...formik.errors,
        preferences: updatedErrors as any,
      });
    }
    
    // Clear touched state
    if (formik.touched.preferences?.[index]) {
      const updatedTouched = [...(formik.touched.preferences || [])];
      updatedTouched[index] = {};
      formik.setTouched({
        ...formik.touched,
        preferences: updatedTouched as any,
      });
    }
  }, [formik]);

  const handleAddPreference = async () => {
    const incomplete = getIncompletePreferences();
    
    // If there's an incomplete preference, save it first
    if (incomplete.length > 0) {
      const firstIncomplete = incomplete[0];
      const index = formik.values.preferences.findIndex((p) => p.id === firstIncomplete.id);
      
      // Validate and save the current incomplete preference
      const preferenceSchema = getPreferenceSchema();

      try {
        await preferenceSchema.validate(firstIncomplete, { abortEarly: false });
        
        // Save the current preference
        markPreferenceAsSaved(index);
        
        // Now add a new empty preference
        const emptyPref = getEmptyPreference();
        const currentPreferences = formik.values.preferences;
        const updatedPreferences = currentPreferences.map((p, i) => 
          i === index ? { ...p, saved: true } : p
        );
        formik.setFieldValue("preferences", [...updatedPreferences, emptyPref]);
      } catch (error) {
        // If validation fails, mark fields as touched to show errors
        handleValidationErrors(error, index);
        // Don't add new form if validation fails
        return;
      }
    } else {
      // No incomplete preferences, just add a new one
      const emptyPref = getEmptyPreference();
      formik.setFieldValue("preferences", [...formik.values.preferences, emptyPref]);
    }
  };

  const getIncompletePreferences = (): PreferenceItem[] => {
    // Show preferences that are not saved (either incomplete or complete but not saved)
    // Exclude preferences that are being edited (they should stay in the card view)
    return formik.values.preferences.filter((pref, index) => {
      // Don't show in form if it's being edited (it should stay in card view)
      if (editingIndex === index) {
        return false;
      }
      // Show if not saved (regardless of completion status)
      return !pref.saved;
    });
  };

  const getCompletePreferences = (): PreferenceItem[] => {
    // Show preferences that are both complete AND saved, OR are currently being edited
    return formik.values.preferences.filter((pref, index) => {
      // Include if being edited (so it shows in card view for editing)
      if (editingIndex === index) {
        return true;
      }
      // Include if complete and saved
      return isPreferenceComplete(pref) && pref.saved;
    });
  };

  const handleEditPreference = (index: number) => {
    setEditingIndex(index);
  };

  const handleDeletePreference = (index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingIndex === null) return;

    const indexToDelete = deletingIndex;
    const preferenceToDelete = formik.values.preferences[indexToDelete];

    // Remove the preference
    removePreference(indexToDelete);

    // Close popup and reset state
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);

    // TODO: Replace with actual API endpoint
    // const response = await fetch(`/api/applicant/preferences/${preferenceToDelete.id}`, {
    //   method: "DELETE",
    // });
    // const result = await response.json();
    console.log("Delete API call for preference:", preferenceToDelete);
  };

  const handleCancelDelete = () => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  };

  const handleCancelIncompletePreference = (index: number) => {
    // Only allow canceling if it's an incomplete preference (not the first one if it's the only one)
    const incomplete = getIncompletePreferences();
    const complete = getCompletePreferences();
    
    // Don't allow removing if it's the only preference and it's incomplete
    if (incomplete.length === 1 && complete.length === 0) {
      // Reset the first preference to empty instead of removing
      const emptyPref = getEmptyPreference();
      const updatedPreferences = [...formik.values.preferences];
      updatedPreferences[index] = emptyPref;
      formik.setFieldValue("preferences", updatedPreferences);
      
      // Clear all errors and touched state for this preference
      clearPreferenceErrors(index);
    } else {
      // Remove the incomplete preference directly without showing confirmation popup
      // (Only saved preferences should show delete confirmation)
      removePreference(index);
    }
  };

  const handleSavePreference = async (index: number) => {
    const preference = formik.values.preferences[index];
    
    // Validate preference using the schema for a single preference item
    const preferenceSchema = getPreferenceSchema();

    try {
      await preferenceSchema.validate(preference, { abortEarly: false });
      
      // Mark preference as saved
      markPreferenceAsSaved(index);
      
      // If editing, close edit mode
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    } catch (error) {
      // Mark fields as touched to show errors
      handleValidationErrors(error, index);
    }
  };

  const handleCancelEdit = () => {
    // When canceling edit, restore the preference to its saved state
    // The preference should remain saved since we didn't actually save changes
    setEditingIndex(null);
  };

  const handleSave = async () => {
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
        return;
      }
    }

    // Close edit mode if any preference was being edited
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    // Submit the form (which will call API with saved preferences)
    formik.handleSubmit();
  };

  const handleSaveAndNextClick = async () => {
    // Check if there are any unsaved preferences
    const unsavedPreferences = formik.values.preferences.filter((pref) => !pref.saved);
    if (unsavedPreferences.length > 0) {
      // Mark all unsaved preference fields as touched to show errors
      const touchedPreferences = formik.values.preferences.map((pref, index) => {
        if (!pref.saved) {
          return markAllFieldsAsTouched();
        }
        return formik.touched.preferences?.[index] || {};
      });
      formik.setTouched({
        preferences: touchedPreferences as any,
      });
      return; // Don't proceed if there are unsaved preferences
    }

    // Validate all saved preferences before proceeding
    const savedPreferences = formik.values.preferences.filter((pref) => pref.saved);
    if (savedPreferences.length === 0) {
      // No saved preferences, show error
      return;
    }

    // Submit form and then navigate
    await formik.submitForm();
    if (onSaveAndNext) {
      onSaveAndNext();
    }
  };

  const getFieldError = (index: number, fieldName: keyof PreferenceItem): string | undefined => {
    const touched = formik.touched.preferences?.[index]?.[fieldName];
    const error = formik.errors.preferences?.[index];
    if (touched && error && typeof error === 'object' && fieldName in error) {
      const fieldError = error[fieldName];
      return typeof fieldError === 'string' ? fieldError : undefined;
    }
    return undefined;
  };

  const updatePreferenceField = async (index: number, field: keyof PreferenceItem, value: string) => {
    // Update the field value
    await formik.setFieldValue(`preferences[${index}].${field}`, value);
    
    // Mark field as touched
    formik.setFieldTouched(`preferences[${index}].${field}`, true);
    
    // Clear error for this field if value is set
    if (value && formik.errors.preferences?.[index] && typeof formik.errors.preferences[index] === 'object') {
      const currentErrors = { ...(formik.errors.preferences[index] as any) };
      if (currentErrors[field]) {
        delete currentErrors[field];
        const updatedErrors: any[] = [...(formik.errors.preferences || [])];
        updatedErrors[index] = Object.keys(currentErrors).length > 0 ? currentErrors : undefined;
        formik.setErrors({
          ...formik.errors,
          preferences: updatedErrors as any,
        });
      }
    }
    
    // Validate the specific field to ensure errors are updated
    setTimeout(() => {
      formik.validateField(`preferences[${index}].${field}`);
    }, 0);
  };

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
        <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
          {t("applicant.applicationPreferences")}
        </h2>

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
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
        <Button type="button" variant="accent" onClick={handleSave}>
          {t("applicant.save")}
        </Button>
        <Button type="button" variant="accent" onClick={handleSaveAndNextClick}>
          {t("applicant.saveAndNext")}
        </Button>
      </div>

      {/* Delete Confirmation Popup */}
      <Popup
        isOpen={isDeletePopupOpen}
        onClose={handleCancelDelete}
        title={t("applicant.deletePreference", "Delete Preference")}
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: COLORS.textMuted }}>
            {t("applicant.deleteConfirmation", "Are you sure you want to delete this preference?")} {t("applicant.deleteWarning", "This action cannot be undone.")}
          </p>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="cancel"
              size="md"
              onClick={handleCancelDelete}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmDelete}
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default ApplicationPreferences;
