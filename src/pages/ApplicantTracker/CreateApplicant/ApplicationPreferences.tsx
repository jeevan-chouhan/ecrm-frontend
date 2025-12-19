import { useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";
import PreferenceForm from "./PreferenceForm";
import PreferenceCard from "./PreferenceCard";
import type { PreferenceItem, ApplicationPreferencesFormData } from "./types";

const ApplicationPreferences = ({ onSaveAndNext }: { onSaveAndNext?: () => void }) => {
  const { t, i18n } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Validation schema using Yup with i18n messages
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        preferences: Yup.array()
          .of(
            Yup.object().shape({
              desiredCountry: Yup.string().required(t("validation.countryRequired")),
              program: Yup.string().required(t("validation.programRequired")),
              desiredUniversity: Yup.string().required(t("validation.universityRequired")),
              desiredCampus: Yup.string().required(t("validation.campusRequired")),
              course: Yup.string().required(t("validation.courseRequired")),
              desiredIntake: Yup.string().required(t("validation.intakeRequired")),
              assignCounselor: Yup.string().required(t("validation.counselorRequired")),
              agencyPartnerName: Yup.string().required(t("validation.agencyPartnerRequired")),
            })
          )
          .min(1, t("validation.atLeastOnePreferenceRequired")),
      }),
    [t, i18n.language]
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

  const handleAddPreference = () => {
    // Only allow adding if all existing preferences are complete
    const incomplete = getIncompletePreferences();
    if (incomplete.length > 0) {
      return; // Don't add if there's already an incomplete preference
    }
    const emptyPref = getEmptyPreference();
    formik.setFieldValue("preferences", [...formik.values.preferences, emptyPref]);
  };

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
    const updatedPreferences = formik.values.preferences.filter((_, i) => i !== index);
    formik.setFieldValue("preferences", updatedPreferences);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
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
      
      // Clear all errors for this preference
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
    } else {
      // Remove the incomplete preference
      handleDeletePreference(index);
    }
  };

  const handleSavePreference = async (index: number) => {
    const preference = formik.values.preferences[index];
    
    // Validate preference using the schema for a single preference item
    const preferenceSchema = Yup.object().shape({
      desiredCountry: Yup.string().required(t("validation.countryRequired")),
      program: Yup.string().required(t("validation.programRequired")),
      desiredUniversity: Yup.string().required(t("validation.universityRequired")),
      desiredCampus: Yup.string().required(t("validation.campusRequired")),
      course: Yup.string().required(t("validation.courseRequired")),
      desiredIntake: Yup.string().required(t("validation.intakeRequired")),
      assignCounselor: Yup.string().required(t("validation.counselorRequired")),
      agencyPartnerName: Yup.string().required(t("validation.agencyPartnerRequired")),
    });

    try {
      await preferenceSchema.validate(preference, { abortEarly: false });
      
      // Mark preference as saved
      const updatedPreferences = [...formik.values.preferences];
      updatedPreferences[index] = {
        ...updatedPreferences[index],
        saved: true,
      };
      formik.setFieldValue("preferences", updatedPreferences);
      
      // If editing, close edit mode
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    } catch (error) {
      // Mark fields as touched to show errors
      if (error instanceof Yup.ValidationError) {
        error.inner.forEach((err) => {
          if (err.path) {
            formik.setFieldTouched(`preferences[${index}].${err.path}`, true);
          }
        });
      }
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
      const preferenceSchema = Yup.object().shape({
        desiredCountry: Yup.string().required(t("validation.countryRequired")),
        program: Yup.string().required(t("validation.programRequired")),
        desiredUniversity: Yup.string().required(t("validation.universityRequired")),
        desiredCampus: Yup.string().required(t("validation.campusRequired")),
        course: Yup.string().required(t("validation.courseRequired")),
        desiredIntake: Yup.string().required(t("validation.intakeRequired")),
        assignCounselor: Yup.string().required(t("validation.counselorRequired")),
        agencyPartnerName: Yup.string().required(t("validation.agencyPartnerRequired")),
      });

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
          if (error instanceof Yup.ValidationError) {
            touchedPreferences[index] = {
              desiredCountry: true,
              program: true,
              desiredUniversity: true,
              desiredCampus: true,
              course: true,
              desiredIntake: true,
              assignCounselor: true,
              agencyPartnerName: true,
            };
            error.inner.forEach((err) => {
              if (err.path) {
                touchedPreferences[index] = {
                  ...touchedPreferences[index],
                  [err.path]: true,
                };
              }
            });
          }
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
            showAddMore={isPreferenceComplete(firstIncomplete)}
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
    </div>
  );
};

export default ApplicationPreferences;
