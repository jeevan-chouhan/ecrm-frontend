import { useCallback } from "react";
import { useAppDispatch } from "../../../../redux/hooks";
import { addToast } from "../../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../../redux/slices/loader/loaderSlice";
import { applicantService } from "../../../../services";
import { handleApiError } from "../../../../utils";
import type { PreferenceItem } from "../types";
import { convertPreferenceToApiFormat, hasPreferenceChanged } from "../utils/preferenceDataTransformers";
import type { FormikProps } from "formik";
import type { ApplicationPreferencesFormData } from "../types";

interface UsePreferenceApiOperationsProps {
  formik: FormikProps<ApplicationPreferencesFormData>;
  applicantId?: number | string | null;
  user: { role?: string; agencyId?: number | null; userId?: number | null; isPrimaryAdmin?: boolean } | null;
  enrollmentTypeIdMapRef: React.MutableRefObject<Map<string, number>>;
  programTypeIdMapRef: React.MutableRefObject<Map<string, number>>;
  originalPreferencesRef: React.MutableRefObject<PreferenceItem[]>;
  preferencesSentToApiRef: React.MutableRefObject<Set<string>>;
  isSubmittingRef: React.MutableRefObject<boolean>;
  isFetchingPreferencesRef: React.MutableRefObject<boolean>;
  hasFetchedPreferencesRef: React.MutableRefObject<boolean>;
  lastFetchedApplicantIdRef: React.MutableRefObject<number | string | null>;
  fetchEnrollmentTypes: () => Promise<void>;
  hasFetchedEnrollmentTypesRef: React.MutableRefObject<boolean>;
  fetchUniversities: (countryId: number | string | null) => Promise<void>;
  fetchCampuses: (universityId: number | string | null) => Promise<void>;
  fetchCourses: (campusId: number | string | null, program: string | null) => Promise<void>;
  fetchCounselorsByCountry: (countryId: number | string | null) => Promise<void>;
  onUpdate: (data: ApplicationPreferencesFormData) => void;
  getEmptyPreference: () => PreferenceItem;
  t: (key: string) => string;
}

/**
 * Hook for all API operations related to preferences
 */
