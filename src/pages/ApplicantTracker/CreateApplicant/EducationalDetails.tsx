import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Input, Select, DatePicker, Button } from "../../../components";
import { COLORS, highestQualifications, scoreTypes } from "../../../constants";
import type { SelectOption } from "../../../components";
import { REGEX } from "../../../utils/regex";
import type { EducationalDetailFormData } from "./types";
import { useDataChangeTracking, useFormSync, useFormValidation } from "./hooks";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

interface EducationalDetailsProps {
  initialValues: EducationalDetailFormData;
  onUpdate: (data: EducationalDetailFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
  applicantId?: number | string | null;
}

const EducationalDetails = ({ initialValues, onUpdate, onSaveAndNext, onBack, applicantId }: EducationalDetailsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions
  const isFetchingEducationalDetailsRef = useRef(false); // Prevent duplicate fetches
  const educationalDetailsIdRef = useRef<number | string | null>(null); // Track educational details ID (for POST vs PUT)
  const [isSaving, setIsSaving] = useState(false);
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);

  const qualificationOptions: SelectOption[] = highestQualifications;
  const scoreTypeOptions: SelectOption[] = scoreTypes;
  const [isFormValid, setIsFormValid] = useState(false);

  // Helper function to create educational detail validation schema
  const getEducationalDetailSchema = useCallback(() => {
    return Yup.object().shape({
      highestQualification: Yup.string().required(t("validation.highestQualificationRequired")),
      institutionName: Yup.string().required(t("validation.institutionNameRequired")).trim(),
      boardUniversity: Yup.string().required(t("validation.boardUniversityRequired")).trim(),
      program: Yup.string(),
      major: Yup.string().when("highestQualification", {
        is: (val: string) => val === "HIGH_SCHOOL",
        then: (schema) => schema.nullable(), // Optional when High School is selected (field is hidden)
        otherwise: (schema) => schema.nullable(), // Optional for other qualifications
      }),
      scoreType: Yup.string().required(t("validation.scoreTypeRequired")),
      score: Yup.string()
        .required(t("validation.scoreRequired"))
        .matches(REGEX.SCORE, t("validation.invalidScore")),
      passingYear: Yup.date().nullable().required(t("validation.passingYearRequired")),
    });
  }, [t]);

  // Validation schema using Yup with i18n messages
  const validationSchema = useMemo(
    () => getEducationalDetailSchema(),
    [getEducationalDetailSchema]
  );

