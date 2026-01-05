import { useMemo, useState, useCallback, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Select, Button, ConfirmationPopup } from "../../../components";
import { COLORS, yesNoOptions } from "../../../constants";
import WorkExperienceForm from "./WorkExperienceForm";
import type { WorkExperienceItem, WorkExperienceFormData } from "./types";
import { useDataChangeTracking, useFormSync, useWorkExperienceLogic } from "./hooks";
import WorkExperienceList from "./components/WorkExperienceList";

interface WorkExperienceProps {
  initialValues: WorkExperienceFormData;
  onUpdate: (data: WorkExperienceFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
}

const WorkExperience = ({ initialValues, onUpdate, onSaveAndNext, onBack }: WorkExperienceProps) => {
  const { t, i18n } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

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

  const formik = useFormik<WorkExperienceFormData>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Only include saved work experiences if hasWorkExperience is "yes"
        const savedWorkExperiences = values.hasWorkExperience === "yes"
          ? values.workExperiences
              .filter((we) => we.saved && isWorkExperienceComplete(we))
              .map((we) => ({
                companyName: we.companyName,
                jobTitle: we.jobTitle,
                startDate: we.startDate ? we.startDate.toISOString() : null,
                endDate: we.currentlyWorking ? null : (we.endDate ? we.endDate.toISOString() : null),
                currentlyWorking: we.currentlyWorking,
              }))
          : [];

        const payload = {
          hasWorkExperience: values.hasWorkExperience,
          workExperiences: savedWorkExperiences,
        };

        // TODO: Replace with actual API endpoint
        // const response = await fetch("/api/applicant/work-experience", {
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
            console.log("API endpoint: POST /api/applicant/work-experience");
          }
          
          // Mark data as saved
          markAsSaved({ 
            hasWorkExperience: values.hasWorkExperience,
            workExperiences: [...values.workExperiences]
          });
        } else {
          if (import.meta.env.DEV) {
            console.log("No changes detected. Skipping API call.");
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error saving work experience:", error);
        }
      }
    },
  });

  // Use reusable hook for data change tracking with custom comparison for arrays
  const { hasDataChanged, markAsSaved } = useDataChangeTracking<WorkExperienceFormData>(
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
  const markAllFieldsAsTouched = useCallback(() => {
    return {
      companyName: true,
      jobTitle: true,
      startDate: true,
      endDate: true,
      currentlyWorking: true,
    };
  }, []);

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
    handleSaveWorkExperience,
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
    const unsavedWorkExperiences = formik.values.workExperiences.filter((we) => !we.saved);

    if (unsavedWorkExperiences.length > 0 && formik.values.hasWorkExperience === "yes") {
      const workExperienceSchema = getWorkExperienceSchema();

      let hasErrors = false;
      const updatedWorkExperiences = [...formik.values.workExperiences];
      const touchedWorkExperiences = [...(formik.touched.workExperiences || [])];

      for (const we of unsavedWorkExperiences) {
        const index = formik.values.workExperiences.findIndex((w) => w.id === we.id);
        try {
          await workExperienceSchema.validate(we, { abortEarly: false });
          updatedWorkExperiences[index] = {
            ...updatedWorkExperiences[index],
            saved: true,
          };
        } catch (error) {
          hasErrors = true;
          touchedWorkExperiences[index] = markAllFieldsAsTouched();
          handleValidationErrors(error, index);
        }
      }

      formik.setFieldValue("workExperiences", updatedWorkExperiences);
      formik.setTouched({
        ...formik.touched,
        workExperiences: touchedWorkExperiences as any,
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

  const handleSaveAndNextClick = async () => {
    if (formik.values.hasWorkExperience === "yes") {
      const unsavedWorkExperiences = formik.values.workExperiences.filter((we) => !we.saved);
      if (unsavedWorkExperiences.length > 0) {
        const touchedWorkExperiences = formik.values.workExperiences.map((we, index) => {
          if (!we.saved) {
            return markAllFieldsAsTouched();
          }
          return formik.touched.workExperiences?.[index] || {};
        });
        formik.setTouched({
          ...formik.touched,
          workExperiences: touchedWorkExperiences as any,
        });
        return;
      }

      const savedWorkExperiences = formik.values.workExperiences.filter((we) => we.saved);
      if (savedWorkExperiences.length === 0) {
        return;
      }
    }

    await formik.submitForm();
    if (onSaveAndNext) {
      onSaveAndNext();
    }
  };

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
                onAddMore={handleAddWorkExperience}
                showCancel={incomplete.length > 1 || complete.length > 0}
                showAddMore={true}
              />
            )}

            {incomplete.length === 0 && formik.values.workExperiences.length > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleAddWorkExperience}
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
          onSave={handleSaveWorkExperience}
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
          rounded
          className="w-full sm:w-auto"
        >
          {t("applicant.save")}
        </Button>
        <Button 
          type="button" 
          variant="accent" 
          onClick={handleSaveAndNextClick}
          disabled={!isFormValid}
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
