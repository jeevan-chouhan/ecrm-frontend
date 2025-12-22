import { useMemo, useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Select, Button, Popup } from "../../../components";
import { COLORS, yesNoOptions } from "../../../constants";
import { Edit, Trash } from "../../../assets";
import WorkExperienceForm from "./WorkExperienceForm";
import type { WorkExperienceItem, WorkExperienceFormData } from "./types";

const WorkExperience = ({ onSaveAndNext }: { onSaveAndNext?: () => void }) => {
  const { t, i18n } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

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
    initialValues: {
      hasWorkExperience: "",
      workExperiences: [],
    },
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

        console.log("Payload ready for API:", payload);
      } catch (error) {
        console.error("Error saving work experience:", error);
      }
    },
  });

  // Reusable helper functions (defined after formik)
  const markWorkExperienceAsSaved = useCallback((index: number) => {
    const updatedWorkExperiences = [...formik.values.workExperiences];
    updatedWorkExperiences[index] = {
      ...updatedWorkExperiences[index],
      saved: true,
    };
    formik.setFieldValue("workExperiences", updatedWorkExperiences);
  }, [formik]);

  const removeWorkExperience = useCallback((index: number) => {
    const updatedWorkExperiences = formik.values.workExperiences.filter((_, i) => i !== index);
    formik.setFieldValue("workExperiences", updatedWorkExperiences);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [formik, editingIndex]);

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

  const clearWorkExperienceErrors = useCallback((index: number) => {
    // Clear errors
    if (formik.errors.workExperiences?.[index]) {
      const updatedErrors: any[] = [...(formik.errors.workExperiences || [])];
      updatedErrors[index] = undefined;
      formik.setErrors({
        ...formik.errors,
        workExperiences: updatedErrors as any,
      });
    }
    
    // Clear touched state
    if (formik.touched.workExperiences?.[index]) {
      const updatedTouched = [...(formik.touched.workExperiences || [])];
      updatedTouched[index] = {};
      formik.setTouched({
        ...formik.touched,
        workExperiences: updatedTouched as any,
      });
    }
  }, [formik]);

  const isWorkExperienceComplete = (we: WorkExperienceItem): boolean => {
    return !!(
      we.companyName &&
      we.jobTitle &&
      we.startDate &&
      (we.currentlyWorking || we.endDate)
    );
  };

  const getIncompleteWorkExperiences = (): WorkExperienceItem[] => {
    return formik.values.workExperiences.filter((we, index) => {
      if (editingIndex === index) {
        return false;
      }
      return !we.saved;
    });
  };

  const getCompleteWorkExperiences = (): WorkExperienceItem[] => {
    return formik.values.workExperiences.filter((we, index) => {
      if (editingIndex === index) {
        return true;
      }
      return isWorkExperienceComplete(we) && we.saved;
    });
  };

  const handleAddWorkExperience = async () => {
    if (formik.values.hasWorkExperience !== "yes") {
      return;
    }
    
    const incomplete = getIncompleteWorkExperiences();
    
    // If there's an incomplete work experience, save it first
    if (incomplete.length > 0) {
      const firstIncomplete = incomplete[0];
      const index = formik.values.workExperiences.findIndex((w) => w.id === firstIncomplete.id);
      
      // Validate and save the current incomplete work experience
      const workExperienceSchema = getWorkExperienceSchema();

      try {
        await workExperienceSchema.validate(firstIncomplete, { abortEarly: false });
        
        // Save the current work experience
        markWorkExperienceAsSaved(index);
        
        // Now add a new empty work experience
        const emptyWorkExp = getEmptyWorkExperience();
        const currentWorkExperiences = formik.values.workExperiences;
        const updatedWorkExperiences = currentWorkExperiences.map((w, i) => 
          i === index ? { ...w, saved: true } : w
        );
        formik.setFieldValue("workExperiences", [...updatedWorkExperiences, emptyWorkExp]);
      } catch (error) {
        // If validation fails, mark fields as touched to show errors
        handleValidationErrors(error, index);
        // Don't add new form if validation fails
        return;
      }
    } else {
      // No incomplete work experiences, just add a new one
      const emptyWorkExp = getEmptyWorkExperience();
      formik.setFieldValue("workExperiences", [...formik.values.workExperiences, emptyWorkExp]);
    }
  };

  const handleDeleteWorkExperience = (index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingIndex === null) return;

    const indexToDelete = deletingIndex;
    const workExperienceToDelete = formik.values.workExperiences[indexToDelete];

    // Remove the work experience
    removeWorkExperience(indexToDelete);

    // Close popup and reset state
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);

    // TODO: Replace with actual API endpoint
    // const response = await fetch(`/api/applicant/work-experience/${workExperienceToDelete.id}`, {
    //   method: "DELETE",
    // });
    // const result = await response.json();
    console.log("Delete API call for work experience:", workExperienceToDelete);
  };

  const handleCancelDelete = () => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  };

  const handleCancelIncompleteWorkExperience = (index: number) => {
    const incomplete = getIncompleteWorkExperiences();
    const complete = getCompleteWorkExperiences();

    if (incomplete.length === 1 && complete.length === 0) {
      const emptyWorkExp = getEmptyWorkExperience();
      const updatedWorkExperiences = [...formik.values.workExperiences];
      updatedWorkExperiences[index] = emptyWorkExp;
      formik.setFieldValue("workExperiences", updatedWorkExperiences);

      // Clear all errors and touched state for this work experience
      clearWorkExperienceErrors(index);
    } else {
      removeWorkExperience(index);
    }
  };

  const handleSaveWorkExperience = async (index: number) => {
    const workExperience = formik.values.workExperiences[index];

    const workExperienceSchema = getWorkExperienceSchema();

    try {
      await workExperienceSchema.validate(workExperience, { abortEarly: false });

      // Mark work experience as saved
      markWorkExperienceAsSaved(index);

      if (editingIndex === index) {
        setEditingIndex(null);
      }
    } catch (error) {
      handleValidationErrors(error, index);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleEditWorkExperience = (index: number) => {
    setEditingIndex(index);
  };

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

  const getFieldError = (index: number, fieldName: keyof WorkExperienceItem): string | undefined => {
    const touched = formik.touched.workExperiences?.[index]?.[fieldName];
    const error = formik.errors.workExperiences?.[index];
    if (touched && error && typeof error === "object" && fieldName in error) {
      const fieldError = error[fieldName];
      return typeof fieldError === "string" ? fieldError : undefined;
    }
    return undefined;
  };

  const updateWorkExperienceField = async (
    index: number,
    field: keyof WorkExperienceItem,
    value: string | Date | null | boolean
  ) => {
    await formik.setFieldValue(`workExperiences[${index}].${field}`, value);
    formik.setFieldTouched(`workExperiences[${index}].${field}`, true);

    if (value && formik.errors.workExperiences?.[index] && typeof formik.errors.workExperiences[index] === "object") {
      const currentErrors = { ...(formik.errors.workExperiences[index] as any) };
      if (currentErrors[field]) {
        delete currentErrors[field];
        const updatedErrors: any[] = [...(formik.errors.workExperiences || [])];
        updatedErrors[index] = Object.keys(currentErrors).length > 0 ? currentErrors : undefined;
        formik.setErrors({
          ...formik.errors,
          workExperiences: updatedErrors as any,
        });
      }
    }

    setTimeout(() => {
      formik.validateField(`workExperiences[${index}].${field}`);
    }, 0);
  };

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
        <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
          {t("applicant.workExperience")}
        </h2>

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
                >
                  {t("common.addMore")}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Added Work Experiences Section */}
        {complete.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
              {t("applicant.addedWorkExperiences")}
            </h2>

            <div className="space-y-4">
              {complete.map((workExperience) => {
                const index = formik.values.workExperiences.findIndex((w) => w.id === workExperience.id);
                const isEditing = editingIndex === index;

                return (
                  <div
                    key={workExperience.id}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
                  >
                    {isEditing ? (
                      <>
                        <WorkExperienceForm
                          workExperience={workExperience}
                          index={index}
                          onFieldChange={updateWorkExperienceField}
                          getFieldError={getFieldError}
                          showCancel={false}
                          showAddMore={false}
                        />
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button
                            type="button"
                            variant="accent"
                            onClick={() => handleSaveWorkExperience(index)}
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
                            {workExperience.companyName} - {workExperience.jobTitle}
                          </p>
                          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                            {workExperience.startDate
                              ? new Date(workExperience.startDate).toLocaleDateString()
                              : ""}
                            {" - "}
                            {workExperience.currentlyWorking
                              ? t("applicant.currentlyWorking")
                              : workExperience.endDate
                              ? new Date(workExperience.endDate).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-end justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<Edit className="h-5 w-5" style={{ color: COLORS.accent }} />}
                            iconOnly
                            onClick={() => handleEditWorkExperience(index)}
                            title={t("common.edit")}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<Trash className="h-5 w-5" style={{ color: COLORS.error }} />}
                            iconOnly
                            onClick={() => handleDeleteWorkExperience(index)}
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

        {/* Show message if no work experiences added */}
        {showWorkExperienceForm && complete.length === 0 && incomplete.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("applicant.noWorkExperiencesAdded")}
            </p>
          </div>
        )}
      </div>

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
        title={t("applicant.deleteWorkExperience", "Delete Work Experience")}
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: COLORS.textMuted }}>
            {t("applicant.deleteWorkExperienceConfirmation", "Are you sure you want to delete this work experience?")} {t("applicant.deleteWarning", "This action cannot be undone.")}
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

export default WorkExperience;
