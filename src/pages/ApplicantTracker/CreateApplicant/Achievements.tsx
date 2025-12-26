import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Select, Button, ConfirmationPopup } from "../../../components";
import { COLORS, yesNoOptions } from "../../../constants";
import AchievementForm from "./AchievementForm";
import type { AchievementItem, AchievementFormData } from "./types";
import { fileToBase64 } from "./utils/fileUtils";
import { useAchievementLogic } from "./hooks";
import AchievementList from "./components/AchievementList";

interface AchievementsProps {
  initialValues: AchievementFormData;
  onUpdate: (data: AchievementFormData) => void;
  onBack?: () => void;
  onSubmit?: () => void;
}

const Achievements = ({ initialValues, onUpdate, onBack, onSubmit }: AchievementsProps) => {
  const { t, i18n } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<AchievementFormData | null>(null);
  const [hasDataChanged, setHasDataChanged] = useState(false);

  const getEmptyAchievement = (): AchievementItem => ({
    id: `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    category: "",
    description: "",
    documents: null,
    saved: false,
  });

  // Reusable achievement validation schema
  const getAchievementSchema = useCallback(() => {
    return Yup.object().shape({
      category: Yup.string().required(t("validation.categoryRequired")).trim(),
      description: Yup.string().required(t("validation.descriptionRequired")).trim(),
      documents: Yup.mixed().nullable(),
    });
  }, [t, i18n.language]);

  // Validation schema using Yup with i18n messages
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        hasAchievements: Yup.string().required(t("validation.achievementsRequired")),
        achievements: Yup.array()
          .of(getAchievementSchema())
          .when("hasAchievements", {
            is: "yes",
            then: (schema) => schema.min(1, t("validation.atLeastOneAchievementRequired")),
            otherwise: (schema) => schema,
          }),
      }),
    [getAchievementSchema, t]
  );

  const formik = useFormik<AchievementFormData>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Only include saved achievements if hasAchievements is "yes"
        const savedAchievements = values.hasAchievements === "yes"
          ? await Promise.all(
              values.achievements
                .filter((a) => a.saved && isAchievementComplete(a))
                .map(async (a) => ({
                  category: a.category,
                  description: a.description,
                  documents: a.documents ? await fileToBase64(a.documents) : null,
                }))
            )
          : [];

        const payload = {
          hasAchievements: values.hasAchievements,
          achievements: savedAchievements,
        };

        // TODO: Replace with actual API endpoint
        // const response = await fetch("/api/applicant/achievements", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify(payload),
        // });
        // const result = await response.json();

        // Only call API if data has changed since last save
        if (hasDataChanged) {
          if (import.meta.env.DEV) {
            console.log("Payload ready for API:", payload);
            console.log("API endpoint: POST /api/applicant/achievements");
          }
          
          // Mark data as saved
          setLastSavedData({ 
            hasAchievements: values.hasAchievements,
            achievements: [...values.achievements]
          });
          setHasDataChanged(false);
        } else {
          if (import.meta.env.DEV) {
            console.log("No changes detected. Skipping API call.");
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error saving achievements:", error);
        }
      }
    },
  });


  // Check form validity - hasAchievements must be selected, and if yes, at least one complete achievement required
  useEffect(() => {
    const isValid = 
      formik.values.hasAchievements !== "" &&
      (formik.values.hasAchievements === "no" || 
       formik.values.achievements.filter((a) => a.saved && isAchievementComplete(a)).length > 0);
    setIsFormValid(isValid);
  }, [formik.values.hasAchievements, formik.values.achievements]);

  // Check if data has changed since last save
  useEffect(() => {
    if (lastSavedData === null) {
      setHasDataChanged(true);
      return;
    }
    
    if (lastSavedData.hasAchievements !== formik.values.hasAchievements) {
      setHasDataChanged(true);
      return;
    }
    
    if (formik.values.hasAchievements === "no") {
      setHasDataChanged(false);
      return;
    }
    
    const currentSaved = formik.values.achievements.filter((a) => a.saved && isAchievementComplete(a));
    const lastSaved = lastSavedData.achievements.filter((a) => a.saved && isAchievementComplete(a));
    
    if (currentSaved.length !== lastSaved.length) {
      setHasDataChanged(true);
      return;
    }
    
    const hasChanged = currentSaved.some((current, index) => {
      const last = lastSaved[index];
      if (!last) return true;
      
      // Compare documents by name and size instead of reference
      const documentsChanged = 
        (current.documents === null && last.documents !== null) ||
        (current.documents !== null && last.documents === null) ||
        (current.documents !== null && last.documents !== null && 
         (current.documents.name !== last.documents.name || 
          current.documents.size !== last.documents.size));
      
      return (
        current.category !== last.category ||
        current.description !== last.description ||
        documentsChanged
      );
    });
    
    setHasDataChanged(hasChanged);
  }, [formik.values, lastSavedData]);

  // Sync formik values to parent state - optimized with ref-based comparison
  // Only update parent when values actually change (prevents excessive re-renders)
  const prevValuesRef = useRef<AchievementFormData>(formik.values);
  useEffect(() => {
    // Quick check for hasAchievements change
    if (prevValuesRef.current.hasAchievements !== formik.values.hasAchievements) {
      prevValuesRef.current = formik.values;
      onUpdate(formik.values);
      return;
    }
    
    // Deep comparison for achievements array
    const currentAchievements = formik.values.achievements;
    const prevAchievements = prevValuesRef.current.achievements;
    
    if (currentAchievements.length !== prevAchievements.length) {
      prevValuesRef.current = formik.values;
      onUpdate(formik.values);
      return;
    }
    
    // Deep comparison only if lengths match
    const hasChanged = currentAchievements.some((current, index) => {
      const prev = prevAchievements[index];
      if (!prev) return true;
      
      // Compare documents by name and size instead of reference
      const documentsChanged = 
        (current.documents === null && prev.documents !== null) ||
        (current.documents !== null && prev.documents === null) ||
        (current.documents !== null && prev.documents !== null && 
         (current.documents.name !== prev.documents.name || 
          current.documents.size !== prev.documents.size));
      
      return (
        current.id !== prev.id ||
        current.category !== prev.category ||
        current.description !== prev.description ||
        documentsChanged ||
        current.saved !== prev.saved
      );
    });
    
    if (hasChanged) {
      prevValuesRef.current = formik.values;
      onUpdate(formik.values);
    }
  }, [formik.values, onUpdate]);

  // Helper functions
  const handleValidationErrors = useCallback((error: unknown, index: number) => {
    if (error instanceof Yup.ValidationError) {
      error.inner.forEach((err) => {
        if (err.path) {
          formik.setFieldTouched(`achievements[${index}].${err.path}`, true);
        }
      });
    }
  }, [formik]);

  // Use extracted logic hook
  const {
    isAchievementComplete,
    findAchievementIndex,
    getIncompleteAchievements,
    getCompleteAchievements,
    validateAndSaveAllUnsavedAchievements,
    handleAddAchievement,
    handleCancelIncompleteAchievement,
    handleSaveAchievement,
    handleEditAchievement,
    handleCancelEdit,
    getFieldError,
    updateAchievementField,
  } = useAchievementLogic({
    formik,
    editingIndex,
    setEditingIndex,
    getAchievementSchema,
    getEmptyAchievement,
    handleValidationErrors,
  });

  const handleDeleteAchievement = useCallback((index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingIndex === null) return;

    const indexToDelete = deletingIndex;
    const achievementToDelete = formik.values.achievements[indexToDelete];

    // Remove the achievement
    const updatedAchievements = formik.values.achievements.filter((_, i) => i !== indexToDelete);
    formik.setFieldValue("achievements", updatedAchievements);
    if (editingIndex === indexToDelete) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > indexToDelete) {
      setEditingIndex(editingIndex - 1);
    }

    // Close popup and reset state
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);

    // TODO: Replace with actual API endpoint
    // const response = await fetch(`/api/applicant/achievements/${achievementToDelete.id}`, {
    //   method: "DELETE",
    // });
    // const result = await response.json();
    if (import.meta.env.DEV) {
      console.log("Delete API call for achievement:", achievementToDelete);
    }
  }, [deletingIndex, formik, editingIndex, setEditingIndex]);

  const handleCancelDelete = useCallback(() => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  }, []);

  const handleSave = async () => {
    const isValid = await validateAndSaveAllUnsavedAchievements();
    if (!isValid) {
      return;
    }

    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    formik.handleSubmit();
  };

  const handleSubmit = async () => {
    // First, ensure all unsaved achievements are saved
    const isValid = await validateAndSaveAllUnsavedAchievements();
    if (!isValid) {
      if (import.meta.env.DEV) {
        console.log("Form validation failed. Please fill all required fields.");
      }
      return;
    }

    // Validate the form
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      // Mark all fields as touched to show errors
      const touchedFields: Record<string, boolean> = {};
      Object.keys(formik.values).forEach((key) => {
        touchedFields[key] = true;
      });
      formik.setTouched(touchedFields);
      if (import.meta.env.DEV) {
        console.log("Form validation failed. Please fill all required fields.");
      }
      return;
    }

    // Close any open editing
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    // Save the current form data first
    await formik.handleSubmit();

    // Then call the final submit handler from parent
    if (onSubmit) {
      onSubmit();
    }
  };

  // Find index by ID helper
  const findAchievementIndexById = useCallback((id: string): number => {
    return formik.values.achievements.findIndex((a) => a.id === id);
  }, [formik.values.achievements]);

  const handleHasAchievementsChange = (value: string) => {
    formik.setFieldValue("hasAchievements", value);
    if (value === "no") {
      formik.setFieldValue("achievements", []);
    } else if (value === "yes" && formik.values.achievements.length === 0) {
      formik.setFieldValue("achievements", [getEmptyAchievement()]);
    }
  };

  const incomplete = getIncompleteAchievements();
  const complete = getCompleteAchievements();
  const firstIncomplete = incomplete.length > 0 ? incomplete[0] : null;
  const firstIncompleteIndex = firstIncomplete ? findAchievementIndex(firstIncomplete.id) : -1;

  const showAchievementForm = formik.values.hasAchievements === "yes";

  return (
    <div className="space-y-6">
      <div>

        {/* Do You Have Any Achievements? */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full">
              <Select
                label={t("applicant.doYouHaveAchievements")}
                options={yesNoOptions}
                value={formik.values.hasAchievements}
                onChange={handleHasAchievementsChange}
                placeholder={t("applicant.doYouHaveAchievements")}
                error={formik.touched.hasAchievements && formik.errors.hasAchievements ? formik.errors.hasAchievements : undefined}
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Achievement Details Form */}
        {showAchievementForm && (
          <>
            <div className="mb-4">
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("applicant.achievementDetails")}
              </p>
            </div>

            {firstIncomplete && firstIncompleteIndex >= 0 && (
              <AchievementForm
                achievement={firstIncomplete}
                index={firstIncompleteIndex}
                onFieldChange={updateAchievementField}
                getFieldError={getFieldError}
                onCancel={() => handleCancelIncompleteAchievement(firstIncompleteIndex)}
                onAddMore={handleAddAchievement}
                showCancel={incomplete.length > 1 || complete.length > 0}
                showAddMore={true}
              />
            )}

            {incomplete.length === 0 && formik.values.achievements.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleAddAchievement}
                  rounded
                >
                  {t("common.addMore")}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Added Achievements Section */}
        <AchievementList
          achievements={complete}
          editingIndex={editingIndex}
          getFieldError={getFieldError}
          updateAchievementField={updateAchievementField}
          onEdit={handleEditAchievement}
          onDelete={handleDeleteAchievement}
          onSave={handleSaveAchievement}
          onCancelEdit={handleCancelEdit}
          findIndexById={findAchievementIndexById}
        />

        {/* Show message if no achievements added */}
        {showAchievementForm && complete.length === 0 && incomplete.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("applicant.noAchievementsAdded")}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
        <div>
          {onBack && (
            <Button type="button" variant="cancel" onClick={onBack} rounded>
              {t("common.back")}
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="accent" onClick={handleSave} disabled={!hasDataChanged} rounded>
            {t("applicant.save")}
          </Button>
          {onSubmit && (
            <Button 
              type="button" 
              variant="accent" 
              onClick={handleSubmit} 
              disabled={!isFormValid}
              rounded
            >
              {t("applicant.submit")}
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      <ConfirmationPopup
        isOpen={isDeletePopupOpen}
        title={t("applicant.deleteAchievement", "Delete Achievement")}
        message={`${t("applicant.deleteAchievementConfirmation", "Are you sure you want to delete this achievement?")} ${t("applicant.deleteWarning", "This action cannot be undone.")}`}
        confirmLabel={t("common.delete", "Delete")}
        variant="danger"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Achievements;
