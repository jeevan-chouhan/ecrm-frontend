import { useMemo, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Input, Select, DatePicker, Button } from "../../../components";
import { COLORS, highestQualifications, scoreTypes } from "../../../constants";
import type { SelectOption } from "../../../components";
import { REGEX } from "../../../utils/regex";

export interface EducationalDetailFormData {
  highestQualification: string;
  institutionName: string;
  boardUniversity: string;
  program: string;
  major: string;
  scoreType: string;
  score: string;
  passingYear: Date | null;
}

const EducationalDetails = ({ onSaveAndNext }: { onSaveAndNext?: () => void }) => {
  const { t } = useTranslation();

  const qualificationOptions: SelectOption[] = highestQualifications;
  const scoreTypeOptions: SelectOption[] = scoreTypes;

  // Helper function to create educational detail validation schema
  const getEducationalDetailSchema = useCallback(() => {
    return Yup.object().shape({
      highestQualification: Yup.string().required(t("validation.highestQualificationRequired")),
      institutionName: Yup.string().required(t("validation.institutionNameRequired")).trim(),
      boardUniversity: Yup.string().required(t("validation.boardUniversityRequired")).trim(),
      program: Yup.string(),
      major: Yup.string().when("highestQualification", {
        is: (val: string) => val === "ug" || val === "pg",
        then: (schema) => schema.required(t("validation.majorRequired")),
        otherwise: (schema) => schema,
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
    initialValues: {
      highestQualification: "",
      institutionName: "",
      boardUniversity: "",
      program: "",
      major: "",
      scoreType: "",
      score: "",
      passingYear: null,
    },
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

        console.log("Payload ready for API:", payload);
      } catch (error) {
        console.error("Error saving educational details:", error);
      }
    },
  });

  const handleSave = () => {
    formik.handleSubmit();
  };

  const handleSaveAndNextClick = async () => {
    const isValid = await formik.validateForm();
    if (!isValid || Object.keys(formik.errors).length > 0) {
      // Mark all fields as touched to show errors
      const touchedFields: any = {};
      Object.keys(formik.values).forEach((key) => {
        touchedFields[key] = true;
      });
      formik.setTouched(touchedFields);
      return;
    }

    await formik.submitForm();
    if (onSaveAndNext) {
      onSaveAndNext();
    }
  };

  const showMajor = formik.values.highestQualification === "ug" || formik.values.highestQualification === "pg";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
          {t("applicant.educationalDetails")}
        </h2>

        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <Select
                  label={t("applicant.highestQualification")}
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

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
            <Button type="button" variant="accent" onClick={handleSave}>
              {t("applicant.save")}
            </Button>
            <Button type="button" variant="accent" onClick={handleSaveAndNextClick}>
              {t("applicant.saveAndNext")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EducationalDetails;
