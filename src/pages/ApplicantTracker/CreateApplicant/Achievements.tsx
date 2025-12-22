import { useMemo, useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Select, Button, Popup } from "../../../components";
import { COLORS, yesNoOptions } from "../../../constants";
import { Edit, Trash } from "../../../assets";
import AchievementForm from "./AchievementForm";
import type { AchievementItem, AchievementFormData } from "./types";

const Achievements = () => {
  const { t, i18n } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

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
    initialValues: {
      hasAchievements: "",
      achievements: [],
    },
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

        console.log("Payload ready for API:", payload);
      } catch (error) {
        console.error("Error saving achievements:", error);
      }
    },
  });

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Reusable helper functions (defined after formik)
  const markAchievementAsSaved = useCallback((index: number) => {
    const updatedAchievements = [...formik.values.achievements];
    updatedAchievements[index] = {
      ...updatedAchievements[index],
      saved: true,
    };
    formik.setFieldValue("achievements", updatedAchievements);
  }, [formik]);

  const removeAchievement = useCallback((index: number) => {
    const updatedAchievements = formik.values.achievements.filter((_, i) => i !== index);
    formik.setFieldValue("achievements", updatedAchievements);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [formik, editingIndex]);

  const markAllFieldsAsTouched = useCallback(() => {
    return {
      category: true,
      description: true,
      documents: true,
    };
  }, []);

  const handleValidationErrors = useCallback((error: unknown, index: number) => {
    if (error instanceof Yup.ValidationError) {
      error.inner.forEach((err) => {
        if (err.path) {
          formik.setFieldTouched(`achievements[${index}].${err.path}`, true);
        }
      });
    }
  }, [formik]);

  const clearAchievementErrors = useCallback((index: number) => {
    // Clear errors
    if (formik.errors.achievements?.[index]) {
      const updatedErrors: any[] = [...(formik.errors.achievements || [])];
      updatedErrors[index] = undefined;
      formik.setErrors({
        ...formik.errors,
        achievements: updatedErrors as any,
      });
    }
    
    // Clear touched state
    if (formik.touched.achievements?.[index]) {
      const updatedTouched = [...(formik.touched.achievements || [])];
      updatedTouched[index] = {};
      formik.setTouched({
        ...formik.touched,
        achievements: updatedTouched as any,
      });
    }
  }, [formik]);

  const isAchievementComplete = (a: AchievementItem): boolean => {
    return !!(a.category && a.description);
  };

  // Reusable helper to find achievement index by ID
  const findAchievementIndex = useCallback((id: string): number => {
    return formik.values.achievements.findIndex((a) => a.id === id);
  }, [formik.values.achievements]);

  const getIncompleteAchievements = useCallback((): AchievementItem[] => {
    return formik.values.achievements.filter((a, index) => {
      // Exclude items being edited from incomplete list
      if (editingIndex === index) {
        return false;
      }
      return !a.saved;
    });
  }, [formik.values.achievements, editingIndex]);

  const getCompleteAchievements = useCallback((): AchievementItem[] => {
    return formik.values.achievements.filter((a, index) => {
      // Include items being edited in complete list
      if (editingIndex === index) {
        return true;
      }
      return isAchievementComplete(a) && a.saved;
    });
  }, [formik.values.achievements, editingIndex]);

  // Reusable validation and save helper
  const validateAndSaveAchievement = useCallback(async (
    achievement: AchievementItem,
    index: number
  ): Promise<boolean> => {
    const achievementSchema = getAchievementSchema();
    try {
      await achievementSchema.validate(achievement, { abortEarly: false });
      markAchievementAsSaved(index);
      return true;
    } catch (error) {
      handleValidationErrors(error, index);
      return false;
    }
  }, [getAchievementSchema, markAchievementAsSaved, handleValidationErrors]);

  const handleAddAchievement = async () => {
    if (formik.values.hasAchievements !== "yes") {
      return;
    }
    
    const incomplete = getIncompleteAchievements();
    
    // If there's an incomplete achievement, save it first
    if (incomplete.length > 0) {
      const firstIncomplete = incomplete[0];
      const index = findAchievementIndex(firstIncomplete.id);
      
      const isValid = await validateAndSaveAchievement(firstIncomplete, index);
      if (!isValid) {
        return; // Don't add new form if validation fails
      }
      
      // Now add a new empty achievement
      const emptyAchievement = getEmptyAchievement();
      const updatedAchievements = formik.values.achievements.map((a, i) => 
        i === index ? { ...a, saved: true } : a
      );
      formik.setFieldValue("achievements", [...updatedAchievements, emptyAchievement]);
    } else {
      // No incomplete achievements, just add a new one
      const emptyAchievement = getEmptyAchievement();
      formik.setFieldValue("achievements", [...formik.values.achievements, emptyAchievement]);
    }
  };

  const handleDeleteAchievement = (index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingIndex === null) return;

    const indexToDelete = deletingIndex;
    const achievementToDelete = formik.values.achievements[indexToDelete];

    // Remove the achievement
    removeAchievement(indexToDelete);

    // Close popup and reset state
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);

    // TODO: Replace with actual API endpoint
    // const response = await fetch(`/api/applicant/achievements/${achievementToDelete.id}`, {
    //   method: "DELETE",
    // });
    // const result = await response.json();
    console.log("Delete API call for achievement:", achievementToDelete);
  };

  const handleCancelDelete = () => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  };

  const handleCancelIncompleteAchievement = (index: number) => {
    const incomplete = getIncompleteAchievements();
    const complete = getCompleteAchievements();

    if (incomplete.length === 1 && complete.length === 0) {
      const emptyAchievement = getEmptyAchievement();
      const updatedAchievements = [...formik.values.achievements];
      updatedAchievements[index] = emptyAchievement;
      formik.setFieldValue("achievements", updatedAchievements);

      // Clear all errors and touched state for this achievement
      clearAchievementErrors(index);
    } else {
      removeAchievement(index);
    }
  };

  const handleSaveAchievement = async (index: number) => {
    const achievement = formik.values.achievements[index];
    const isValid = await validateAndSaveAchievement(achievement, index);
    
    if (isValid && editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleEditAchievement = (index: number) => {
    setEditingIndex(index);
  };

  const handleSave = async () => {
    const unsavedAchievements = formik.values.achievements.filter((a) => !a.saved);

    if (unsavedAchievements.length > 0 && formik.values.hasAchievements === "yes") {
      let hasErrors = false;
      const touchedAchievements = [...(formik.touched.achievements || [])];

      for (const a of unsavedAchievements) {
        const index = findAchievementIndex(a.id);
        const isValid = await validateAndSaveAchievement(a, index);
        
        if (!isValid) {
          hasErrors = true;
          touchedAchievements[index] = markAllFieldsAsTouched();
        }
      }

      formik.setTouched({
        ...formik.touched,
        achievements: touchedAchievements as any,
      });

      if (hasErrors) {
        return;
      }
    }

    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    formik.handleSubmit();
  };

  const getFieldError = (index: number, fieldName: keyof AchievementItem): string | undefined => {
    const touched = formik.touched.achievements?.[index]?.[fieldName];
    const error = formik.errors.achievements?.[index];
    if (touched && error && typeof error === "object" && fieldName in error) {
      const fieldError = error[fieldName];
      return typeof fieldError === "string" ? fieldError : undefined;
    }
    return undefined;
  };

  const updateAchievementField = async (
    index: number,
    field: keyof AchievementItem,
    value: string | File | null
  ) => {
    await formik.setFieldValue(`achievements[${index}].${field}`, value);
    formik.setFieldTouched(`achievements[${index}].${field}`, true);

    if (value && formik.errors.achievements?.[index] && typeof formik.errors.achievements[index] === "object") {
      const currentErrors = { ...(formik.errors.achievements[index] as any) };
      if (currentErrors[field]) {
        delete currentErrors[field];
        const updatedErrors: any[] = [...(formik.errors.achievements || [])];
        updatedErrors[index] = Object.keys(currentErrors).length > 0 ? currentErrors : undefined;
        formik.setErrors({
          ...formik.errors,
          achievements: updatedErrors as any,
        });
      }
    }

    setTimeout(() => {
      formik.validateField(`achievements[${index}].${field}`);
    }, 0);
  };

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
        <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
          {t("applicant.achievements")}
        </h2>

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
                >
                  {t("common.addMore")}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Added Achievements Section */}
        {complete.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
              {t("applicant.addedAchievements")}
            </h2>

            <div className="space-y-4">
              {complete.map((achievement) => {
                const index = formik.values.achievements.findIndex((a) => a.id === achievement.id);
                const isEditing = editingIndex === index;

                return (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
                  >
                    {isEditing ? (
                      <>
                        <AchievementForm
                          achievement={achievement}
                          index={index}
                          onFieldChange={updateAchievementField}
                          getFieldError={getFieldError}
                          showCancel={false}
                          showAddMore={false}
                          dismissibleFileUpload={false}
                        />
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button
                            type="button"
                            variant="accent"
                            onClick={() => handleSaveAchievement(index)}
                          >
                            {t("common.save")}
                          </Button>
                          <Button
                            type="button"
                            variant="cancel"
                            onClick={handleCancelEdit}
                          >
                            {t("common.cancel")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                            {achievement.category} - {achievement.description.substring(0, 50)}
                            {achievement.description.length > 50 ? "..." : ""}
                          </p>
                          {achievement.documents && (
                            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                              {t("applicant.documentAttached")}: {achievement.documents.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-end justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<Edit className="h-5 w-5" style={{ color: COLORS.accent }} />}
                            iconOnly
                            onClick={() => handleEditAchievement(index)}
                            title={t("common.edit")}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<Trash className="h-5 w-5" style={{ color: COLORS.error }} />}
                            iconOnly
                            onClick={() => handleDeleteAchievement(index)}
                            title={t("common.delete")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
        <Button type="button" variant="accent" onClick={handleSave}>
          {t("applicant.save")}
        </Button>
      </div>

      {/* Delete Confirmation Popup */}
      <Popup
        isOpen={isDeletePopupOpen}
        onClose={handleCancelDelete}
        title={t("applicant.deleteAchievement", "Delete Achievement")}
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: COLORS.textMuted }}>
            {t("applicant.deleteAchievementConfirmation", "Are you sure you want to delete this achievement?")} {t("applicant.deleteWarning", "This action cannot be undone.")}
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

export default Achievements;
