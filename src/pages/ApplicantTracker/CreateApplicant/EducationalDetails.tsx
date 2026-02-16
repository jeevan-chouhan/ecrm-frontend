import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Input, Select, DatePicker, Button } from "../../../components";
import { COLORS } from "../../../constants";
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
  const hasEducationalDetailsDataRef = useRef<boolean>(false); // Track if educational details data exists (for POST vs PUT)
  const isFetchingHighestQualificationsRef = useRef(false); // Prevent duplicate fetches for highest qualifications
  const isFetchingScoreTypesRef = useRef(false); // Prevent duplicate fetches for score types
  const highestQualificationIdMapRef = useRef<Map<string, number>>(new Map()); // Map code to ID for highest qualifications
  const highestQualificationIsMajorMapRef = useRef<Map<string, boolean>>(new Map()); // Map code to isMajor for highest qualifications
  const scoreTypeIdMapRef = useRef<Map<string, number>>(new Map()); // Map code to ID for score types
  const [isSaving, setIsSaving] = useState(false);
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);
  const [qualificationOptions, setQualificationOptions] = useState<SelectOption[]>([]);
  const [scoreTypeOptions, setScoreTypeOptions] = useState<SelectOption[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [qualificationMapUpdated, setQualificationMapUpdated] = useState(0); // Track map updates to trigger showMajor recalculation

  // Helper function to create educational detail validation schema
  const getEducationalDetailSchema = useCallback(() => {
    return Yup.object().shape({
      highestQualification: Yup.string().required(t("validation.highestQualificationRequired")),
      institutionName: Yup.string().required(t("validation.institutionNameRequired")).trim(),
      boardUniversity: Yup.string().required(t("validation.boardUniversityRequired")).trim(),
      program: Yup.string(),
      major: Yup.string().when("highestQualification", {
        is: (val: string) => {
          // Check if the selected qualification has isMajor true
          const isMajor = highestQualificationIsMajorMapRef.current.get(val || "");
          return isMajor === true;
        },
        then: (schema) => schema.required(t("validation.majorRequired", "Major field is required")), // Required when isMajor is true
        otherwise: (schema) => schema.nullable(), // Optional when isMajor is false or null
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

        // Get IDs from code-to-ID mappings
        const highestQualificationId = highestQualificationIdMapRef.current.get(values.highestQualification);
        const scoreTypeId = scoreTypeIdMapRef.current.get(values.scoreType);

        // Validate that IDs exist
        if (!highestQualificationId) {
          throw new Error("Invalid highest qualification selected");
        }
        if (!scoreTypeId) {
          throw new Error("Invalid score type selected");
        }

        // Check if the selected qualification has isMajor true
        // If isMajor is false, reset major field to null in the payload
        const isMajor = highestQualificationIsMajorMapRef.current.get(values.highestQualification);
        const majorValue = isMajor === true ? (values.major || null) : null;

        // Map form fields to API payload format
        const payload = {
          applicantId: typeof applicantId === 'string' ? parseInt(applicantId) : applicantId,
          highestQualificationId: highestQualificationId,
          instituteName: values.institutionName, // Map institutionName -> instituteName
          universityName: values.boardUniversity, // Map boardUniversity -> universityName
          courseType: values.program || null, // Map program -> courseType
          fieldType: majorValue, // Map major -> fieldType (null if isMajor is false)
          scoreTypeId: scoreTypeId,
          score: values.score,
          passingYear: passingYearFormatted,
        };

        // Call appropriate API based on whether data exists
        // If data exists (hasEducationalDetailsDataRef), call PUT API; otherwise call POST API
        let response;
        if (hasEducationalDetailsDataRef.current) {
          // Data exists - update existing educational details using PUT
          response = await applicantService.updateEducationalDetails(payload);
        } else {
          // No data exists - create new educational details using POST
          response = await applicantService.createEducationalDetails(payload);
          
          // After successful creation, mark that data now exists and store ID if available
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

  // Check form validity - memoized to avoid unnecessary recalculations
  const isFormValidMemo = useMemo(() => {
    return (
      formik.values.highestQualification.trim() !== "" &&
      formik.values.institutionName.trim() !== "" &&
      formik.values.boardUniversity.trim() !== "" &&
      formik.values.scoreType.trim() !== "" &&
      formik.values.score.trim() !== "" &&
      formik.values.passingYear !== null
    );
  }, [
    formik.values.highestQualification,
    formik.values.institutionName,
    formik.values.boardUniversity,
    formik.values.scoreType,
    formik.values.score,
    formik.values.passingYear,
  ]);

  // Sync memoized validity to state
  useEffect(() => {
    setIsFormValid(isFormValidMemo);
  }, [isFormValidMemo]);

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

  const handleSave = useCallback(async () => {
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
  }, [isSaving, validateAndMarkTouched, formik, dispatch, t]);

  const handleSaveAndNextClick = useCallback(async () => {
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
  }, [isSaving, validateAndMarkTouched, formik, dispatch, t]);

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
        if (data && (data.highestQualificationCode || data.instituteName || data.universityName)) {
          // Get isMajor from GET response
          const qualificationCode = data.highestQualificationCode || "";
          const isMajor = data.isMajor === true;
          
          // Update the map with the value from GET response for future reference
          if (data.isMajor !== undefined && data.isMajor !== null) {
            highestQualificationIsMajorMapRef.current.set(qualificationCode, isMajor);
            // Trigger recalculation of showMajor by updating state
            setQualificationMapUpdated(prev => prev + 1);
          }
          
          // Map API response to EducationalDetailFormData
          // Use codes from API response (highestQualificationCode, scoreTypeCode) for form values
          const educationalDetails: EducationalDetailFormData = {
            highestQualification: qualificationCode,
            institutionName: data.instituteName || "", // Map instituteName -> institutionName
            boardUniversity: data.universityName || "", // Map universityName -> boardUniversity
            program: data.courseType || "", // Map courseType -> program
            // Only populate major if isMajor is true, otherwise clear it
            major: isMajor === true ? (data.fieldType || "") : "",
            scoreType: data.scoreTypeCode || "",
            score: data.score || "",
            passingYear: data.passingYear ? new Date(data.passingYear + "T00:00:00") : null, // Add time to avoid timezone issues
          };

          // Update form state with fetched data
          formik.setValues(educationalDetails, false);
          onUpdate(educationalDetails);
          markAsSaved(educationalDetails);
          
          // Store the ID if it exists and mark that data exists
          educationalDetailsIdRef.current = educationalDetailsId;
          hasEducationalDetailsDataRef.current = true; // Data exists, will use PUT
        } else {
          // Data is empty/null - no ID, will use POST
          educationalDetailsIdRef.current = null;
          hasEducationalDetailsDataRef.current = false; // No data exists, will use POST
        }
      } else {
        // No educational details found or empty response - will use POST
        educationalDetailsIdRef.current = null;
        hasEducationalDetailsDataRef.current = false; // No data exists, will use POST
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch educational details");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isFetchingEducationalDetailsRef.current = false;
      dispatch(hideLoader());
    }
  }, [dispatch, formik, onUpdate, markAsSaved]);

  // Fetch highest qualifications from API
  const fetchHighestQualifications = useCallback(async () => {
    if (isFetchingHighestQualificationsRef.current) {
      return;
    }

    isFetchingHighestQualificationsRef.current = true;

    try {
      const highestQualifications = await applicantService.getHighestQualifications();
      
      // Convert to SelectOption format, filter by isActive and sort by sortOrder
      const options: SelectOption[] = highestQualifications
        .filter((qualification) => qualification.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((qualification) => ({
          value: qualification.code,
          label: qualification.name,
        }));

      // Create mapping from code to ID for API conversion
      const idMap = new Map<string, number>();
      const isMajorMap = new Map<string, boolean>();
      highestQualifications
        .filter((qualification) => qualification.isActive)
        .forEach((qualification) => {
          idMap.set(qualification.code, qualification.id);
          // Store isMajor value (convert null to false for easier checking)
          isMajorMap.set(qualification.code, qualification.isMajor === true);
        });
      highestQualificationIdMapRef.current = idMap;
      highestQualificationIsMajorMapRef.current = isMajorMap;
      // Trigger recalculation of showMajor when qualifications are loaded
      setQualificationMapUpdated(prev => prev + 1);

      setQualificationOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch highest qualifications");
      dispatch(addToast({ type: "error", message }));
      setQualificationOptions([]);
    } finally {
      isFetchingHighestQualificationsRef.current = false;
    }
  }, [dispatch]);

  // Fetch score types from API
  const fetchScoreTypes = useCallback(async () => {
    if (isFetchingScoreTypesRef.current) {
      return;
    }

    isFetchingScoreTypesRef.current = true;

    try {
      const scoreTypes = await applicantService.getScoreTypes();
      
      // Convert to SelectOption format, filter by isActive and sort by sortOrder
      const options: SelectOption[] = scoreTypes
        .filter((scoreType) => scoreType.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((scoreType) => ({
          value: scoreType.code,
          label: scoreType.name,
        }));

      // Create mapping from code to ID for API conversion
      const idMap = new Map<string, number>();
      scoreTypes
        .filter((scoreType) => scoreType.isActive)
        .forEach((scoreType) => {
          idMap.set(scoreType.code, scoreType.id);
        });
      scoreTypeIdMapRef.current = idMap;

      setScoreTypeOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch score types");
      dispatch(addToast({ type: "error", message }));
      setScoreTypeOptions([]);
    } finally {
      isFetchingScoreTypesRef.current = false;
    }
  }, [dispatch]);

  // Fetch highest qualifications on mount
  useEffect(() => {
    fetchHighestQualifications();
    fetchScoreTypes();
  }, [fetchHighestQualifications, fetchScoreTypes]);

  // Fetch educational details when applicantId is available
  useEffect(() => {
    if (applicantId && !isFetchingEducationalDetailsRef.current) {
      fetchEducationalDetails(applicantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]); // Only depend on applicantId to avoid infinite loops

  // Re-process educational details when qualifications are loaded (to handle isMajor correctly)
  // This ensures that if educational details were fetched before qualifications, we can now properly handle isMajor
  useEffect(() => {
    if (
      applicantId &&
      hasEducationalDetailsDataRef.current &&
      qualificationOptions.length > 0 &&
      formik.values.highestQualification
    ) {
      // Check if the current qualification has isMajor false, and if so, clear major field
      const isMajor = highestQualificationIsMajorMapRef.current.get(formik.values.highestQualification);
      if (isMajor !== true && formik.values.major) {
        formik.setFieldValue("major", "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualificationOptions.length, applicantId]);

  // Show Major field based on isMajor value from selected qualification
  const showMajor = useMemo(() => {
    if (!formik.values.highestQualification) {
      return false;
    }
    const isMajor = highestQualificationIsMajorMapRef.current.get(formik.values.highestQualification);
    return isMajor === true;
  }, [formik.values.highestQualification, qualificationMapUpdated]); // Include qualificationMapUpdated to recalculate when map is updated

  // Clear major field when qualification changes and isMajor becomes false
  useEffect(() => {
    if (formik.values.highestQualification) {
      const isMajor = highestQualificationIsMajorMapRef.current.get(formik.values.highestQualification);
      if (isMajor !== true && formik.values.major) {
        formik.setFieldValue("major", "");
      }
    }
  }, [formik.values.highestQualification, formik]);

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
                    {t("applicant.major")} <span style={{ color: COLORS.error }}>*</span>
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
