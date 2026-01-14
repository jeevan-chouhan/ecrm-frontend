import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Select, Button, ConfirmationPopup } from "../../../components";
import { COLORS, yesNoOptions } from "../../../constants";
import WorkExperienceForm from "./WorkExperienceForm";
import type { WorkExperienceItem, WorkExperienceFormData } from "./types";
import { useDataChangeTracking, useFormSync, useWorkExperienceLogic } from "./hooks";
import WorkExperienceList from "./components/WorkExperienceList";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

interface WorkExperienceProps {
  initialValues: WorkExperienceFormData;
  onUpdate: (data: WorkExperienceFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
  applicantId?: number | string | null;
}

const WorkExperience = ({ initialValues, onUpdate, onSaveAndNext, onBack, applicantId }: WorkExperienceProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions
  const isFetchingWorkExperiencesRef = useRef(false); // Prevent duplicate fetches
  const originalWorkExperiencesRef = useRef<WorkExperienceItem[]>([]); // Store original work experiences from GET API
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);

  const getEmptyWorkExperience = (): WorkExperienceItem => ({
    id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    companyName: "",
    jobTitle: "",
    startDate: null,
    endDate: null,
    currentlyWorking: false,
    saved: false,
  });

  // Reusable work experience validation schema
  const getWorkExperienceSchema = useCallback(() => {
    return Yup.object().shape({
      companyName: Yup.string().required(t("validation.companyNameRequired")).trim(),
      jobTitle: Yup.string().required(t("validation.jobTitleRequired")).trim(),
      startDate: Yup.date().nullable().required(t("validation.startDateRequired")),
      endDate: Yup.date()
        .nullable()
        .when("currentlyWorking", {
          is: false,
          then: (schema) => schema.required(t("validation.endDateRequired")),
          otherwise: (schema) => schema,
        })
        .when("startDate", {
          is: (startDate: Date | null) => startDate !== null,
          then: (schema) =>
            schema.test(
              "is-after-start",
              t("validation.endDateBeforeStartDate"),
              function (endDate) {
                const { startDate } = this.parent;
                if (!endDate || !startDate) return true;
                return endDate >= startDate;
              }
            ),
          otherwise: (schema) => schema,
        }),
      currentlyWorking: Yup.boolean(),
    });
  }, [t, i18n.language]);

