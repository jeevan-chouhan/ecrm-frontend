import { useCallback } from "react";
import type { PreferenceItem } from "../types";
import type { FormikProps } from "formik";
import type { ApplicationPreferencesFormData } from "../types";

interface UsePreferenceFieldUpdatesProps {
  formik: FormikProps<ApplicationPreferencesFormData>;
  user: { agencyId?: number | null } | null;
  fetchUniversities: (countryId: number | string | null) => Promise<void>;
  fetchCampuses: (universityId: number | string | null) => Promise<void>;
  fetchCourses: (campusId: number | string | null, program: string | null) => Promise<void>;
  fetchCounselorsByCountry: (countryId: number | string | null) => Promise<void>;
  setSelectedCountryId: (id: number | string | null) => void;
  setSelectedUniversityId: (id: number | string | null) => void;
  isUpdatingCourseFromProgramRef: React.MutableRefObject<Map<number, string>>;
  baseUpdatePreferenceField: (index: number, field: keyof PreferenceItem, value: string) => Promise<void>;
}

/**
 * Hook for handling preference field updates with dependent dropdown logic
 */
export function usePreferenceFieldUpdates({
  formik,
  user,
  fetchUniversities,
  fetchCampuses,
  fetchCourses,
  fetchCounselorsByCountry,
  setSelectedCountryId,
  setSelectedUniversityId,
  isUpdatingCourseFromProgramRef,
  baseUpdatePreferenceField,
}: UsePreferenceFieldUpdatesProps) {
  // Enhanced updatePreferenceField that handles dependent dropdowns
  const updatePreferenceField = useCallback(
    async (index: number, field: keyof PreferenceItem, value: string) => {
      // Get current preference BEFORE any updates
      const currentPreference = formik.values.preferences[index];

      // Special handling for program field - check guard BEFORE updating
      if (field === "program") {
        // Check if we're already processing this program change for this preference
        const currentProcessingProgram = isUpdatingCourseFromProgramRef.current.get(index);
        
        if (currentProcessingProgram === value) {
          // Already processing this exact program value, skip entirely
          return;
        }

        // If program is being cleared, handle it first
        if (!value) {
          isUpdatingCourseFromProgramRef.current.delete(index);
          await baseUpdatePreferenceField(index, field, value);
          formik.setFieldValue(`preferences[${index}].course`, "", false);
          formik.setFieldValue(`preferences[${index}].courseName`, "", false);
          return;
        }

        // Mark that we're processing this program change BEFORE any updates
        isUpdatingCourseFromProgramRef.current.set(index, value);

        // Now update the program field
        // Use validate: false to prevent triggering validation loops
        await baseUpdatePreferenceField(index, field, value);
        
        // Small delay to let Formik state settle before proceeding
        await new Promise(resolve => setTimeout(resolve, 0));

        // Fetch courses if campus is already selected
        if (currentPreference.desiredCampus) {
          const campusIdNum = parseInt(currentPreference.desiredCampus);
          
          if (!isNaN(campusIdNum) && user?.agencyId) {
            // Clear course fields first (non-blocking)
            formik.setFieldValue(`preferences[${index}].course`, "", false);
            formik.setFieldValue(`preferences[${index}].courseName`, "", false);

            // Fetch courses (non-blocking)
            fetchCourses(campusIdNum, value)
              .then(() => {
                // Reset the guard after a delay to ensure all state updates are flushed
                // This prevents the guard from being cleared too early and allowing duplicate calls
                setTimeout(() => {
                  isUpdatingCourseFromProgramRef.current.delete(index);
                }, 1000);
              })
              .catch((_error) => {
                // Reset guard on error too
                setTimeout(() => {
                  isUpdatingCourseFromProgramRef.current.delete(index);
                }, 1000);
              });
          } else {
            // No campus selected, reset guard immediately
            setTimeout(() => {
              isUpdatingCourseFromProgramRef.current.delete(index);
            }, 100);
          }
        } else {
          // No campus selected, reset guard immediately
          setTimeout(() => {
            isUpdatingCourseFromProgramRef.current.delete(index);
          }, 100);
        }
        return; // Early return to prevent other field handlers
      }

      // For all other fields, call base update first
      await baseUpdatePreferenceField(index, field, value);

      // Get updated preference after base update
      const updatedPreference = formik.values.preferences[index];

      // If country changed, fetch universities and counselors for that country
      if (field === "desiredCountry") {
        if (value) {
          const countryIdNum = parseInt(value);
          if (!isNaN(countryIdNum) && user?.agencyId) {
            setSelectedCountryId(countryIdNum);
            await fetchUniversities(countryIdNum);
            await fetchCounselorsByCountry(countryIdNum);

            // Clear dependent fields
            await formik.setFieldValue(`preferences[${index}].desiredUniversity`, "", false);
            await formik.setFieldValue(`preferences[${index}].desiredCampus`, "", false);
            await formik.setFieldValue(`preferences[${index}].course`, "", false);
            await formik.setFieldValue(`preferences[${index}].courseName`, "", false);
            await formik.setFieldValue(`preferences[${index}].assignCounselor`, "", false);
          }
        } else {
          setSelectedCountryId(null);
          await formik.setFieldValue(`preferences[${index}].desiredUniversity`, "", false);
          await formik.setFieldValue(`preferences[${index}].desiredCampus`, "", false);
          await formik.setFieldValue(`preferences[${index}].course`, "", false);
          await formik.setFieldValue(`preferences[${index}].courseName`, "", false);
          await formik.setFieldValue(`preferences[${index}].assignCounselor`, "", false);
        }
        return;
      }

      // If university changed, fetch campuses for that university
      if (field === "desiredUniversity") {
        if (value) {
          const universityIdNum = parseInt(value);
          if (!isNaN(universityIdNum) && user?.agencyId) {
            setSelectedUniversityId(universityIdNum);
            await fetchCampuses(universityIdNum);

            // Clear dependent fields
            await formik.setFieldValue(`preferences[${index}].desiredCampus`, "", false);
            await formik.setFieldValue(`preferences[${index}].course`, "", false);
            await formik.setFieldValue(`preferences[${index}].courseName`, "", false);
          }
        } else {
          setSelectedUniversityId(null);
          await formik.setFieldValue(`preferences[${index}].desiredCampus`, "", false);
          await formik.setFieldValue(`preferences[${index}].course`, "", false);
          await formik.setFieldValue(`preferences[${index}].courseName`, "", false);
        }
        return;
      }

      // If campus changed, fetch courses if program is already selected
      if (field === "desiredCampus") {
        if (value && updatedPreference.program) {
          const campusIdNum = parseInt(value);
          if (!isNaN(campusIdNum) && user?.agencyId) {
            // Check if we're processing a program change - if so, don't fetch here
            const currentProcessingProgram = isUpdatingCourseFromProgramRef.current.get(index);
            if (!currentProcessingProgram) {
              await fetchCourses(campusIdNum, updatedPreference.program);
            }
            // Clear course selection when campus changes
            await formik.setFieldValue(`preferences[${index}].course`, "", false);
            await formik.setFieldValue(`preferences[${index}].courseName`, "", false);
          }
        } else if (!value) {
          await formik.setFieldValue(`preferences[${index}].course`, "", false);
          await formik.setFieldValue(`preferences[${index}].courseName`, "", false);
        }
        return;
      }
    },
    [
      baseUpdatePreferenceField,
      user?.agencyId,
      fetchUniversities,
      fetchCampuses,
      fetchCourses,
      fetchCounselorsByCountry,
      formik,
      setSelectedCountryId,
      setSelectedUniversityId,
      isUpdatingCourseFromProgramRef,
    ]
  );

  return {
    updatePreferenceField,
  };
}

