import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Select, Button, ConfirmationPopup } from "../../../components";
import type { SelectOption } from "../../../components";
import { COLORS, yesNoOptions } from "../../../constants";
import AchievementForm from "./AchievementForm";
import type { AchievementItem, AchievementFormData } from "./types";
import { fileToBase64 } from "./utils/fileUtils";
import { useAchievementLogic, useDataChangeTracking } from "./hooks";
import AchievementList from "./components/AchievementList";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

interface AchievementsProps {
  initialValues: AchievementFormData;
  onUpdate: (data: AchievementFormData) => void;
  onBack?: () => void;
  onSubmit?: () => void;
  applicantId?: number | string | null;
}

const Achievements = ({ initialValues, onUpdate, onBack, onSubmit, applicantId }: AchievementsProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions
  const isFetchingAchievementsRef = useRef(false); // Prevent duplicate fetches
  const isFetchingCategoriesRef = useRef(false); // Prevent duplicate fetches for categories
  const categoryIdMapRef = useRef<Map<string, number>>(new Map()); // Map code to ID for categories
  const originalAchievementsRef = useRef<AchievementItem[]>([]); // Store original achievements from GET API
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);

  const getEmptyAchievement = useCallback((): AchievementItem => ({
    id: `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    category: "",
    description: "",
    documents: null,
    saved: false,
  }), []);

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

  // Helper function to convert File to API document format (JSON stringified)
  const convertFileToDocumentFormat = useCallback(async (file: File | null): Promise<string | null> => {
    if (!file) return null;
    
    const base64DataUrl = await fileToBase64(file);
    
    // Format as JSON string with accessUrl (base64) and fileName
    const documentJson = JSON.stringify({
      accessUrl: base64DataUrl,
      fileName: file.name,
    });
    
    return documentJson;
  }, []);


  const formik = useFormik<AchievementFormData>({
    initialValues,
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
            message: t("applicant.applicantIdRequired", "Applicant ID is required. Please save personal details first."),
          })
        );
        return;
      }

      // If hasAchievements is "no", we don't need to save anything
      if (values.hasAchievements === "no") {
        markAsSaved(values);
        
        // Still navigate if needed
        if (shouldNavigateNext && onSubmit) {
          onSubmit();
          setShouldNavigateNext(false);
        }
        return;
      }

      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        // Get complete achievements (both saved and unsaved but complete)
        // First, mark complete achievements as saved if they're not already
        const updatedAchievements = [...values.achievements];
        let hasNewCompleteAchievements = false;

        for (let i = 0; i < updatedAchievements.length; i++) {
          const a = updatedAchievements[i];
          if (!a.saved && isAchievementComplete(a)) {
            updatedAchievements[i] = {
              ...a,
              saved: true,
            };
            hasNewCompleteAchievements = true;
          }
        }

        // Update form state if we marked any as saved
        if (hasNewCompleteAchievements) {
          formik.setFieldValue("achievements", updatedAchievements);
        }

        // Get all complete achievements (now all should be marked as saved)
        const savedAchievements = updatedAchievements.filter(
          (a) => a.saved && isAchievementComplete(a)
        );

        if (savedAchievements.length === 0) {
          dispatch(
            addToast({
              type: "error",
              message: t("validation.atLeastOneAchievementRequired", "At least one complete achievement is required"),
            })
          );
          isSubmittingRef.current = false;
          setIsSaving(false);
          dispatch(hideLoader());
          return;
        }

        // Separate achievements into creates (don't have achievementId)
        // Note: PUT API for existing achievements is only called from individual achievement card Save button
        const achievementsToCreate = savedAchievements.filter((a) => !a.achievementId);

        // Only create new achievements (no achievementId)
        // PUT API is only called from individual achievement card Save button, not from global Save or Submit
        if (achievementsToCreate.length === 0) {
          
          // Mark data as saved
          markAsSaved(values);
          
          // Still navigate if needed
          if (shouldNavigateNext && onSubmit) {
            onSubmit();
            setShouldNavigateNext(false);
          }
          isSubmittingRef.current = false;
          setIsSaving(false);
          dispatch(hideLoader());
          return;
        }

        // Create new achievements using POST
        if (achievementsToCreate.length > 0) {
          const createPayload = await Promise.all(
            achievementsToCreate.map(async (a) => {
              const documentJson = await convertFileToDocumentFormat(a.documents);
              
              // Get category ID from code-to-ID mapping
              const categoryId = categoryIdMapRef.current.get(a.category);
              if (!categoryId) {
                throw new Error(`Invalid category selected for achievement: ${a.description}`);
              }
              
              return {
                isAchievements: true,
                categoryId: categoryId,
                description: a.description,
                document: documentJson,
              };
            })
          );

          const createResponse = await applicantService.createAchievements(applicantId, createPayload);

          if (createResponse.status === "success" && createResponse.data) {
            // Update achievementId for newly created achievements
            // Use the updatedAchievements array that we already modified
            let createIndex = 0;
            
            for (let i = 0; i < updatedAchievements.length; i++) {
              const a = updatedAchievements[i];
              if (achievementsToCreate.some((ach) => ach.id === a.id)) {
                if (createResponse.data[createIndex]) {
                  const responseData = createResponse.data[createIndex];
                  updatedAchievements[i] = {
                    ...a,
                    achievementId: responseData.id || null,
                    category: responseData.categoryCode || a.category, // Use categoryCode from response
                    saved: true,
                  };
                  createIndex++;
                }
              }
            }
            
            formik.setFieldValue("achievements", updatedAchievements);
            
            // Update original achievements ref
            originalAchievementsRef.current = updatedAchievements.map(a => ({ ...a }));
          } else {
            throw new Error(createResponse.message || "Failed to create achievements");
          }
        }

        // Show success toast
        const successMessage = t("applicant.achievementsSaved", "Achievements saved successfully");

        dispatch(
          addToast({
            type: "success",
            message: successMessage,
          })
        );

        // Mark data as saved and update original achievements
        // Use the updatedAchievements array that we already modified
        const finalValues = {
          ...values,
          achievements: updatedAchievements,
        };
        
        markAsSaved(finalValues);
        
        // Update original achievements ref with current state after save
        originalAchievementsRef.current = updatedAchievements.map(a => ({ ...a }));

        // Navigate to next tab if "Save & Next" was clicked
        if (shouldNavigateNext && onSubmit) {
          onSubmit();
          setShouldNavigateNext(false);
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save achievements");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    },
  });

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
    handleAddAchievement,
    handleCancelIncompleteAchievement,
    // handleSaveAchievement: handleSaveAchievementLocal,
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

  // Use reusable hook for data change tracking with custom comparison for arrays
  const { markAsSaved } = useDataChangeTracking<AchievementFormData>(
    formik.values,
    (lastSavedData, current) => {
      if (!lastSavedData) return true;
      if (lastSavedData.hasAchievements !== current.hasAchievements) {
        return true;
      }
      
      if (current.hasAchievements === "no") {
        return false;
      }
      
      const currentSaved = current.achievements.filter((a) => a.saved && isAchievementComplete(a));
      const lastSaved = lastSavedData.achievements.filter((a) => a.saved && isAchievementComplete(a));
      
      if (currentSaved.length !== lastSaved.length) {
        return true;
      }
      
      return currentSaved.some((currentItem, index) => {
        const lastItem = lastSaved[index];
        if (!lastItem) return true;
        
        // Compare documents by name and size instead of reference
        const documentsChanged = 
          (currentItem.documents === null && lastItem.documents !== null) ||
          (currentItem.documents !== null && lastItem.documents === null) ||
          (currentItem.documents !== null && lastItem.documents !== null && 
           (currentItem.documents.name !== lastItem.documents.name || 
            currentItem.documents.size !== lastItem.documents.size));
        
        return (
          currentItem.category !== lastItem.category ||
          currentItem.description !== lastItem.description ||
          documentsChanged
        );
      });
    }
  );

  // Check form validity - hasAchievements must be selected, and if yes, at least one complete achievement required
  useEffect(() => {
    const isValid = 
      formik.values.hasAchievements !== "" &&
      (formik.values.hasAchievements === "no" || 
       formik.values.achievements.filter((a) => a.saved && isAchievementComplete(a)).length > 0);
    setIsFormValid(isValid);
  }, [formik.values.hasAchievements, formik.values.achievements, isAchievementComplete]);


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

  // Handle save achievement with API call (for individual achievement saves)
  const handleSaveAchievement = useCallback(async (index: number) => {
    const achievement = formik.values.achievements[index];
    const achievementSchema = getAchievementSchema();

    // Validate first
    try {
      await achievementSchema.validate(achievement, { abortEarly: false });
    } catch (error) {
      // Mark fields as touched to show errors
      handleValidationErrors(error, index);
      return;
    }

    if (!applicantId) {
      dispatch(
        addToast({
          type: "error",
          message: t("applicant.applicantIdRequired", "Applicant ID is required. Please save personal details first."),
        })
      );
      return;
    }

    // If achievement has achievementId, it's an existing achievement - call PUT API
    if (achievement.achievementId && applicantId) {
      if (isSubmittingRef.current) return;
      
      isSubmittingRef.current = true;
      dispatch(showLoader());

      try {
        const documentJson = await convertFileToDocumentFormat(achievement.documents);
        
        // Get category ID from code-to-ID mapping
        const categoryId = categoryIdMapRef.current.get(achievement.category);
        if (!categoryId) {
          throw new Error("Invalid category selected");
        }
        
        const payload = {
          isAchievements: true,
          categoryId: categoryId,
          description: achievement.description,
          document: documentJson,
        };

        const response = await applicantService.updateAchievement(
          achievement.achievementId,
          applicantId,
          payload
        );

        if (response.status === "success") {
          // Update the achievement in form state
          const updatedAchievements = [...formik.values.achievements];
          updatedAchievements[index] = {
            ...achievement,
            category: response.data?.categoryCode || achievement.category, // Use categoryCode from response
            saved: true,
          };

          formik.setFieldValue("achievements", updatedAchievements);
          onUpdate({ 
            hasAchievements: formik.values.hasAchievements,
            achievements: updatedAchievements 
          });
          
          // Update original achievements ref
          originalAchievementsRef.current = updatedAchievements.map(a => ({ ...a }));

          // Close edit mode
          if (editingIndex === index) {
            setEditingIndex(null);
          }

          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: response.message || t("applicant.achievementUpdated", "Achievement updated successfully"),
            })
          );
        } else {
          throw new Error(response.message || "Failed to update achievement");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save achievement");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        dispatch(hideLoader());
      }
    } else {
      // If no achievementId, it's a new achievement - call POST API to create it
      if (applicantId) {
        if (isSubmittingRef.current) return;
        
        isSubmittingRef.current = true;
        dispatch(showLoader());

        try {
          const documentJson = await convertFileToDocumentFormat(achievement.documents);
          
          // Get category ID from code-to-ID mapping
          const categoryId = categoryIdMapRef.current.get(achievement.category);
          if (!categoryId) {
            throw new Error("Invalid category selected");
          }
          
          const payload = {
            isAchievements: true,
            categoryId: categoryId,
            description: achievement.description,
            document: documentJson,
          };

          const createPayload = [payload]; // POST expects array
          const response = await applicantService.createAchievements(applicantId, createPayload);

          if (response.status === "success" && response.data && response.data.length > 0) {
            // Update the achievement in form state with the response data
            const updatedAchievements = [...formik.values.achievements];
            const responseData = response.data[0]; // Get first item from array

            // Update achievement with response data
            updatedAchievements[index] = {
              ...achievement,
              achievementId: responseData.id || null,
              category: responseData.categoryCode || achievement.category, // Use categoryCode from response
              saved: true,
            };

            formik.setFieldValue("achievements", updatedAchievements);
            onUpdate({ 
              hasAchievements: formik.values.hasAchievements,
              achievements: updatedAchievements 
            });
            
            // Update original achievements ref
            originalAchievementsRef.current = updatedAchievements.map(a => ({ ...a }));

            // Close edit mode
            if (editingIndex === index) {
              setEditingIndex(null);
            }

            // Show success toast
            dispatch(
              addToast({
                type: "success",
                message: response.message || t("applicant.achievementSaved", "Achievement saved successfully"),
              })
            );
          } else {
            throw new Error(response.message || "Failed to create achievement");
          }
        } catch (error: any) {
          const { message } = handleApiError(error, "Failed to save achievement");
          dispatch(addToast({ type: "error", message }));
        } finally {
          isSubmittingRef.current = false;
          dispatch(hideLoader());
        }
      }
    }
  }, [
    formik,
    applicantId,
    getAchievementSchema,
    handleValidationErrors,
    editingIndex,
    setEditingIndex,
    dispatch,
    t,
    onUpdate,
    convertFileToDocumentFormat,
  ]);

  // Handle Add More button - save current achievements to API if complete, then add new one
  const handleAddAchievementWithAPI = useCallback(async () => {
    if (!applicantId) {
      dispatch(
        addToast({
          type: "error",
          message: t("applicant.applicantIdRequired", "Please save personal details first to get applicant ID"),
        })
      );
      return;
    }

    if (isSubmittingRef.current || isSaving) {
      return;
    }

    // Check if there are any unsaved complete achievements
    const unsavedCompleteAchievements = formik.values.achievements.filter(
      (a) => !a.saved && isAchievementComplete(a) && !a.achievementId
    );

    // If there are unsaved complete achievements, save them first
    if (unsavedCompleteAchievements.length > 0) {
      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        // Save all unsaved complete achievements
        const achievementsToSave = await Promise.all(
          unsavedCompleteAchievements.map(async (a) => {
            const documentJson = await convertFileToDocumentFormat(a.documents);
            
            // Get category ID from code-to-ID mapping
            const categoryId = categoryIdMapRef.current.get(a.category);
            if (!categoryId) {
              throw new Error(`Invalid category selected for achievement: ${a.description}`);
            }
            
            return {
              isAchievements: true,
              categoryId: categoryId,
              description: a.description,
              document: documentJson,
            };
          })
        );

        const createResponse = await applicantService.createAchievements(applicantId, achievementsToSave);

        if (createResponse.status === "success" && createResponse.data) {
          // Update achievements with achievementId from response
          const updatedAchievements = [...formik.values.achievements];
          let responseIndex = 0;

          for (let i = 0; i < updatedAchievements.length; i++) {
            const a = updatedAchievements[i];
            if (unsavedCompleteAchievements.some((ach) => ach.id === a.id)) {
              if (createResponse.data[responseIndex]) {
                const responseData = createResponse.data[responseIndex];
                updatedAchievements[i] = {
                  ...a,
                  achievementId: responseData.id || null,
                  category: responseData.categoryCode || a.category, // Use categoryCode from response
                  saved: true,
                };
                responseIndex++;
              }
            }
          }

          formik.setFieldValue("achievements", updatedAchievements);
          onUpdate({ 
            hasAchievements: formik.values.hasAchievements,
            achievements: updatedAchievements 
          });
          
          // Update original achievements ref
          originalAchievementsRef.current = updatedAchievements.map(a => ({ ...a }));

          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: t("applicant.achievementsSaved", "Achievements saved successfully"),
            })
          );

          // Now add new achievement
          handleAddAchievement();
        } else {
          throw new Error(createResponse.message || "Failed to save achievements");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save achievements");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    } else {
      // No unsaved achievements, just add new one
      handleAddAchievement();
    }
  }, [applicantId, isSaving, formik, isAchievementComplete, dispatch, t, onUpdate, handleAddAchievement, convertFileToDocumentFormat]);

  const handleDeleteAchievement = useCallback((index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingIndex === null || isDeleting) return;

    const indexToDelete = deletingIndex;
    const achievementToDelete = formik.values.achievements[indexToDelete];

    setIsDeleting(true);
    dispatch(showLoader());

    try {
      // Check if achievement has achievementId - if not, just remove from form (new entry)
      if (!achievementToDelete.achievementId) {
        // Remove the achievement from form state (it's a new entry, not saved yet)
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
        setIsDeleting(false);
        dispatch(hideLoader());
        return;
      }

      if (!applicantId) {
        dispatch(
          addToast({
            type: "error",
            message: t("applicant.applicantIdMissing", "Applicant ID is missing. Cannot delete achievement."),
          })
        );
        setIsDeletePopupOpen(false);
        setDeletingIndex(null);
        setIsDeleting(false);
        dispatch(hideLoader());
        return;
      }

      
      const response = await applicantService.deleteAchievement(achievementToDelete.achievementId, applicantId);
      

      if (response.status === "success") {
        // Remove the achievement from form state
        const updatedAchievements = formik.values.achievements.filter((_, i) => i !== indexToDelete);
        formik.setFieldValue("achievements", updatedAchievements);
        if (editingIndex === indexToDelete) {
          setEditingIndex(null);
        } else if (editingIndex !== null && editingIndex > indexToDelete) {
          setEditingIndex(editingIndex - 1);
        }

        // Update original achievements ref
        originalAchievementsRef.current = originalAchievementsRef.current.filter(
          (a) => a.achievementId !== achievementToDelete.achievementId
        );

        dispatch(
          addToast({
            type: "success",
            message: t("applicant.achievementDeleted", "Achievement deleted successfully"),
          })
        );
      } else {
        throw new Error(response.message || "Failed to delete achievement");
      }
    } catch (error) {
      const { message } = handleApiError(error, "Failed to delete achievement");
      dispatch(addToast({ type: "error", message }));
    } finally {
      setIsDeletePopupOpen(false);
      setDeletingIndex(null);
      setIsDeleting(false);
      dispatch(hideLoader());
    }
  }, [deletingIndex, formik, editingIndex, setEditingIndex, applicantId, dispatch, t, isDeleting]);

  const handleCancelDelete = useCallback(() => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  }, []);

  // Fetch achievements when applicantId is available (edit mode or back navigation)
  const fetchAchievements = useCallback(async (id: number | string) => {
    if (isFetchingAchievementsRef.current) {
      return;
    }

    isFetchingAchievementsRef.current = true;
    dispatch(showLoader());

    try {
      const response = await applicantService.getAchievements(id);

      if (response.status === "success" && response.data) {
        // Map API response to AchievementFormData
        if (response.data.length > 0) {
          const mappedAchievements: AchievementItem[] = await Promise.all(
            response.data.map(async (ach) => {
              // Parse document JSON string if it exists
              // Note: We can't directly convert back to File from base64, so set to null
              // User will need to re-upload if they want to change the document
              return {
                id: `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                achievementId: ach.id || null,
                category: ach.categoryCode || "", // Use categoryCode from API response
                description: ach.description || "",
                documents: null, // Set to null as we can't convert back to File
                saved: true,
              };
            })
          );

          const achievementData: AchievementFormData = {
            hasAchievements: "yes",
            achievements: mappedAchievements,
          };

          // Update form state with fetched data
          formik.setValues(achievementData, false);
          onUpdate(achievementData);
          markAsSaved(achievementData);
          
          // Store original achievements for change detection
          originalAchievementsRef.current = mappedAchievements.map(a => ({ ...a }));
        } else {
          // No achievements found, set hasAchievements to "no"
          const achievementData: AchievementFormData = {
            hasAchievements: "no",
            achievements: [],
          };
          formik.setValues(achievementData, false);
          onUpdate(achievementData);
          markAsSaved(achievementData);
          originalAchievementsRef.current = [];
        }
      } else {
        throw new Error(response.message || "Failed to fetch achievements");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch achievements");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isFetchingAchievementsRef.current = false;
      dispatch(hideLoader());
    }
  }, [dispatch, formik, onUpdate, markAsSaved]);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    if (isFetchingCategoriesRef.current) {
      return;
    }

    isFetchingCategoriesRef.current = true;

    try {
      const categories = await applicantService.getCategories();
      
      // Create mapping from code to ID for API conversion
      const idMap = new Map<string, number>();
      // Convert to SelectOption format, filter by isActive and sort by sortOrder
      const options: SelectOption[] = categories
        .filter((category) => category.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((category) => {
          idMap.set(category.code, category.id);
          return {
            value: category.code,
            label: category.name,
          };
        });
      
      categoryIdMapRef.current = idMap;
      setCategoryOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch categories");
      dispatch(addToast({ type: "error", message }));
      setCategoryOptions([]);
    } finally {
      isFetchingCategoriesRef.current = false;
    }
  }, [dispatch]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch achievements when applicantId is available
  useEffect(() => {
    if (applicantId && !isFetchingAchievementsRef.current) {
      fetchAchievements(applicantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]); // Only depend on applicantId to avoid infinite loops

  const handleSave = useCallback(async () => {
    // Prevent duplicate calls
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    setShouldNavigateNext(false);
    await formik.submitForm();
  }, [formik, isSaving]);

  const handleSubmit = useCallback(async () => {
    // Prevent duplicate calls
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    setShouldNavigateNext(true);
    await formik.submitForm();
  }, [formik, isSaving]);

  // Find index by ID helper
  const findAchievementIndexById = useCallback((id: string): number => {
    return formik.values.achievements.findIndex((a) => a.id === id);
  }, [formik.values.achievements]);

  const handleHasAchievementsChange = useCallback((value: string) => {
    formik.setFieldValue("hasAchievements", value);
    if (value === "no") {
      formik.setFieldValue("achievements", []);
    } else if (value === "yes" && formik.values.achievements.length === 0) {
      formik.setFieldValue("achievements", [getEmptyAchievement()]);
    }
  }, [formik, getEmptyAchievement]);

  const incomplete = useMemo(() => getIncompleteAchievements(), [getIncompleteAchievements]);
  const complete = useMemo(() => getCompleteAchievements(), [getCompleteAchievements]);
  const firstIncomplete = useMemo(() => incomplete.length > 0 ? incomplete[0] : null, [incomplete]);
  const firstIncompleteIndex = useMemo(() => firstIncomplete ? findAchievementIndex(firstIncomplete.id) : -1, [firstIncomplete, findAchievementIndex]);

  const showAchievementForm = useMemo(() => formik.values.hasAchievements === "yes", [formik.values.hasAchievements]);

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
                onAddMore={applicantId ? handleAddAchievementWithAPI : handleAddAchievement}
                showCancel={incomplete.length > 1 || complete.length > 0}
                showAddMore={true}
                categoryOptions={categoryOptions}
              />
            )}

            {incomplete.length === 0 && formik.values.achievements.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="accent"
                  onClick={applicantId ? handleAddAchievementWithAPI : handleAddAchievement}
                  disabled={!applicantId || isSaving}
                  isLoading={isSaving}
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
          categoryOptions={categoryOptions}
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
          disabled={isSaving || !applicantId}
          isLoading={isSaving}
          rounded 
          className="w-full sm:w-auto"
        >
          {t("applicant.save")}
        </Button>
        {onSubmit && (
          <Button 
            type="button" 
            variant="accent" 
            onClick={handleSubmit} 
            disabled={!isFormValid || isSaving || !applicantId}
            isLoading={isSaving}
            rounded
            className="w-full sm:w-auto"
          >
            {t("applicant.submit")}
          </Button>
        )}
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