export function usePreferenceApiOperations({
  formik,
  applicantId,
  user,
  enrollmentTypeIdMapRef,
  programTypeIdMapRef,
  originalPreferencesRef,
  preferencesSentToApiRef,
  isSubmittingRef,
  isFetchingPreferencesRef,
  hasFetchedPreferencesRef,
  lastFetchedApplicantIdRef,
  fetchEnrollmentTypes,
  hasFetchedEnrollmentTypesRef,
  fetchUniversities,
  fetchCampuses,
  fetchCourses,
  fetchCounselorsByCountry,
  onUpdate,
  getEmptyPreference,
  t,
}: UsePreferenceApiOperationsProps) {
  const dispatch = useAppDispatch();

  const convertPreferenceToApiFormatWrapper = useCallback(
    (pref: PreferenceItem) => {
      return convertPreferenceToApiFormat(pref, user, enrollmentTypeIdMapRef.current, programTypeIdMapRef.current);
    },
    [user, enrollmentTypeIdMapRef, programTypeIdMapRef]
  );

  // Helper functions for data transformation
  const getId = (value: { id: number; name: string } | number | null | undefined): string => {
    if (!value) return "";
    if (typeof value === "object" && "id" in value) {
      return value.id.toString();
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return "";
  };

  const getName = (value: { id: number; name: string } | number | null | undefined): string => {
    if (typeof value === "object" && value !== null && "name" in value) {
      return value.name;
    }
    return "";
  };

  const getAssignedId = (value: { id: number; name: string } | number | null | undefined): string => {
    if (!value) return "";
    if (typeof value === "object" && "id" in value) {
      return value.id.toString();
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return "";
  };

  // Fetch application preferences from API
  const fetchApplicationPreferences = useCallback(
    async (id: number | string, forceRefresh: boolean = false) => {
      
      if (!id || isFetchingPreferencesRef.current) {
        return;
      }

      if (!hasFetchedEnrollmentTypesRef.current) {
        await fetchEnrollmentTypes();
      }

      // Skip "already fetched" check if forceRefresh is true (e.g., after POST to get latest data)
      if (!forceRefresh && hasFetchedPreferencesRef.current && lastFetchedApplicantIdRef.current?.toString() === id.toString()) {
        return;
      }

      isFetchingPreferencesRef.current = true;
      dispatch(showLoader());

      try {
        const response = await applicantService.getApplicationPreferences(id);

        if (response.status === "success" && response.data) {
          let mappedPreferences: PreferenceItem[] = [];

          if (response.data.length > 0) {
            mappedPreferences = response.data.map((pref, index) => {
              let enrollmentTypeCode = "";
              if (pref.enrollmentType) {
                if (typeof pref.enrollmentType === "object" && pref.enrollmentType !== null && "name" in pref.enrollmentType) {
                  enrollmentTypeCode = pref.enrollmentType.name;
                } else if (typeof pref.enrollmentType === "string") {
                  enrollmentTypeCode = pref.enrollmentType;
                }
              }

              return {
                id: `pref-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
                preferenceId: pref.preferenceId || null,
                enrollmentType: enrollmentTypeCode,
                desiredCountry: getId(pref.desiredCountryId),
                program: pref.desiredProgramType,
                desiredUniversity: getId(pref.desiredUniversityId),
                desiredCampus: getId(pref.desiredCampusId),
                course: getId(pref.desiredCourseId),
                courseName: getName(pref.desiredCourseId),
                desiredIntake: pref.desiredIntake,
                assignCounselor: getAssignedId(pref.assignedCounselor),
                agencyPartnerName: getAssignedId(pref.agencyPartner),
                saved: true,
              };
            });

            // Fetch dependent dropdowns
            const uniqueCountries = new Set<string>();
            const uniqueUniversityCountryPairs = new Set<string>();
            const uniqueCampusUniversityPairs = new Set<string>();
            const uniqueCourseCampusProgramPairs = new Set<string>();

            mappedPreferences.forEach((pref) => {
              if (pref.desiredCountry) uniqueCountries.add(pref.desiredCountry);
              if (pref.desiredCountry && pref.desiredUniversity) {
                uniqueUniversityCountryPairs.add(`${pref.desiredCountry}-${pref.desiredUniversity}`);
              }
              if (pref.desiredUniversity && pref.desiredCampus) {
                uniqueCampusUniversityPairs.add(`${pref.desiredUniversity}-${pref.desiredCampus}`);
              }
              if (pref.desiredCampus && pref.program) {
                uniqueCourseCampusProgramPairs.add(`${pref.desiredCampus}-${pref.program}`);
              }
            });

            for (const countryIdStr of uniqueCountries) {
              const countryId = parseInt(countryIdStr);
              if (!isNaN(countryId) && user?.agencyId) {
                await fetchUniversities(countryId);
                await fetchCounselorsByCountry(countryId);
              }
            }

            for (const pair of uniqueCampusUniversityPairs) {
              const [universityIdStr] = pair.split("-");
              const universityId = parseInt(universityIdStr);
              if (!isNaN(universityId) && user?.agencyId) {
                await fetchCampuses(universityId);
              }
            }

            for (const pair of uniqueCourseCampusProgramPairs) {
              const [campusIdStr, program] = pair.split("-");
              const campusId = parseInt(campusIdStr);
              if (!isNaN(campusId) && program && user?.agencyId) {
                await fetchCourses(campusId, program);
              }
            }
          } else {
            mappedPreferences = [getEmptyPreference()];
          }

          formik.setFieldValue("preferences", mappedPreferences);
          originalPreferencesRef.current = mappedPreferences.map((pref) => ({ ...pref }));

          const getPreferenceHash = (pref: PreferenceItem): string => {
            return `${pref.enrollmentType}|${pref.desiredCountry}|${pref.program}|${pref.desiredUniversity}|${pref.desiredCampus}|${pref.course}|${pref.desiredIntake}|${pref.assignCounselor}|${pref.agencyPartnerName}`;
          };

          mappedPreferences.forEach((pref) => {
            if (pref.preferenceId) {
              const hash = getPreferenceHash(pref);
              preferencesSentToApiRef.current.add(hash);
            }
          });

          hasFetchedPreferencesRef.current = true;
          lastFetchedApplicantIdRef.current = id;
          onUpdate({ preferences: mappedPreferences });
        } else {
          throw new Error(response.message || "Failed to fetch application preferences");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to fetch application preferences");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isFetchingPreferencesRef.current = false;
        dispatch(hideLoader());
      }
    },
    [
      dispatch,
      formik,
      onUpdate,
      user?.agencyId,
      fetchEnrollmentTypes,
      hasFetchedEnrollmentTypesRef,
      fetchUniversities,
      fetchCampuses,
      fetchCourses,
      fetchCounselorsByCountry,
      getEmptyPreference,
      isFetchingPreferencesRef,
      hasFetchedPreferencesRef,
      lastFetchedApplicantIdRef,
      originalPreferencesRef,
      preferencesSentToApiRef,
    ]
  );

  // Update preference via PUT API
  const updatePreference = useCallback(
    async (index: number, preference: PreferenceItem) => {
      if (!preference.preferenceId || !applicantId || isSubmittingRef.current) {
        return;
      }

      const original = originalPreferencesRef.current.find(
        (orig) => orig.preferenceId?.toString() === preference.preferenceId?.toString()
      );

      if (!hasPreferenceChanged(preference, original)) {
        const updatedPreferences = [...formik.values.preferences];
        updatedPreferences[index] = { ...preference, saved: true };
        formik.setFieldValue("preferences", updatedPreferences);
        dispatch(addToast({ type: "success", message: t("applicant.preferenceAlreadySaved") }));
        return;
      }

      isSubmittingRef.current = true;
      dispatch(showLoader());

      try {
        const payload = convertPreferenceToApiFormatWrapper(preference);
        const response = await applicantService.updateApplicationPreference(preference.preferenceId, applicantId, payload);

        if (response.status === "success") {
          const updatedPreferences = [...formik.values.preferences];
          const responseData = response.data;

          if (responseData) {
            let enrollmentTypeCode = preference.enrollmentType;
            if (responseData.enrollmentType) {
              if (typeof responseData.enrollmentType === "object" && responseData.enrollmentType !== null && "name" in responseData.enrollmentType) {
                enrollmentTypeCode = responseData.enrollmentType.name;
              } else if (typeof responseData.enrollmentType === "string") {
                enrollmentTypeCode = responseData.enrollmentType;
              }
            }

            updatedPreferences[index] = {
              ...preference,
              preferenceId: responseData.preferenceId || preference.preferenceId,
              enrollmentType: enrollmentTypeCode,
              desiredCountry: getId(responseData.desiredCountryId),
              program: responseData.desiredProgramType,
              desiredUniversity: getId(responseData.desiredUniversityId),
              desiredCampus: getId(responseData.desiredCampusId),
              course: getId(responseData.desiredCourseId),
              courseName: getName(responseData.desiredCourseId),
              desiredIntake: responseData.desiredIntake,
              assignCounselor: getAssignedId(responseData.assignedCounselor),
              agencyPartnerName: getAssignedId(responseData.agencyPartner),
              saved: true,
            };

            // Update originalPreferencesRef at the correct index
            const originalIndex = originalPreferencesRef.current.findIndex(
              (orig) => orig.preferenceId?.toString() === preference.preferenceId?.toString()
            );
            if (originalIndex >= 0) {
              originalPreferencesRef.current[originalIndex] = { ...updatedPreferences[index] };
            } else {
              originalPreferencesRef.current.push({ ...updatedPreferences[index] });
            }
          }

          formik.setFieldValue("preferences", updatedPreferences);
          dispatch(addToast({ type: "success", message: response.message || t("applicant.preferenceSaved") }));
        } else {
          throw new Error(response.message || "Failed to update preference");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save preference");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        dispatch(hideLoader());
      }
    },
    [applicantId, dispatch, formik, convertPreferenceToApiFormatWrapper, originalPreferencesRef, isSubmittingRef, t]
  );

  // Create preference via POST API
  const createPreference = useCallback(
    async (index: number, preference: PreferenceItem) => {
      if (!applicantId || isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;
      dispatch(showLoader());

      try {
        const payload = convertPreferenceToApiFormatWrapper(preference);
        const createPayload = [payload];
        const response = await applicantService.createApplicationPreferences(applicantId, createPayload);

        if (response.status === "success" && response.data && response.data.length > 0) {
          const updatedPreferences = [...formik.values.preferences];
          const responseData = response.data[0];

          // Handle ApplicationPreferenceData (from POST - has id, not preferenceId, and flat structure)
          let enrollmentTypeCode = preference.enrollmentType;
          let preferenceId: number | null = null;

          if (responseData) {
            // ApplicationPreferenceData has id field
            if ("id" in responseData && typeof responseData.id === "number") {
              preferenceId = responseData.id;
            }
            if (responseData.enrollmentType && typeof responseData.enrollmentType === "object" && "name" in responseData.enrollmentType) {
              enrollmentTypeCode = responseData.enrollmentType.name;
            }
          }

          updatedPreferences[index] = {
            ...preference,
            preferenceId: preferenceId,
            enrollmentType: enrollmentTypeCode,
            desiredCountry: String((responseData as any).desiredCountryId || preference.desiredCountry),
            program: preference.program, // Keep original program as POST response doesn't have desiredProgramType
            desiredUniversity: String((responseData as any).desiredUniversityId || preference.desiredUniversity),
            desiredCampus: String((responseData as any).desiredCampusId || preference.desiredCampus),
            course: String((responseData as any).desiredCourseId || preference.course),
            courseName: preference.courseName, // POST response doesn't have name, keep original
            desiredIntake: (responseData as any).desiredIntake || preference.desiredIntake,
            assignCounselor: String((responseData as any).assignedCounselor || preference.assignCounselor),
            agencyPartnerName: preference.agencyPartnerName, // POST response doesn't have agencyPartner, keep original
            saved: true,
          };

          originalPreferencesRef.current.push({ ...updatedPreferences[index] });

          const getPreferenceHash = (pref: PreferenceItem): string => {
            return `${pref.enrollmentType}|${pref.desiredCountry}|${pref.program}|${pref.desiredUniversity}|${pref.desiredCampus}|${pref.course}|${pref.desiredIntake}|${pref.assignCounselor}|${pref.agencyPartnerName}`;
          };
          const hash = getPreferenceHash(updatedPreferences[index]);
          preferencesSentToApiRef.current.add(hash);

          formik.setFieldValue("preferences", updatedPreferences);
          dispatch(addToast({ type: "success", message: response.message || t("applicant.preferenceSaved") }));
        } else {
          throw new Error(response.message || "Failed to create preference");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save preference");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        dispatch(hideLoader());
      }
    },
    [applicantId, dispatch, formik, convertPreferenceToApiFormatWrapper, originalPreferencesRef, preferencesSentToApiRef, isSubmittingRef, t]
  );

  // Delete preference via DELETE API
  const deletePreference = useCallback(
    async (index: number, preferenceId: number | string) => {
      if (!applicantId || isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;
      dispatch(showLoader());

      try {
        const response = await applicantService.deleteApplicationPreference(preferenceId, applicantId);

        if (response.status === "success") {
          const updatedPreferences = formik.values.preferences.filter((_, i) => i !== index);
          originalPreferencesRef.current = originalPreferencesRef.current.filter((_, i) => i !== index);

          if (updatedPreferences.length === 0) {
            updatedPreferences.push(getEmptyPreference());
          }

          formik.setFieldValue("preferences", updatedPreferences);
          dispatch(addToast({ type: "success", message: response.message || t("applicant.preferenceDeleted") }));
        } else {
          throw new Error(response.message || "Failed to delete preference");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to delete preference");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        dispatch(hideLoader());
      }
    },
    [applicantId, dispatch, formik, originalPreferencesRef, getEmptyPreference, isSubmittingRef, t]
  );

  // Create multiple preferences via POST API
  const createMultiplePreferences = useCallback(
    async (preferences: PreferenceItem[]) => {
      if (!applicantId || isSubmittingRef.current || preferences.length === 0) {
        return { success: false };
      }

      isSubmittingRef.current = true;
      dispatch(showLoader());

      try {
        const createPayload = preferences.map(convertPreferenceToApiFormatWrapper);
        const createResponse = await applicantService.createApplicationPreferences(applicantId, createPayload);

        if (createResponse.status === "success" && createResponse.data) {
          const updatedPreferences = [...formik.values.preferences];
          let responseIndex = 0;

          for (let i = 0; i < updatedPreferences.length; i++) {
            const pref = updatedPreferences[i];
            if (!pref.preferenceId && !pref.saved) {
              if (responseIndex < createResponse.data.length) {
                const responseData = createResponse.data[responseIndex];

                // Handle ApplicationPreferenceData (from POST - has id, not preferenceId, and flat structure)
                let enrollmentTypeCode = pref.enrollmentType;
                let preferenceId: number | null = null;

                if (responseData) {
                  // ApplicationPreferenceData has id field
                  if ("id" in responseData && typeof responseData.id === "number") {
                    preferenceId = responseData.id;
                  }
                  if (responseData.enrollmentType && typeof responseData.enrollmentType === "object" && "name" in responseData.enrollmentType) {
                    enrollmentTypeCode = responseData.enrollmentType.name;
                  }
                }

                updatedPreferences[i] = {
                  ...pref,
                  preferenceId: preferenceId,
                  enrollmentType: enrollmentTypeCode,
                  desiredCountry: String((responseData as any).desiredCountryId || pref.desiredCountry),
                  program: pref.program, // Keep original program as POST response doesn't have desiredProgramType
                  desiredUniversity: String((responseData as any).desiredUniversityId || pref.desiredUniversity),
                  desiredCampus: String((responseData as any).desiredCampusId || pref.desiredCampus),
                  course: String((responseData as any).desiredCourseId || pref.course),
                  courseName: pref.courseName, // POST response doesn't have name, keep original
                  desiredIntake: (responseData as any).desiredIntake || pref.desiredIntake,
                  assignCounselor: String((responseData as any).assignedCounselor || pref.assignCounselor),
                  agencyPartnerName: pref.agencyPartnerName, // POST response doesn't have agencyPartner, keep original
                  saved: true,
                };

                originalPreferencesRef.current.push({ ...updatedPreferences[i] });

                const getPreferenceHash = (p: PreferenceItem): string => {
                  return `${p.enrollmentType}|${p.desiredCountry}|${p.program}|${p.desiredUniversity}|${p.desiredCampus}|${p.course}|${p.desiredIntake}|${p.assignCounselor}|${p.agencyPartnerName}`;
                };
                const hash = getPreferenceHash(updatedPreferences[i]);
                preferencesSentToApiRef.current.add(hash);

                responseIndex++;
              }
            }
          }

          formik.setFieldValue("preferences", updatedPreferences);
          dispatch(addToast({ type: "success", message: createResponse.message || t("applicant.preferencesSaved") }));
          return { success: true };
        } else {
          throw new Error(createResponse.message || "Failed to create preferences");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save preferences");
        dispatch(addToast({ type: "error", message }));
        return { success: false };
      } finally {
        isSubmittingRef.current = false;
        dispatch(hideLoader());
      }
    },
    [applicantId, dispatch, formik, convertPreferenceToApiFormatWrapper, originalPreferencesRef, preferencesSentToApiRef, isSubmittingRef, t]
  );

  return {
    fetchApplicationPreferences,
    updatePreference,
    createPreference,
    deletePreference,
    createMultiplePreferences,
  };
}