  const formik = useFormik<EducationalDetailFormData>({
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

      // Check if data has changed - skip API call if no changes
      if (!hasDataChanged) {
        if (import.meta.env.DEV) {
          console.log("No changes detected. Skipping API call.");
        }
        
        // Mark data as saved
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
        // Format passingYear as YYYY-MM-DD
        const passingYearFormatted = values.passingYear 
          ? values.passingYear.toISOString().split('T')[0]
          : "";

        // Map form fields to API payload format
        const payload = {
          applicantId: typeof applicantId === 'string' ? parseInt(applicantId) : applicantId,
          highestQualification: values.highestQualification,
          instituteName: values.institutionName, // Map institutionName -> instituteName
          universityName: values.boardUniversity, // Map boardUniversity -> universityName
          courseType: values.program || null, // Map program -> courseType
          fieldType: values.major || null, // Map major -> fieldType
          scoreType: values.scoreType,
          score: values.score,
          passingYear: passingYearFormatted,
        };

        // Call appropriate API based on whether ID exists
        // If ID is present, call PUT API; if data is empty/null or no ID, call POST API
        let response;
        if (educationalDetailsIdRef.current) {
          // ID is present - update existing educational details using PUT
          response = await applicantService.updateEducationalDetails(payload);
        } else {
          // No ID or data is empty/null - create new educational details using POST
          response = await applicantService.createEducationalDetails(payload);
          
          // After successful creation, check if response contains an ID and store it
          if (response.status === "success" && response.data) {
            const responseId = (response.data as any).id || (response.data as any).educationalDetailsId || null;
            if (responseId) {
              educationalDetailsIdRef.current = responseId;
            }
          }
        }

        if (response.status === "success") {
          // Mark data as saved
          markAsSaved(values);

          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: response.message || t("applicant.educationalDetailsSaved", "Educational details saved successfully"),
            })
          );

          // Navigate to next tab if "Save & Next" was clicked
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
        } else {
          throw new Error(response.message || "Failed to save educational details");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save educational details");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    },
  });

  // Use reusable hook for data change tracking
  const { hasDataChanged, markAsSaved } = useDataChangeTracking<EducationalDetailFormData>(
    formik.values,
    (lastSaved, current) => {
      if (!lastSaved) return true;
      
      // Compare passingYear by timestamp instead of reference
      const passingYearChanged = 
        (lastSaved.passingYear === null && current.passingYear !== null) ||
        (lastSaved.passingYear !== null && current.passingYear === null) ||
        (lastSaved.passingYear !== null && current.passingYear !== null &&
         lastSaved.passingYear.getTime() !== current.passingYear.getTime());
      
      return (
        lastSaved.highestQualification !== current.highestQualification ||
        lastSaved.institutionName !== current.institutionName ||
        lastSaved.boardUniversity !== current.boardUniversity ||
        lastSaved.program !== current.program ||
        lastSaved.major !== current.major ||
        lastSaved.scoreType !== current.scoreType ||
        lastSaved.score !== current.score ||
        passingYearChanged
      );
    }
  );

  // Use reusable hook for form validation
  const { validateAndMarkTouched } = useFormValidation(formik);

  // Check form validity
  useEffect(() => {
    const hasAllMandatoryFields = 
      formik.values.highestQualification.trim() !== "" &&
      formik.values.institutionName.trim() !== "" &&
      formik.values.boardUniversity.trim() !== "" &&
      formik.values.scoreType.trim() !== "" &&
      formik.values.score.trim() !== "" &&
      formik.values.passingYear !== null;
    
    setIsFormValid(hasAllMandatoryFields);
  }, [formik.values.highestQualification, formik.values.institutionName, formik.values.boardUniversity, formik.values.scoreType, formik.values.score, formik.values.passingYear]);

  // Sync formik values to parent state with optimized comparison
  useFormSync<EducationalDetailFormData>(
    formik.values,
    onUpdate,
    (prev, current) => {
      // Compare passingYear by timestamp instead of reference
      const passingYearChanged = 
        (prev.passingYear === null && current.passingYear !== null) ||
        (prev.passingYear !== null && current.passingYear === null) ||
        (prev.passingYear !== null && current.passingYear !== null &&
         prev.passingYear.getTime() !== current.passingYear.getTime());
      
      return (
        prev.highestQualification !== current.highestQualification ||
        prev.institutionName !== current.institutionName ||
        prev.boardUniversity !== current.boardUniversity ||
        prev.program !== current.program ||
        prev.major !== current.major ||
        prev.scoreType !== current.scoreType ||
        prev.score !== current.score ||
        passingYearChanged
      );
    }
  );

  const handleSave = async () => {
    // Prevent duplicate calls
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    setShouldNavigateNext(false);
    const isValid = await validateAndMarkTouched();
    if (isValid) {
      await formik.submitForm();
    } else {
      dispatch(
        addToast({
          type: "error",
          message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
        })
      );
    }
  };

  const handleSaveAndNextClick = async () => {
    // Prevent duplicate calls
    if (isSubmittingRef.current || isSaving) {
      return;
    }

    const isValid = await validateAndMarkTouched();
    if (!isValid) {
      dispatch(
        addToast({
          type: "error",
          message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
        })
      );
      return;
    }

    setShouldNavigateNext(true);
    await formik.submitForm();
  };

  // Fetch educational details when applicantId is available (edit mode or back navigation)
  const fetchEducationalDetails = useCallback(async (id: number | string) => {
    if (isFetchingEducationalDetailsRef.current) {
      return;
    }

    isFetchingEducationalDetailsRef.current = true;
    dispatch(showLoader());

    try {
      const response = await applicantService.getEducationalDetails(id);

      if (response.status === "success" && response.data) {
        const data = response.data;
        
        // Check if data exists and has an ID (check for common ID field names)
        const educationalDetailsId = (data as any).id || (data as any).educationalDetailsId || null;
        
        // Only proceed if data is not empty/null
        if (data && (data.highestQualification || data.instituteName || data.universityName)) {
          // Map API response to EducationalDetailFormData
          const educationalDetails: EducationalDetailFormData = {
            highestQualification: data.highestQualification || "",
            institutionName: data.instituteName || "", // Map instituteName -> institutionName
            boardUniversity: data.universityName || "", // Map universityName -> boardUniversity
            program: data.courseType || "", // Map courseType -> program
            major: data.fieldType || "", // Map fieldType -> major
            scoreType: data.scoreType || "",
            score: data.score || "",
            passingYear: data.passingYear ? new Date(data.passingYear + "T00:00:00") : null, // Add time to avoid timezone issues
          };

          // Update form state with fetched data
          formik.setValues(educationalDetails, false);
          onUpdate(educationalDetails);
          markAsSaved(educationalDetails);
          
          // Store the ID if it exists
          educationalDetailsIdRef.current = educationalDetailsId;
        } else {
          // Data is empty/null - no ID, will use POST
          educationalDetailsIdRef.current = null;
        }
      } else {
        // No educational details found or empty response - will use POST
        educationalDetailsIdRef.current = null;
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch educational details");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isFetchingEducationalDetailsRef.current = false;
      dispatch(hideLoader());
    }
  }, [dispatch, formik, onUpdate, markAsSaved]);

  // Fetch educational details when applicantId is available
  useEffect(() => {
    if (applicantId && !isFetchingEducationalDetailsRef.current) {
      fetchEducationalDetails(applicantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]); // Only depend on applicantId to avoid infinite loops

  // Show Major field for all qualification types except High School
  const showMajor = formik.values.highestQualification !== "HIGH_SCHOOL";

  return (
    <div className="space-y-6">
      <div>

        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.highestQualification")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Select
                  options={qualificationOptions}
                  value={formik.values.highestQualification}
                  onChange={(value) => formik.setFieldValue("highestQualification", value)}
                  placeholder={t("applicant.selectHighestQualification")}
                  error={formik.touched.highestQualification && formik.errors.highestQualification ? formik.errors.highestQualification : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.institutionName")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Input
                  value={formik.values.institutionName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="institutionName"
                  placeholder={t("applicant.enterInstitutionName")}
                  error={formik.touched.institutionName && formik.errors.institutionName ? formik.errors.institutionName : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.boardUniversity")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Input
                  value={formik.values.boardUniversity}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  name="boardUniversity"
                  placeholder={t("applicant.enterBoardUniversity")}
                  error={formik.touched.boardUniversity && formik.errors.boardUniversity ? formik.errors.boardUniversity : undefined}
                  fullWidth
                />
              </div>
            </div>

            <div className={`grid grid-cols-1 ${showMajor ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4`}>
              <div className="w-full">
                <Input
                  label={t("applicant.program")}
                  name="program"
                  value={formik.values.program}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={t("applicant.enterProgram")}
                  fullWidth
                />
              </div>

              {showMajor && (
                <div className="w-full">
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: COLORS.textDark,  }}
                  >
                    {t("applicant.major")}
                  </label>
                  <Input
                    value={formik.values.major}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    name="major"
                    placeholder={t("applicant.enterMajor")}
                    error={formik.touched.major && formik.errors.major ? formik.errors.major : undefined}
                    fullWidth
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.scoreType")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Select
                  options={scoreTypeOptions}
                  value={formik.values.scoreType}
                  onChange={(value) => formik.setFieldValue("scoreType", value)}
                  placeholder={t("applicant.selectScoreType")}
                  error={formik.touched.scoreType && formik.errors.scoreType ? formik.errors.scoreType : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.score")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <Input
                  type="text"
                  name="score"
                  value={formik.values.score}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={t("applicant.enterScore")}
                  error={formik.touched.score && formik.errors.score ? formik.errors.score : undefined}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark,  }}
                >
                  {t("applicant.passingYear")} <span style={{ color: COLORS.error }}>*</span>
                </label>
                <DatePicker
                  value={formik.values.passingYear}
                  onChange={(date) => formik.setFieldValue("passingYear", date)}
                  placeholder={t("applicant.selectPassingYear")}
                  error={formik.touched.passingYear && formik.errors.passingYear ? formik.errors.passingYear : undefined}
                  fullWidth
                />
              </div>
            </div>
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
        </form>
      </div>
    </div>
  );
};

export default EducationalDetails;
