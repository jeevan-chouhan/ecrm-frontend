import { useMemo, useCallback, useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Input, Select, DatePicker, Button } from "../../../components";
import { COLORS, highestQualifications, scoreTypes } from "../../../constants";
import type { SelectOption } from "../../../components";
import { REGEX } from "../../../utils/regex";
import type { EducationalDetailFormData } from "./types";
import { useDataChangeTracking, useFormSync, useFormValidation } from "./hooks";

interface EducationalDetailsProps {
  initialValues: EducationalDetailFormData;
  onUpdate: (data: EducationalDetailFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
}

const EducationalDetails = ({ initialValues, onUpdate, onSaveAndNext, onBack }: EducationalDetailsProps) => {
  const { t } = useTranslation();

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
        is: (val: string) => val === "high-school",
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
      try {
        const payload = {
          highestQualification: values.highestQualification,
          institutionName: values.institutionName,
          boardUniversity: values.boardUniversity,
          program: values.program || null,
          major: values.major || null,
          scoreType: values.scoreType,
          score: values.score,
          passingYear: values.passingYear ? values.passingYear.toISOString() : null,
        };

        // TODO: Replace with actual API endpoint
        // const response = await fetch("/api/applicant/educational-details", {
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
            console.log("API endpoint: POST /api/applicant/educational-details");
          }
          
          // Mark data as saved
          markAsSaved(values);
        } else {
          if (import.meta.env.DEV) {
            console.log("No changes detected. Skipping API call.");
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error saving educational details:", error);
        }
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

  const handleSave = () => {
    formik.handleSubmit();
  };

  const handleSaveAndNextClick = async () => {
    const isValid = await validateAndMarkTouched();
    if (!isValid) {
      return;
    }

    await formik.submitForm();
    if (onSaveAndNext) {
      onSaveAndNext();
    }
  };

  // Show Major field for all qualification types except High School
  const showMajor = formik.values.highestQualification !== "high-school";

  return (
    <div className="space-y-6">
      <div>

        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                    style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
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

          <div className="flex justify-between gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
            <div>
              {onBack && (
                <Button type="button" variant="cancel" onClick={onBack} rounded>
                  {t("common.back")}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="accent" onClick={handleSave} rounded>
                {t("applicant.save")}
              </Button>
              <Button 
                type="button" 
                variant="accent" 
                onClick={handleSaveAndNextClick}
                disabled={!isFormValid}
                rounded
              >
                {t("applicant.saveAndNext")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EducationalDetails;
