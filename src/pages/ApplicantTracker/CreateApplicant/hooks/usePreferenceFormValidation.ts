import { useMemo, useCallback } from "react";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import type { PreferenceItem } from "../types";

/**
 * Hook for preference form validation schemas and validation logic
 */
export function usePreferenceFormValidation() {
  const { t, i18n } = useTranslation();

  // Reusable preference validation schema
  const getPreferenceSchema = useCallback(() => {
    return Yup.object().shape({
      enrollmentType: Yup.string().required(t("validation.enrollmentTypeRequired")),
      desiredCountry: Yup.string().required(t("validation.countryRequired")),
      program: Yup.string().required(t("validation.programRequired")),
      desiredUniversity: Yup.string().required(t("validation.universityRequired")),
      desiredCampus: Yup.string().required(t("validation.campusRequired")),
      course: Yup.string().required(t("validation.courseRequired")),
      desiredIntake: Yup.string().required(t("validation.intakeRequired")),
      assignCounselor: Yup.string().nullable(),
      agencyPartnerName: Yup.string()
        .nullable()
        .when("enrollmentType", {
          is: (enrollmentType: string) =>
            enrollmentType === "REFERRED_BY_AGENCY_PARTNER" || enrollmentType === "REFERRED_TO_AGENCY_PARTNER",
          then: (schema) => schema.required(t("validation.agencyPartnerRequired", "Agency Partner Name is required")),
          otherwise: (schema) => schema.nullable(),
        }),
    });
  }, [t, i18n.language]);

  // Validation schema using Yup with i18n messages
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        preferences: Yup.array().of(getPreferenceSchema()),
      }),
    [getPreferenceSchema]
  );

  // Check if a preference is complete
  const isPreferenceComplete = useCallback((pref: PreferenceItem): boolean => {
    return !!(
      pref.enrollmentType &&
      pref.enrollmentType !== "" &&
      pref.desiredCountry &&
      pref.desiredCountry !== "" &&
      pref.program &&
      pref.program !== "" &&
      pref.desiredUniversity &&
      pref.desiredUniversity !== "" &&
      pref.desiredCampus &&
      pref.desiredCampus !== "" &&
      pref.course &&
      pref.course !== "" &&
      pref.desiredIntake &&
      pref.desiredIntake !== ""
    );
  }, []);

  return {
    getPreferenceSchema,
    validationSchema,
    isPreferenceComplete,
  };
}