  // Validation schema using Yup with i18n messages
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        hasWorkExperience: Yup.string().required(t("validation.workExperienceRequired")),
        workExperiences: Yup.array()
          .of(getWorkExperienceSchema())
          .when("hasWorkExperience", {
            is: "yes",
            then: (schema) => schema.min(1, t("validation.atLeastOneWorkExperienceRequired")),
            otherwise: (schema) => schema,
          }),
      }),
    [getWorkExperienceSchema, t]
  );

  // Helper function to check if a work experience has changed compared to original
  const hasWorkExperienceChanged = useCallback((current: WorkExperienceItem, original: WorkExperienceItem | undefined): boolean => {
    if (!original) return true; // If no original, consider it changed (new work experience)
    
    // Compare all fields
    const startDateChanged = 
      (current.startDate === null && original.startDate !== null) ||
      (current.startDate !== null && original.startDate === null) ||
      (current.startDate !== null && original.startDate !== null &&
       current.startDate.getTime() !== original.startDate.getTime());
    
    const endDateChanged = 
      (current.endDate === null && original.endDate !== null) ||
      (current.endDate !== null && original.endDate === null) ||
      (current.endDate !== null && original.endDate !== null &&
       current.endDate.getTime() !== original.endDate.getTime());
    
    return (
      current.companyName !== original.companyName ||
      current.jobTitle !== original.jobTitle ||
      current.currentlyWorking !== original.currentlyWorking ||
      startDateChanged ||
      endDateChanged
    );
  }, []);

  const formik = useFormik<WorkExperienceFormData>({
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

      // If hasWorkExperience is "no", we don't need to save anything
      if (values.hasWorkExperience === "no") {
        markAsSaved(values);
        
        // Still navigate if needed
        if (shouldNavigateNext && onSaveAndNext) {
          onSaveAndNext();
          setShouldNavigateNext(false);
        }
        return;
      }

      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        // Get complete work experiences (both saved and unsaved but complete)
        // First, mark complete work experiences as saved if they're not already
        const updatedWorkExperiences = [...values.workExperiences];
        let hasNewCompleteWorkExperiences = false;

        for (let i = 0; i < updatedWorkExperiences.length; i++) {
          const we = updatedWorkExperiences[i];
          if (!we.saved && isWorkExperienceComplete(we)) {
            updatedWorkExperiences[i] = {
              ...we,
              saved: true,
            };
            hasNewCompleteWorkExperiences = true;
          }
        }

        // Update form state if we marked any as saved
        if (hasNewCompleteWorkExperiences) {
          formik.setFieldValue("workExperiences", updatedWorkExperiences);
        }

        // Get all complete work experiences (now all should be marked as saved)
        const savedWorkExperiences = updatedWorkExperiences.filter(
          (we) => we.saved && isWorkExperienceComplete(we)
        );

        if (savedWorkExperiences.length === 0) {
          dispatch(
            addToast({
              type: "error",
              message: t("validation.atLeastOneWorkExperienceRequired", "At least one complete work experience is required"),
            })
          );
          isSubmittingRef.current = false;
          setIsSaving(false);
          dispatch(hideLoader());
          return;
        }

        // Separate work experiences into updates (have workExperienceId) and creates (don't have workExperienceId)
        const workExperiencesToCreate = savedWorkExperiences.filter((we) => !we.workExperienceId);
        
        const workExperiencesToUpdate = savedWorkExperiences.filter((we) => {
          if (!we.workExperienceId) return false; // Skip if no workExperienceId
          
          // Find original work experience by workExperienceId
          const original = originalWorkExperiencesRef.current.find(
            (orig) => orig.workExperienceId?.toString() === we.workExperienceId?.toString()
          );
          
          // Only update if work experience has changed
          return hasWorkExperienceChanged(we, original);
        });

        // If there are new work experiences to create, always call POST API
        // If there are updates, call PUT API
        // Only skip if no new items and no changes
        if (workExperiencesToUpdate.length === 0 && workExperiencesToCreate.length === 0) {
          if (import.meta.env.DEV) {
            console.log("No work experiences to save - all are unchanged or already saved");
          }
          
          // Mark data as saved
          markAsSaved(values);
          
          // Still navigate if needed
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
          isSubmittingRef.current = false;
          setIsSaving(false);
          dispatch(hideLoader());
          return;
        }

        // Update existing work experiences using PUT
        if (workExperiencesToUpdate.length > 0) {
          for (const we of workExperiencesToUpdate) {
            const payload = {
              isExperienced: true,
              companyName: we.companyName,
              jobTitle: we.jobTitle,
              isCurrentlyWorking: we.currentlyWorking,
              startDate: we.startDate ? we.startDate.toISOString().split('T')[0] : "",
              endDate: we.currentlyWorking ? null : (we.endDate ? we.endDate.toISOString().split('T')[0] : null),
            };

            const response = await applicantService.updateWorkExperience(
              we.workExperienceId!,
              applicantId,
              payload
            );

            if (response.status !== "success") {
              throw new Error(response.message || "Failed to update work experience");
            }
          }
        }

        // Create new work experiences using POST
        if (workExperiencesToCreate.length > 0) {
          const createPayload = workExperiencesToCreate.map((we) => ({
            isExperienced: true,
            companyName: we.companyName,
            jobTitle: we.jobTitle,
            isCurrentlyWorking: we.currentlyWorking,
            startDate: we.startDate ? we.startDate.toISOString().split('T')[0] : "",
            endDate: we.currentlyWorking ? null : (we.endDate ? we.endDate.toISOString().split('T')[0] : null),
          }));

          const createResponse = await applicantService.createWorkExperiences(applicantId, createPayload);

          if (createResponse.status === "success" && createResponse.data) {
            // Update workExperienceId for newly created work experiences
            // Use the updatedWorkExperiences array that we already modified
            let createIndex = 0;
            
            for (let i = 0; i < updatedWorkExperiences.length; i++) {
              const we = updatedWorkExperiences[i];
              if (workExperiencesToCreate.some((w) => w.id === we.id)) {
                if (createResponse.data[createIndex]) {
                  const responseData = createResponse.data[createIndex];
                  updatedWorkExperiences[i] = {
                    ...we,
                    workExperienceId: responseData.id || null,
                    saved: true,
                  };
                  createIndex++;
                }
              }
            }
            
            formik.setFieldValue("workExperiences", updatedWorkExperiences);
            
            // Update original work experiences ref
            originalWorkExperiencesRef.current = updatedWorkExperiences.map(we => ({ ...we }));
          } else {
            throw new Error(createResponse.message || "Failed to create work experiences");
          }
        }

        // Show success toast
        const successMessage = workExperiencesToUpdate.length > 0 && workExperiencesToCreate.length > 0
          ? t("applicant.workExperiencesSaved", "Work experiences saved successfully")
          : workExperiencesToUpdate.length > 0
          ? t("applicant.workExperiencesUpdated", "Work experiences updated successfully")
          : t("applicant.workExperiencesSaved", "Work experiences saved successfully");

        dispatch(
          addToast({
            type: "success",
            message: successMessage,
          })
        );

        // Mark data as saved and update original work experiences
        // Use the updatedWorkExperiences array that we already modified
        const finalValues = {
          ...values,
          workExperiences: updatedWorkExperiences,
        };
        
        markAsSaved(finalValues);
        
        // Update original work experiences ref with current state after save
        originalWorkExperiencesRef.current = updatedWorkExperiences.map(we => ({ ...we }));

        // Navigate to next tab if "Save & Next" was clicked
        if (shouldNavigateNext && onSaveAndNext) {
          onSaveAndNext();
          setShouldNavigateNext(false);
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save work experiences");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    },
  });

  // Use reusable hook for data change tracking with custom comparison for arrays
  const { markAsSaved } = useDataChangeTracking<WorkExperienceFormData>(
    formik.values,
    (lastSavedData, current) => {
      if (!lastSavedData) return true;
      if (lastSavedData.hasWorkExperience !== current.hasWorkExperience) {
        return true;
      }
      
      if (current.hasWorkExperience === "no") {
        return false;
      }
      
      const currentSaved = current.workExperiences.filter((we) => we.saved && isWorkExperienceComplete(we));
      const lastSaved = lastSavedData.workExperiences.filter((we) => we.saved && isWorkExperienceComplete(we));
      
      if (currentSaved.length !== lastSaved.length) {
        return true;
      }
      
      return currentSaved.some((currentItem, index) => {
        const lastItem = lastSaved[index];
        if (!lastItem) return true;
        
        // Compare dates by timestamp instead of reference
        const startDateChanged = 
          (currentItem.startDate === null && lastItem.startDate !== null) ||
          (currentItem.startDate !== null && lastItem.startDate === null) ||
          (currentItem.startDate !== null && lastItem.startDate !== null &&
           currentItem.startDate.getTime() !== lastItem.startDate.getTime());
        
        const endDateChanged = 
          (currentItem.endDate === null && lastItem.endDate !== null) ||
          (currentItem.endDate !== null && lastItem.endDate === null) ||
          (currentItem.endDate !== null && lastItem.endDate !== null &&
           currentItem.endDate.getTime() !== lastItem.endDate.getTime());
        
        return (
          currentItem.companyName !== lastItem.companyName ||
          currentItem.jobTitle !== lastItem.jobTitle ||
          startDateChanged ||
          endDateChanged ||
          currentItem.currentlyWorking !== lastItem.currentlyWorking
        );
      });
    }
  );

  // Check form validity - hasWorkExperience must be selected, and if yes, at least one complete work experience required
  useEffect(() => {
    const isValid = 
      formik.values.hasWorkExperience !== "" &&
      (formik.values.hasWorkExperience === "no" || 
       formik.values.workExperiences.filter((we) => we.saved && isWorkExperienceComplete(we)).length > 0);
    setIsFormValid(isValid);
  }, [formik.values.hasWorkExperience, formik.values.workExperiences]);

  // Sync formik values to parent state with optimized comparison
  useFormSync<WorkExperienceFormData>(
    formik.values,
    onUpdate,
    (prev, current) => {
      // Quick check for hasWorkExperience change
      if (prev.hasWorkExperience !== current.hasWorkExperience) {
        return true;
      }
      
      // Deep comparison for workExperiences array
      if (current.workExperiences.length !== prev.workExperiences.length) {
        return true;
      }
      
      // Deep comparison only if lengths match
      return current.workExperiences.some((currentItem, index) => {
        const prevItem = prev.workExperiences[index];
        if (!prevItem) return true;
        
        // Compare dates by timestamp instead of reference
        const startDateChanged = 
          (currentItem.startDate === null && prevItem.startDate !== null) ||
          (currentItem.startDate !== null && prevItem.startDate === null) ||
          (currentItem.startDate !== null && prevItem.startDate !== null &&
           currentItem.startDate.getTime() !== prevItem.startDate.getTime());
        
        const endDateChanged = 
          (currentItem.endDate === null && prevItem.endDate !== null) ||
          (currentItem.endDate !== null && prevItem.endDate === null) ||
          (currentItem.endDate !== null && prevItem.endDate !== null &&
           currentItem.endDate.getTime() !== prevItem.endDate.getTime());
        
        return (
          currentItem.id !== prevItem.id ||
          currentItem.companyName !== prevItem.companyName ||
          currentItem.jobTitle !== prevItem.jobTitle ||
          startDateChanged ||
          endDateChanged ||
          currentItem.currentlyWorking !== prevItem.currentlyWorking ||
          currentItem.saved !== prevItem.saved
        );
      });
    }
  );

  // Helper functions
  const handleValidationErrors = useCallback((error: unknown, index: number) => {
    if (error instanceof Yup.ValidationError) {
      error.inner.forEach((err) => {
        if (err.path) {
          formik.setFieldTouched(`workExperiences[${index}].${err.path}`, true);
        }
      });
    }
  }, [formik]);

  // Use extracted logic hook
  const {
    isWorkExperienceComplete,
    getIncompleteWorkExperiences,
    getCompleteWorkExperiences,
    handleAddWorkExperience,
    handleCancelIncompleteWorkExperience,
    handleEditWorkExperience,
    handleCancelEdit,
    getFieldError,
    updateWorkExperienceField,
  } = useWorkExperienceLogic({
    formik,
    editingIndex,
    setEditingIndex,
    getWorkExperienceSchema,
    getEmptyWorkExperience,
    handleValidationErrors,
  });

  // Handle save work experience with API call (for individual work experience saves)
  const handleSaveWorkExperienceWithAPI = useCallback(async (index: number) => {
    const workExperience = formik.values.workExperiences[index];
    const workExperienceSchema = getWorkExperienceSchema();

    // Validate first
    try {
      await workExperienceSchema.validate(workExperience, { abortEarly: false });
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

    // If work experience has workExperienceId, it's an existing work experience - call PUT API
    if (workExperience.workExperienceId && applicantId) {
      if (isSubmittingRef.current) return;
      
      isSubmittingRef.current = true;
      dispatch(showLoader());

      try {
        const payload = {
          isExperienced: true,
          companyName: workExperience.companyName,
          jobTitle: workExperience.jobTitle,
          isCurrentlyWorking: workExperience.currentlyWorking,
          startDate: workExperience.startDate ? workExperience.startDate.toISOString().split('T')[0] : "",
          endDate: workExperience.currentlyWorking ? null : (workExperience.endDate ? workExperience.endDate.toISOString().split('T')[0] : null),
        };

        const response = await applicantService.updateWorkExperience(
          workExperience.workExperienceId,
          applicantId,
          payload
        );

        if (response.status === "success") {
          // Update the work experience in form state
          const updatedWorkExperiences = [...formik.values.workExperiences];
          updatedWorkExperiences[index] = {
            ...workExperience,
            saved: true,
          };

          formik.setFieldValue("workExperiences", updatedWorkExperiences);
          onUpdate({ 
            hasWorkExperience: formik.values.hasWorkExperience,
            workExperiences: updatedWorkExperiences 
          });
          
          // Update original work experiences ref
          originalWorkExperiencesRef.current = updatedWorkExperiences.map(we => ({ ...we }));

          // Close edit mode
          if (editingIndex === index) {
            setEditingIndex(null);
          }

          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: response.message || t("applicant.workExperienceUpdated", "Work experience updated successfully"),
            })
          );
        } else {
          throw new Error(response.message || "Failed to update work experience");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save work experience");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        dispatch(hideLoader());
      }
    } else {
      // If no workExperienceId, it's a new work experience - call POST API to create it
      if (applicantId) {
        if (isSubmittingRef.current) return;
        
        isSubmittingRef.current = true;
        dispatch(showLoader());

        try {
          const payload = {
            isExperienced: true,
            companyName: workExperience.companyName,
            jobTitle: workExperience.jobTitle,
            isCurrentlyWorking: workExperience.currentlyWorking,
            startDate: workExperience.startDate ? workExperience.startDate.toISOString().split('T')[0] : "",
            endDate: workExperience.currentlyWorking ? null : (workExperience.endDate ? workExperience.endDate.toISOString().split('T')[0] : null),
          };

          const createPayload = [payload]; // POST expects array
          const response = await applicantService.createWorkExperiences(applicantId, createPayload);

          if (response.status === "success" && response.data && response.data.length > 0) {
            // Update the work experience in form state with the response data
            const updatedWorkExperiences = [...formik.values.workExperiences];
            const responseData = response.data[0]; // Get first item from array

            // Update work experience with response data
            updatedWorkExperiences[index] = {
              ...workExperience,
              workExperienceId: responseData.id || null,
              saved: true,
            };

            formik.setFieldValue("workExperiences", updatedWorkExperiences);
            onUpdate({ 
              hasWorkExperience: formik.values.hasWorkExperience,
              workExperiences: updatedWorkExperiences 
            });
            
            // Update original work experiences ref
            originalWorkExperiencesRef.current = updatedWorkExperiences.map(we => ({ ...we }));

            // Close edit mode
            if (editingIndex === index) {
              setEditingIndex(null);
            }

            // Show success toast
            dispatch(
              addToast({
                type: "success",
                message: response.message || t("applicant.workExperienceSaved", "Work experience saved successfully"),
              })
            );
          } else {
            throw new Error(response.message || "Failed to create work experience");
          }
        } catch (error: any) {
          const { message } = handleApiError(error, "Failed to save work experience");
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
    getWorkExperienceSchema,
    handleValidationErrors,
    editingIndex,
    setEditingIndex,
    dispatch,
    t,
    onUpdate,
  ]);

  // Handle Add More button - save current work experience to API if complete, then add new one
  const handleAddWorkExperienceWithAPI = useCallback(async () => {
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

    // Check if there are any unsaved complete work experiences
    const unsavedCompleteWorkExperiences = formik.values.workExperiences.filter(
      (we) => !we.saved && isWorkExperienceComplete(we) && !we.workExperienceId
    );

    // If there are unsaved complete work experiences, save them first
    if (unsavedCompleteWorkExperiences.length > 0) {
      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        // Save all unsaved complete work experiences
        const workExperiencesToSave = unsavedCompleteWorkExperiences.map((we) => ({
          isExperienced: true,
          companyName: we.companyName,
          jobTitle: we.jobTitle,
          isCurrentlyWorking: we.currentlyWorking,
          startDate: we.startDate ? we.startDate.toISOString().split('T')[0] : "",
          endDate: we.currentlyWorking ? null : (we.endDate ? we.endDate.toISOString().split('T')[0] : null),
        }));

        const createResponse = await applicantService.createWorkExperiences(applicantId, workExperiencesToSave);

        if (createResponse.status === "success" && createResponse.data) {
          // Update work experiences with workExperienceId from response
          const updatedWorkExperiences = [...formik.values.workExperiences];
          let responseIndex = 0;

          for (let i = 0; i < updatedWorkExperiences.length; i++) {
            const we = updatedWorkExperiences[i];
            if (unsavedCompleteWorkExperiences.some((w) => w.id === we.id)) {
              if (createResponse.data[responseIndex]) {
                const responseData = createResponse.data[responseIndex];
                updatedWorkExperiences[i] = {
                  ...we,
                  workExperienceId: responseData.id || null,
                  saved: true,
                };
                responseIndex++;
              }
            }
          }

          formik.setFieldValue("workExperiences", updatedWorkExperiences);
          onUpdate({ 
            hasWorkExperience: formik.values.hasWorkExperience,
            workExperiences: updatedWorkExperiences 
          });
          
          // Update original work experiences ref
          originalWorkExperiencesRef.current = updatedWorkExperiences.map(we => ({ ...we }));

          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: createResponse.message || t("applicant.workExperiencesSaved", "Work experiences saved successfully"),
            })
          );

          // Now add new work experience
          handleAddWorkExperience();
        } else {
          throw new Error(createResponse.message || "Failed to save work experiences");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save work experiences");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    } else {
      // No unsaved work experiences, just add new one
      handleAddWorkExperience();
    }
  }, [applicantId, isSaving, formik, isWorkExperienceComplete, dispatch, t, onUpdate, handleAddWorkExperience]);

  const handleDeleteWorkExperience = useCallback((index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletingIndex === null) return;

    const indexToDelete = deletingIndex;
    const workExperienceToDelete = formik.values.workExperiences[indexToDelete];

    // Remove the work experience using the hook's remove function
    const updatedWorkExperiences = formik.values.workExperiences.filter((_, i) => i !== indexToDelete);
    formik.setFieldValue("workExperiences", updatedWorkExperiences);
    if (editingIndex === indexToDelete) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > indexToDelete) {
      setEditingIndex(editingIndex - 1);
    }

    // Close popup and reset state
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);

    // TODO: Replace with actual API endpoint
    // const response = await fetch(`/api/applicant/work-experience/${workExperienceToDelete.id}`, {
    //   method: "DELETE",
    // });
    // const result = await response.json();
    if (import.meta.env.DEV) {
      console.log("Delete API call for work experience:", workExperienceToDelete);
    }
  }, [deletingIndex, formik, editingIndex, setEditingIndex]);

  const handleCancelDelete = useCallback(() => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  }, []);

  const handleSave = async () => {
    // Prevent duplicate calls
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    setShouldNavigateNext(false);
    await formik.submitForm();
  };

  const handleSaveAndNextClick = async () => {
    // Prevent duplicate calls
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    setShouldNavigateNext(true);
    await formik.submitForm();
  };

  // Fetch work experiences when applicantId is available (edit mode or back navigation)
  const fetchWorkExperiences = useCallback(async (id: number | string) => {
    if (isFetchingWorkExperiencesRef.current) {
      return;
    }

    isFetchingWorkExperiencesRef.current = true;
    dispatch(showLoader());

    try {
      const response = await applicantService.getWorkExperiences(id);

      if (response.status === "success" && response.data) {
        // Map API response to WorkExperienceFormData
        if (response.data.length > 0) {
          const mappedWorkExperiences: WorkExperienceItem[] = response.data.map((we) => ({
            id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            workExperienceId: we.id || null,
            companyName: we.companyName || "",
            jobTitle: we.jobTitle || "",
            startDate: we.startDate ? new Date(we.startDate + "T00:00:00") : null,
            endDate: we.endDate ? new Date(we.endDate + "T00:00:00") : null,
            currentlyWorking: we.isCurrentlyWorking || false,
            saved: true,
          }));

          const workExperienceData: WorkExperienceFormData = {
            hasWorkExperience: "yes",
            workExperiences: mappedWorkExperiences,
          };

          // Update form state with fetched data
          formik.setValues(workExperienceData, false);
          onUpdate(workExperienceData);
          markAsSaved(workExperienceData);
          
          // Store original work experiences for change detection
          originalWorkExperiencesRef.current = mappedWorkExperiences.map(we => ({ ...we }));
        } else {
          // No work experiences found, set hasWorkExperience to "no"
          const workExperienceData: WorkExperienceFormData = {
            hasWorkExperience: "no",
            workExperiences: [],
          };
          formik.setValues(workExperienceData, false);
          onUpdate(workExperienceData);
          markAsSaved(workExperienceData);
          originalWorkExperiencesRef.current = [];
        }
      } else {
        throw new Error(response.message || "Failed to fetch work experiences");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch work experiences");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isFetchingWorkExperiencesRef.current = false;
      dispatch(hideLoader());
    }
  }, [dispatch, formik, onUpdate, markAsSaved]);

  // Fetch work experiences when applicantId is available
  useEffect(() => {
    if (applicantId && !isFetchingWorkExperiencesRef.current) {
      fetchWorkExperiences(applicantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]); // Only depend on applicantId to avoid infinite loops

  // Find index by ID helper
  const findWorkExperienceIndexById = useCallback((id: string): number => {
    return formik.values.workExperiences.findIndex((w) => w.id === id);
  }, [formik.values.workExperiences]);

  const handleHasWorkExperienceChange = (value: string) => {
    formik.setFieldValue("hasWorkExperience", value);
    if (value === "no") {
      formik.setFieldValue("workExperiences", []);
    } else if (value === "yes" && formik.values.workExperiences.length === 0) {
      formik.setFieldValue("workExperiences", [getEmptyWorkExperience()]);
    }
  };

  const incomplete = getIncompleteWorkExperiences();
  const complete = getCompleteWorkExperiences();
  const firstIncomplete = incomplete.length > 0 ? incomplete[0] : null;
  const firstIncompleteIndex = firstIncomplete
    ? formik.values.workExperiences.findIndex((w) => w.id === firstIncomplete.id)
    : -1;

  const showWorkExperienceForm = formik.values.hasWorkExperience === "yes";

  return (
    <div className="space-y-6">
      <div>

        {/* Do You Have Work Experience? */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full">
              <Select
                label={t("applicant.doYouHaveWorkExperience")}
                options={yesNoOptions}
                value={formik.values.hasWorkExperience}
                onChange={handleHasWorkExperienceChange}
                placeholder={t("applicant.doYouHaveWorkExperience")}
                error={formik.touched.hasWorkExperience && formik.errors.hasWorkExperience ? formik.errors.hasWorkExperience : undefined}
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Work Experience Details Form */}
        {showWorkExperienceForm && (
          <>
            <div className="mb-4">
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("applicant.workExperienceDetails")}
              </p>
            </div>

            {firstIncomplete && firstIncompleteIndex >= 0 && (
              <WorkExperienceForm
                workExperience={firstIncomplete}
                index={firstIncompleteIndex}
                onFieldChange={updateWorkExperienceField}
                getFieldError={getFieldError}
                onCancel={() => handleCancelIncompleteWorkExperience(firstIncompleteIndex)}
                onAddMore={applicantId ? handleAddWorkExperienceWithAPI : handleAddWorkExperience}
                showCancel={incomplete.length > 1 || complete.length > 0}
                showAddMore={true}
              />
            )}

            {incomplete.length === 0 && formik.values.workExperiences.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="accent"
                  onClick={applicantId ? handleAddWorkExperienceWithAPI : handleAddWorkExperience}
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

        {/* Added Work Experiences Section */}
        <WorkExperienceList
          workExperiences={complete}
          editingIndex={editingIndex}
          getFieldError={getFieldError}
          updateWorkExperienceField={updateWorkExperienceField}
          onEdit={handleEditWorkExperience}
          onDelete={handleDeleteWorkExperience}
          onSave={handleSaveWorkExperienceWithAPI}
          onCancelEdit={handleCancelEdit}
          findIndexById={findWorkExperienceIndexById}
        />

        {/* Show message if no work experiences added */}
        {showWorkExperienceForm && complete.length === 0 && incomplete.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("applicant.noWorkExperiencesAdded")}
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
        title={t("applicant.deleteWorkExperience", "Delete Work Experience")}
        message={`${t("applicant.deleteWorkExperienceConfirmation", "Are you sure you want to delete this work experience?")} ${t("applicant.deleteWarning", "This action cannot be undone.")}`}
        confirmLabel={t("common.delete", "Delete")}
        variant="danger"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default WorkExperience;
