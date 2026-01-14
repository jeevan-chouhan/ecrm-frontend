import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Button, ConfirmationPopup } from "../../../components";
import { COLORS } from "../../../constants";
import PreferenceForm from "./PreferenceForm";
import PreferenceCard from "./PreferenceCard";
import type { PreferenceItem, ApplicationPreferencesFormData } from "./types";
import { useDataChangeTracking, useFormSync, usePreferenceLogic } from "./hooks";
import { applicantService } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";
import type { SelectOption } from "../../../components";
import type { CountryItem, CounselorItem } from "../../../services/types";

interface ApplicationPreferencesProps {
  initialValues: ApplicationPreferencesFormData;
  onUpdate: (data: ApplicationPreferencesFormData) => void;
  onSaveAndNext?: () => void;
  onBack?: () => void;
  applicantId?: number | string | null; // Current applicant ID (required for API)
}

const ApplicationPreferences = ({ initialValues, onUpdate, onSaveAndNext, onBack, applicantId }: ApplicationPreferencesProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions
  const originalPreferencesRef = useRef<PreferenceItem[]>([]); // Store original preferences from GET API
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const hasFetchedCountriesRef = useRef(false);
  const isFetchingCountriesRef = useRef(false);
  const [universityOptions, setUniversityOptions] = useState<SelectOption[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | string | null>(null);
  const isFetchingUniversitiesRef = useRef(false);
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | string | null>(null);
  const isFetchingCampusesRef = useRef(false);
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | string | null>(null);
  const [selectedCourseType, setSelectedCourseType] = useState<string | null>(null);
  const isFetchingCoursesRef = useRef(false);
  const [counselorOptions, setCounselorOptions] = useState<SelectOption[]>([]);
  const hasFetchedCounselorsRef = useRef(false);
  const isFetchingCounselorsRef = useRef(false);
  const isFetchingPreferencesRef = useRef(false);

  // Reusable preference validation schema
  const getPreferenceSchema = useCallback(() => {
    return Yup.object().shape({
      desiredCountry: Yup.string().required(t("validation.countryRequired")),
      program: Yup.string().required(t("validation.programRequired")),
      desiredUniversity: Yup.string().required(t("validation.universityRequired")),
      desiredCampus: Yup.string().required(t("validation.campusRequired")),
      course: Yup.string().required(t("validation.courseRequired")),
      desiredIntake: Yup.string().required(t("validation.intakeRequired")),
      assignCounselor: Yup.string().nullable(),
      agencyPartnerName: Yup.string().nullable(),
    });
  }, [t, i18n.language]);

  // Validation schema using Yup with i18n messages
  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        preferences: Yup.array()
          .of(getPreferenceSchema())
          .min(1, t("validation.atLeastOnePreferenceRequired")),
      }),
    [getPreferenceSchema, t]
  );

  const getEmptyPreference = (): PreferenceItem => ({
    id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    desiredCountry: "",
    program: "",
    desiredUniversity: "",
    desiredCampus: "",
    course: "",
    desiredIntake: "",
    assignCounselor: "",
    agencyPartnerName: "",
    saved: false,
  });

  const isPreferenceComplete = (pref: PreferenceItem): boolean => {
    return !!(
      pref.desiredCountry &&
      pref.program &&
      pref.desiredUniversity &&
      // pref.desiredCampus &&
      pref.course &&
      pref.desiredIntake
    );
  };

  // Map program value to API course type (program already uses enum values: BACHELOR, MASTER, PHD)
  const mapProgramToCourseType = useCallback((program: string): string => {
    // Program values are already enum values (BACHELOR, MASTER, PHD), just ensure uppercase
    return program.toUpperCase();
  }, []);

  // Helper function to check if a preference has changed compared to original
  const hasPreferenceChanged = useCallback((current: PreferenceItem, original: PreferenceItem | undefined): boolean => {
    if (!original) return true; // If no original, consider it changed (new preference)
    
    // Compare all fields
    return (
      current.desiredCountry !== original.desiredCountry ||
      current.program !== original.program ||
      current.desiredUniversity !== original.desiredUniversity ||
      current.desiredCampus !== original.desiredCampus ||
      current.course !== original.course ||
      current.desiredIntake !== original.desiredIntake ||
      current.assignCounselor !== original.assignCounselor ||
      current.agencyPartnerName !== original.agencyPartnerName
    );
  }, []);

  // Convert form preference to API payload format
  const convertPreferenceToApiFormat = useCallback((pref: PreferenceItem) => {
    // Determine user role
    const userRole = user?.role?.toUpperCase() || "";
    const isManager = userRole === "MANAGER";
    const isAdmin = userRole === "ADMIN" || user?.isPrimaryAdmin === true;

    // Build base payload
    const payload: {
      desiredCountryId: number;
      desiredUniversityId: number;
      desiredCourseType: string;
      desiredCampusId: number;
      desiredCourseId: number;
      desiredIntake: string;
      assignedAgencyId: number | null;
      assignedCounselorId?: number | null;
      assignedAdminId?: number | null;
      assignedManagerId?: number | null;
    } = {
      desiredCountryId: parseInt(pref.desiredCountry) || 0,
      desiredUniversityId: parseInt(pref.desiredUniversity) || 0,
      desiredCourseType: mapProgramToCourseType(pref.program),
      desiredCampusId: parseInt(pref.desiredCampus) || 0,
      desiredCourseId: parseInt(pref.course) || 0,
      desiredIntake: pref.desiredIntake, // Format: "YYYY-MM"
      assignedAgencyId: user?.agencyId || null,
    };

    // If counselor is selected, send assignedCounselorId
    if (pref.assignCounselor && pref.assignCounselor !== "") {
      payload.assignedCounselorId = parseInt(pref.assignCounselor) || null;
    } else {
      // If no counselor selected, send assignedAdminId or assignedManagerId based on user role
      if (isAdmin) {
        payload.assignedAdminId = user?.userId || null;
      } else if (isManager) {
        payload.assignedManagerId = user?.userId || null;
      }
    }

    return payload;
  }, [mapProgramToCourseType, user]);

  // Ensure we have at least one preference (empty if none exist)
  // Use JSON.stringify to detect deep changes in the preferences array
  const initialPreferencesKey = useMemo(() => 
    JSON.stringify(initialValues.preferences || []), 
    [initialValues.preferences]
  );

  const initialPreferences = useMemo(() => {
    if (initialValues.preferences && initialValues.preferences.length > 0) {
      // Create a new array reference to ensure formik detects the change
      return [...initialValues.preferences];
    }
    return [getEmptyPreference()];
  }, [initialPreferencesKey]);

  const formik = useFormik<ApplicationPreferencesFormData>({
    initialValues: {
      preferences: initialPreferences,
    },
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
            message: t("applicant.applicantIdRequired", "Please save personal details first to get applicant ID"),
          })
        );
        return;
      }

      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        // Only call API if data has changed since last save
        // This prevents duplicate API calls when clicking Save and then Save & Next with same data
        if (!hasDataChanged) {
          if (import.meta.env.DEV) {
            console.log("No changes detected. Skipping API call.");
          }
          
          // Mark data as saved (in case it wasn't marked before)
          markAsSaved({ preferences: [...values.preferences] });
          
          // Still navigate if needed
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
          return;
        }

        // Separate preferences into updates (have preferenceId) and creates (don't have preferenceId)
        const savedPreferences = values.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
        
        if (savedPreferences.length === 0) {
          dispatch(
            addToast({
              type: "error",
              message: t("validation.atLeastOnePreferenceRequired", "At least one complete preference is required"),
            })
          );
          return;
        }

        // Filter preferences that actually need to be saved:
        // 1. New preferences (no preferenceId) - always create
        // 2. Existing preferences (have preferenceId) - only update if changed
        const preferencesToCreate = savedPreferences.filter((pref) => !pref.preferenceId);
        
        const preferencesToUpdate = savedPreferences.filter((pref) => {
          if (!pref.preferenceId) return false; // Skip if no preferenceId
          
          // Find original preference by preferenceId
          const original = originalPreferencesRef.current.find(
            (orig) => orig.preferenceId?.toString() === pref.preferenceId?.toString()
          );
          
          // Only update if preference has changed
          return hasPreferenceChanged(pref, original);
        });

        // If no changes to save, skip API calls
        if (preferencesToUpdate.length === 0 && preferencesToCreate.length === 0) {
          if (import.meta.env.DEV) {
            console.log("No preferences to save - all are unchanged or already saved");
          }
          
          // Mark data as saved
          markAsSaved({ preferences: [...values.preferences] });
          
          // Still navigate if needed
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
          return;
        }

        // Update existing preferences using PUT
        if (preferencesToUpdate.length > 0) {
          for (const pref of preferencesToUpdate) {
            const payload = convertPreferenceToApiFormat(pref);
            const response = await applicantService.updateApplicationPreference(
              pref.preferenceId!,
              applicantId,
              payload
            );

            if (response.status !== "success") {
              throw new Error(response.message || "Failed to update application preference");
            }
          }
        }

        // Create new preferences using POST
        if (preferencesToCreate.length > 0) {
          const createPayload = preferencesToCreate.map(convertPreferenceToApiFormat);
          const createResponse = await applicantService.createApplicationPreferences(applicantId, createPayload);

          if (createResponse.status === "success" && createResponse.data) {
            // Update preferenceId for newly created preferences
            const updatedPreferences = [...values.preferences];
            let createIndex = 0;
            
            for (let i = 0; i < updatedPreferences.length; i++) {
              const pref = updatedPreferences[i];
              if (preferencesToCreate.some((p) => p.id === pref.id)) {
                // Find the corresponding response data (assuming order matches)
                if (createResponse.data[createIndex]) {
                  const responseData = createResponse.data[createIndex];
                  // Store the preferenceId from API response if available
                  updatedPreferences[i] = {
                    ...pref,
                    preferenceId: responseData.id || null,
                    saved: true,
                  };
                  createIndex++;
                }
              }
            }
            
            formik.setFieldValue("preferences", updatedPreferences);
            
            // Update original preferences ref with newly created preferences
            originalPreferencesRef.current = updatedPreferences.map(pref => ({ ...pref }));
          } else {
            throw new Error(createResponse.message || "Failed to create application preferences");
          }
        }

        // Show success toast
        const successMessage = preferencesToUpdate.length > 0 && preferencesToCreate.length > 0
          ? t("applicant.preferencesSaved", "Application preferences saved successfully")
          : preferencesToUpdate.length > 0
          ? t("applicant.preferencesUpdated", "Application preferences updated successfully")
          : t("applicant.preferencesSaved", "Application preferences saved successfully");

        dispatch(
          addToast({
            type: "success",
            message: successMessage,
          })
        );

        // Mark data as saved and update original preferences
        const updatedPreferences = [...values.preferences];
        markAsSaved({ preferences: updatedPreferences });
        
        // Update original preferences ref with current state after save
        originalPreferencesRef.current = updatedPreferences.map(pref => ({ ...pref }));

        // Fetch updated preferences from API after save
        if (applicantId) {
          await fetchApplicationPreferences(applicantId);
        }

        // Navigate to next tab if "Save & Next" was clicked
        if (shouldNavigateNext && onSaveAndNext) {
          onSaveAndNext();
          setShouldNavigateNext(false);
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save application preferences");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    },
  });

  // Use reusable hook for data change tracking with custom comparison for arrays
  const { hasDataChanged, markAsSaved } = useDataChangeTracking<ApplicationPreferencesFormData>(
    formik.values,
    (lastSavedData, current) => {
      if (!lastSavedData) return true;
      // Compare saved preferences
      const currentSaved = current.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
      const lastSaved = lastSavedData.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
      
      if (currentSaved.length !== lastSaved.length) {
        return true;
      }
      
      // Deep compare each preference
      return currentSaved.some((currentItem, index) => {
        const lastItem = lastSaved[index];
        if (!lastItem) return true;
        return (
          currentItem.desiredCountry !== lastItem.desiredCountry ||
          currentItem.program !== lastItem.program ||
          currentItem.desiredUniversity !== lastItem.desiredUniversity ||
          currentItem.desiredCampus !== lastItem.desiredCampus ||
          currentItem.course !== lastItem.course ||
          currentItem.desiredIntake !== lastItem.desiredIntake ||
          currentItem.assignCounselor !== lastItem.assignCounselor ||
          currentItem.agencyPartnerName !== lastItem.agencyPartnerName
        );
      });
    }
  );

  // Force formik to update when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues.preferences && initialValues.preferences.length > 0) {
      const currentPrefsString = JSON.stringify(formik.values.preferences);
      const newPrefsString = JSON.stringify(initialValues.preferences);
      if (currentPrefsString !== newPrefsString) {
        formik.setValues({
          preferences: [...initialValues.preferences],
        }, false);
      }
    }
  }, [initialPreferencesKey]); // Re-run when initialValues change

  // Fetch countries from API
  const fetchCountries = useCallback(async () => {
    if (!user?.agencyId || isFetchingCountriesRef.current || hasFetchedCountriesRef.current) {
      return;
    }

    isFetchingCountriesRef.current = true;

    try {
      const response = await applicantService.getCountries(user.agencyId);

      // Handle both direct array response and wrapped ApiResponse
      // Service returns response.data, which could be:
      // 1. Direct array: [{id, name}, ...]
      // 2. Wrapped ApiResponse: {status: "success", data: [{id, name}, ...]}
      let countries: CountryItem[] = [];
      if (Array.isArray(response)) {
        // Direct array response
        countries = response;
      } else if (response && typeof response === "object" && "status" in response) {
        // Wrapped ApiResponse
        if (response.status === "success" && response.data && Array.isArray(response.data)) {
          countries = response.data;
        }
      } else if (Array.isArray((response as any)?.data)) {
        // Fallback: check if response has data property that's an array
        countries = (response as any).data;
      }

      // Convert to SelectOption format
      const options: SelectOption[] = countries.map((country) => ({
        value: country.id.toString(),
        label: country.name,
      }));

      setCountryOptions(options);
      hasFetchedCountriesRef.current = true;
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch countries");
      dispatch(addToast({ type: "error", message }));
      hasFetchedCountriesRef.current = false; // Allow retry on error
    } finally {
      isFetchingCountriesRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch universities when country is selected
  const fetchUniversities = useCallback(async (countryId: number | string | null) => {
    if (!user?.agencyId || !countryId || isFetchingUniversitiesRef.current) {
      if (!countryId) {
        // Clear universities if no country selected
        setUniversityOptions([]);
      }
      return;
    }

    isFetchingUniversitiesRef.current = true;

    try {
      const universities = await applicantService.getUniversities(user.agencyId, countryId);

      // Convert to SelectOption format
      const options: SelectOption[] = universities.map((university) => ({
        value: university.id.toString(),
        label: university.name,
      }));

      setUniversityOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch universities");
      dispatch(addToast({ type: "error", message }));
      setUniversityOptions([]);
    } finally {
      isFetchingUniversitiesRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch campuses when university is selected
  const fetchCampuses = useCallback(async (universityId: number | string | null) => {
    if (!user?.agencyId || !universityId || isFetchingCampusesRef.current) {
      if (!universityId) {
        // Clear campuses if no university selected
        setCampusOptions([]);
      }
      return;
    }

    isFetchingCampusesRef.current = true;

    try {
      const campuses = await applicantService.getCampuses(user.agencyId, universityId);

      // Convert to SelectOption format
      const options: SelectOption[] = campuses.map((campus) => ({
        value: campus.id.toString(),
        label: campus.name,
      }));

      setCampusOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch campuses");
      dispatch(addToast({ type: "error", message }));
      setCampusOptions([]);
    } finally {
      isFetchingCampusesRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch courses when campus and program type are selected
  const fetchCourses = useCallback(async (campusId: number | string | null, courseType: string | null) => {
    if (!user?.agencyId || !campusId || !courseType || isFetchingCoursesRef.current) {
      if (!campusId || !courseType) {
        // Clear courses if no campus or course type selected
        setCourseOptions([]);
      }
      return;
    }

    isFetchingCoursesRef.current = true;

    try {
      const courses = await applicantService.getCourses(user.agencyId, campusId, courseType);

      // Convert to SelectOption format
      const options: SelectOption[] = courses.map((course) => ({
        value: course.id.toString(),
        label: course.name,
      }));

      setCourseOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch courses");
      dispatch(addToast({ type: "error", message }));
      setCourseOptions([]);
    } finally {
      isFetchingCoursesRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch counselors based on logged-in user's role
  const fetchCounselors = useCallback(async () => {
    if (!user?.agencyId || hasFetchedCounselorsRef.current || isFetchingCounselorsRef.current) {
      return;
    }

    // Determine which parameter to send based on user role
    const userRole = user.role?.toUpperCase() || "";
    const isManager = userRole === "MANAGER";
    const isAdmin = userRole === "ADMIN" || user.isPrimaryAdmin === true;

    // Only fetch if user is MANAGER or ADMIN
    if (!isManager && !isAdmin) {
      return;
    }

    isFetchingCounselorsRef.current = true;

    try {
      let counselors: CounselorItem[] = [];
      
      if (isManager) {
        // If user is MANAGER, send assignedManagerId
        counselors = await applicantService.getCounselors(
          user.agencyId,
          user.userId, // assignedManagerId
          null // assignedAdminId
        );
      } else if (isAdmin) {
        // If user is ADMIN, send assignedAdminId
        counselors = await applicantService.getCounselors(
          user.agencyId,
          null, // assignedManagerId
          user.userId // assignedAdminId
        );
      }

      // Convert to SelectOption format
      const options: SelectOption[] = counselors.map((counselor) => ({
        value: counselor.id.toString(),
        label: counselor.name,
      }));

      setCounselorOptions(options);
      hasFetchedCounselorsRef.current = true;
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch counselors");
      dispatch(addToast({ type: "error", message }));
      setCounselorOptions([]);
      hasFetchedCounselorsRef.current = false; // Allow retry on error
    } finally {
      isFetchingCounselorsRef.current = false;
    }
  }, [user?.agencyId, user?.role, user?.userId, user?.isPrimaryAdmin, dispatch]);

  // Fetch countries when component mounts
  useEffect(() => {
    if (user?.agencyId) {
      fetchCountries();
    }
  }, [user?.agencyId, fetchCountries]);

  // Fetch counselors when component mounts (if user is MANAGER or ADMIN)
  useEffect(() => {
    if (user?.agencyId) {
      fetchCounselors();
    }
  }, [user?.agencyId, fetchCounselors]);

  // Fetch application preferences when applicantId is available
  // This handles:
  // 1. After "Save & Next" from personal details (applicantId is set)
  // 2. After POST/PUT operations (already handled in onSubmit)
  // 3. After back button from educational details (applicantId is available)
  useEffect(() => {
    if (applicantId && !isFetchingPreferencesRef.current) {
      // Only fetch if we don't have saved preferences with preferenceId
      // This allows us to fetch even if preferences array is empty or only has unsaved preferences
      const hasSavedPreferences = formik.values.preferences.some(pref => pref.saved && pref.preferenceId);
      
      // Fetch if no saved preferences exist (this includes empty array case)
      if (!hasSavedPreferences) {
        fetchApplicationPreferences(applicantId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]); // Only depend on applicantId to avoid infinite loops

  // Fetch application preferences from API
  const fetchApplicationPreferences = useCallback(async (id: number | string) => {
    if (!id || isFetchingPreferencesRef.current) {
      return;
    }

    isFetchingPreferencesRef.current = true;
    dispatch(showLoader());

    try {
      const response = await applicantService.getApplicationPreferences(id);

      if (response.status === "success" && response.data) {
        // Map API response to form state
        let mappedPreferences: PreferenceItem[] = [];
        
        if (response.data.length > 0) {
          mappedPreferences = response.data.map((pref, index) => {
            // Helper function to extract ID from object or number
            const getId = (value: { id: number; name: string } | number): string => {
              if (typeof value === 'object' && value !== null && 'id' in value) {
                return value.id.toString();
              }
              return value.toString();
            };

            return {
              id: `pref-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
              preferenceId: pref.preferenceId || null,
              desiredCountry: getId(pref.desiredCountryId),
              program: pref.desiredCourseType, // program is already the enum value (BACHELOR, MASTER, PHD)
              desiredUniversity: getId(pref.desiredUniversityId),
              desiredCampus: getId(pref.desiredCampusId),
              course: getId(pref.desiredCourseId),
            desiredIntake: pref.desiredIntake,
            assignCounselor: (() => {
              const counselor = pref.assignedCounselor;
              if (!counselor) return "";
              if (typeof counselor === 'object' && 'id' in counselor) {
                return counselor.id.toString();
              }
              if (typeof counselor === 'number') {
                return counselor.toString();
              }
              return "";
            })(),
            agencyPartnerName: "", // Not in API response
            saved: true,
            };
          });

          // Fetch dependent dropdowns for the first preference if available
          const firstPref = mappedPreferences[0];
          
          // Fetch universities if country is selected
          if (firstPref.desiredCountry && user?.agencyId) {
            const countryId = parseInt(firstPref.desiredCountry);
            if (!isNaN(countryId)) {
              await fetchUniversities(countryId);
            }
          }

          // Fetch campuses if university is selected
          if (firstPref.desiredUniversity && user?.agencyId) {
            const universityId = parseInt(firstPref.desiredUniversity);
            if (!isNaN(universityId)) {
              await fetchCampuses(universityId);
            }
          }

          // Fetch courses if campus and program are selected
          if (firstPref.desiredCampus && firstPref.program && user?.agencyId) {
            const campusId = parseInt(firstPref.desiredCampus);
            if (!isNaN(campusId)) {
              await fetchCourses(campusId, firstPref.program);
            }
          }
        } else {
          // If no preferences found, add an empty preference form so user can add one
          mappedPreferences = [getEmptyPreference()];
        }

        // Update form state with fetched preferences (or empty preference if none found)
        formik.setFieldValue("preferences", mappedPreferences);
        
        // Store original preferences for change detection
        originalPreferencesRef.current = mappedPreferences.map(pref => ({ ...pref }));
        
        // Update parent component state
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
  }, [dispatch, applicantService, formik, onUpdate, user?.agencyId, fetchUniversities, fetchCampuses, fetchCourses]);


  // Fetch universities when preferences are loaded with existing country (e.g., from initialValues)
  useEffect(() => {
    // Check if there's a country selected in any preference that we haven't fetched universities for
    const prefWithCountry = formik.values.preferences.find(
      (pref) => pref.desiredCountry && pref.desiredCountry !== ""
    );
    
    if (prefWithCountry?.desiredCountry) {
      const countryIdNum = parseInt(prefWithCountry.desiredCountry);
      if (!isNaN(countryIdNum) && countryIdNum !== selectedCountryId && user?.agencyId) {
        setSelectedCountryId(countryIdNum);
        fetchUniversities(countryIdNum);
      }
    }
  }, [formik.values.preferences, selectedCountryId, user?.agencyId, fetchUniversities]);

  // Fetch campuses when preferences are loaded with existing university (e.g., from initialValues)
  useEffect(() => {
    // Check if there's a university selected in any preference that we haven't fetched campuses for
    const prefWithUniversity = formik.values.preferences.find(
      (pref) => pref.desiredUniversity && pref.desiredUniversity !== ""
    );
    
    if (prefWithUniversity?.desiredUniversity) {
      const universityIdNum = parseInt(prefWithUniversity.desiredUniversity);
      if (!isNaN(universityIdNum) && universityIdNum !== selectedUniversityId && user?.agencyId) {
        setSelectedUniversityId(universityIdNum);
        fetchCampuses(universityIdNum);
      }
    }
  }, [formik.values.preferences, selectedUniversityId, user?.agencyId, fetchCampuses]);

  // Fetch courses when preferences are loaded with existing campus and program (e.g., from initialValues)
  useEffect(() => {
    // Check if there's a campus and program selected in any preference that we haven't fetched courses for
    const prefWithCampusAndProgram = formik.values.preferences.find(
      (pref) => pref.desiredCampus && pref.desiredCampus !== "" && pref.program && pref.program !== ""
    );
    
    if (prefWithCampusAndProgram?.desiredCampus && prefWithCampusAndProgram?.program) {
      const campusIdNum = parseInt(prefWithCampusAndProgram.desiredCampus);
      const courseType = prefWithCampusAndProgram.program; // program is already the enum value (BACHELOR, MASTER, PHD)
      
      if (!isNaN(campusIdNum) && courseType && 
          (campusIdNum !== selectedCampusId || courseType !== selectedCourseType) && 
          user?.agencyId) {
        setSelectedCampusId(campusIdNum);
        setSelectedCourseType(courseType);
        fetchCourses(campusIdNum, courseType);
      }
    }
  }, [formik.values.preferences, selectedCampusId, selectedCourseType, user?.agencyId, fetchCourses]);

  // Check form validity - at least one complete preference required (saved or not)
  // This allows Save & Next to work even if preferences aren't saved yet (they'll be saved first)
  useEffect(() => {
    const completePreferences = formik.values.preferences.filter((pref) => 
      isPreferenceComplete(pref)
    );
    setIsFormValid(completePreferences.length > 0);
  }, [formik.values.preferences]);

  // Sync formik values to parent state with optimized comparison
  useFormSync<ApplicationPreferencesFormData>(
    formik.values,
    onUpdate,
    (prev, current) => {
      // Quick length check first
      if (current.preferences.length !== prev.preferences.length) {
        return true;
      }
      
      // Deep comparison only if lengths match
      return current.preferences.some((currentItem, index) => {
        const prevItem = prev.preferences[index];
        if (!prevItem) return true;
        return (
          currentItem.id !== prevItem.id ||
          currentItem.desiredCountry !== prevItem.desiredCountry ||
          currentItem.program !== prevItem.program ||
          currentItem.desiredUniversity !== prevItem.desiredUniversity ||
          currentItem.desiredCampus !== prevItem.desiredCampus ||
          currentItem.course !== prevItem.course ||
          currentItem.desiredIntake !== prevItem.desiredIntake ||
          currentItem.assignCounselor !== prevItem.assignCounselor ||
          currentItem.agencyPartnerName !== prevItem.agencyPartnerName ||
          currentItem.saved !== prevItem.saved
        );
      });
    }
  );

  // Helper functions
  const markAllFieldsAsTouched = useCallback(() => {
    return {
      desiredCountry: true,
      program: true,
      desiredUniversity: true,
      desiredCampus: true,
      course: true,
      desiredIntake: true,
      assignCounselor: true,
      agencyPartnerName: true,
    };
  }, []);

  const handleValidationErrors = useCallback((error: unknown, index: number) => {
    if (error instanceof Yup.ValidationError) {
      error.inner.forEach((err) => {
        if (err.path) {
          formik.setFieldTouched(`preferences[${index}].${err.path}`, true);
        }
      });
    }
  }, [formik]);

  // Use extracted logic hook
  const {
    getIncompletePreferences,
    getCompletePreferences,
    handleAddPreference,
    handleCancelIncompletePreference,
    handleSavePreference,
    handleEditPreference,
    handleCancelEdit,
    getFieldError,
    updatePreferenceField: baseUpdatePreferenceField,
  } = usePreferenceLogic({
    formik,
    editingIndex,
    setEditingIndex,
    getPreferenceSchema,
    getEmptyPreference,
    isPreferenceComplete,
    handleValidationErrors,
  });

  // Wrapper for updatePreferenceField that also handles university fetching when country changes
  const updatePreferenceField = useCallback(async (index: number, field: keyof PreferenceItem, value: string) => {
    // Update the field
    await baseUpdatePreferenceField(index, field, value);

    // Get current preference values for dependent field updates
    const currentPreference = formik.values.preferences[index];

    // If country changed, fetch universities for that country
    if (field === "desiredCountry" && value) {
      const countryIdNum = parseInt(value);
      if (!isNaN(countryIdNum) && user?.agencyId) {
        setSelectedCountryId(countryIdNum);
        await fetchUniversities(countryIdNum);
        
        // Clear university, campus, and course selection when country changes
        await formik.setFieldValue(`preferences[${index}].desiredUniversity`, "");
        await formik.setFieldValue(`preferences[${index}].desiredCampus`, "");
        await formik.setFieldValue(`preferences[${index}].course`, "");
      } else if (!value) {
        // Clear universities, campuses, and courses if country is cleared
        setSelectedCountryId(null);
        setUniversityOptions([]);
        setCampusOptions([]);
        setCourseOptions([]);
        await formik.setFieldValue(`preferences[${index}].desiredUniversity`, "");
        await formik.setFieldValue(`preferences[${index}].desiredCampus`, "");
        await formik.setFieldValue(`preferences[${index}].course`, "");
      }
    }
    
    // If university changed, fetch campuses for that university
    if (field === "desiredUniversity" && value) {
      const universityIdNum = parseInt(value);
      if (!isNaN(universityIdNum) && user?.agencyId) {
        setSelectedUniversityId(universityIdNum);
        await fetchCampuses(universityIdNum);
        
        // Clear campus and course selection when university changes
        await formik.setFieldValue(`preferences[${index}].desiredCampus`, "");
        await formik.setFieldValue(`preferences[${index}].course`, "");
      } else if (!value) {
        // Clear campuses and courses if university is cleared
        setSelectedUniversityId(null);
        setCampusOptions([]);
        setCourseOptions([]);
        await formik.setFieldValue(`preferences[${index}].desiredCampus`, "");
        await formik.setFieldValue(`preferences[${index}].course`, "");
      }
    }

    // If program changed, fetch courses if campus is already selected
    if (field === "program") {
      if (value && currentPreference.desiredCampus) {
        const campusIdNum = parseInt(currentPreference.desiredCampus);
        if (!isNaN(campusIdNum) && user?.agencyId) {
          setSelectedCourseType(value); // program is already the enum value (BACHELOR, MASTER, PHD)
          await fetchCourses(campusIdNum, value);
          
          // Clear course selection when program changes
          await formik.setFieldValue(`preferences[${index}].course`, "");
        }
      } else if (!value) {
        // Clear courses if program is cleared
        setSelectedCourseType(null);
        setCourseOptions([]);
        await formik.setFieldValue(`preferences[${index}].course`, "");
      }
    }

    // If campus changed, fetch courses if program is already selected
    if (field === "desiredCampus") {
      if (value && currentPreference.program) {
        const campusIdNum = parseInt(value);
        if (!isNaN(campusIdNum) && user?.agencyId) {
          setSelectedCampusId(campusIdNum);
          await fetchCourses(campusIdNum, currentPreference.program);
          
          // Clear course selection when campus changes
          await formik.setFieldValue(`preferences[${index}].course`, "");
        }
      } else if (!value) {
        // Clear courses if campus is cleared
        setSelectedCampusId(null);
        setCourseOptions([]);
        await formik.setFieldValue(`preferences[${index}].course`, "");
      }
    }
  }, [baseUpdatePreferenceField, user?.agencyId, fetchUniversities, fetchCampuses, fetchCourses, formik]);

  // Wrapper for handleSavePreference that calls PUT API when editing an existing preference
  const handleSavePreferenceWithAPI = useCallback(async (index: number) => {
    const preference = formik.values.preferences[index];
    const preferenceSchema = getPreferenceSchema();

    // Validate first
    try {
      await preferenceSchema.validate(preference, { abortEarly: false });
    } catch (error) {
      // Mark fields as touched to show errors
      handleValidationErrors(error, index);
      return;
    }

    // If preference has preferenceId, it's an existing preference - call PUT API
    if (preference.preferenceId && applicantId) {
      if (isSubmittingRef.current) return;
      
      isSubmittingRef.current = true;
      dispatch(showLoader());

      try {
        const payload = convertPreferenceToApiFormat(preference);
        const response = await applicantService.updateApplicationPreference(
          preference.preferenceId,
          applicantId,
          payload
        );

        if (response.status === "success") {
          // Update the preference in form state with the response data
          const updatedPreferences = [...formik.values.preferences];
          
          // Helper function to extract ID from object or number
          const getId = (value: { id: number; name: string } | number | null | undefined): string => {
            if (!value) return "";
            if (typeof value === 'object' && 'id' in value) {
              return value.id.toString();
            }
            if (typeof value === 'number') {
              return value.toString();
            }
            return "";
          };

          // Helper function to extract ID from assigned fields (can be object, number, or null)
          const getAssignedId = (value: { id: number; name: string } | number | null | undefined): string => {
            if (!value) return "";
            if (typeof value === 'object' && 'id' in value) {
              return value.id.toString();
            }
            if (typeof value === 'number') {
              return value.toString();
            }
            return "";
          };

          // Update preference with response data (response has nested objects)
          const responseData = response.data;
          if (responseData) {
            updatedPreferences[index] = {
              ...preference,
              preferenceId: responseData.preferenceId || preference.preferenceId,
              desiredCountry: getId(responseData.desiredCountryId),
              program: responseData.desiredCourseType,
              desiredUniversity: getId(responseData.desiredUniversityId),
              desiredCampus: getId(responseData.desiredCampusId),
              course: getId(responseData.desiredCourseId),
              desiredIntake: responseData.desiredIntake,
              assignCounselor: getAssignedId(responseData.assignedCounselor),
              saved: true,
            };
          } else {
            // If no response data, just mark as saved
            updatedPreferences[index] = {
              ...preference,
              saved: true,
            };
          }

          formik.setFieldValue("preferences", updatedPreferences);
          onUpdate({ preferences: updatedPreferences });
          
          // Update original preferences ref
          originalPreferencesRef.current = updatedPreferences.map(pref => ({ ...pref }));

          // Close edit mode
          if (editingIndex === index) {
            setEditingIndex(null);
          }

          // Show success toast
          dispatch(
            addToast({
              type: "success",
              message: response.message || t("applicant.preferenceUpdated", "Preference updated successfully"),
            })
          );
        } else {
          throw new Error(response.message || "Failed to update preference");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to update preference");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        dispatch(hideLoader());
      }
    } else {
      // If no preferenceId, it's a new preference - call POST API to create it
      if (applicantId) {
        if (isSubmittingRef.current) return;
        
        isSubmittingRef.current = true;
        dispatch(showLoader());

        try {
          const payload = convertPreferenceToApiFormat(preference);
          const createPayload = [payload]; // POST expects array
          const response = await applicantService.createApplicationPreferences(applicantId, createPayload);

          if (response.status === "success" && response.data && response.data.length > 0) {
            // Update the preference in form state with the response data
            const updatedPreferences = [...formik.values.preferences];
            const responseData = response.data[0]; // Get first item from array

            // Update preference with response data (POST response has flat structure)
            updatedPreferences[index] = {
              ...preference,
              preferenceId: responseData.id || null,
              saved: true,
            };

            formik.setFieldValue("preferences", updatedPreferences);
            onUpdate({ preferences: updatedPreferences });
            
            // Update original preferences ref
            originalPreferencesRef.current = updatedPreferences.map(pref => ({ ...pref }));

            // Close edit mode
            if (editingIndex === index) {
              setEditingIndex(null);
            }

            // Show success toast
            dispatch(
              addToast({
                type: "success",
                message: response.message || t("applicant.preferenceSaved", "Preference saved successfully"),
              })
            );
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
      } else {
        // If no applicantId, just mark as saved locally
        handleSavePreference(index);
      }
    }
  }, [
    formik,
    applicantId,
    getPreferenceSchema,
    convertPreferenceToApiFormat,
    handleValidationErrors,
    editingIndex,
    setEditingIndex,
    dispatch,
    t,
    onUpdate,
    handleSavePreference,
  ]);

  const handleDeletePreference = useCallback((index: number) => {
    // Show confirmation popup instead of deleting directly
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingIndex === null || isDeleting) return;

    const indexToDelete = deletingIndex;
    const preferenceToDelete = formik.values.preferences[indexToDelete];

    setIsDeleting(true);
    dispatch(showLoader());

    try {
      // Check if preference has preferenceId - if not, show error
      if (!preferenceToDelete.preferenceId) {
        dispatch(
          addToast({
            type: "error",
            message: t("applicant.preferenceIdMissing", "Preference ID is missing. Cannot delete."),
          })
        );
        setIsDeletePopupOpen(false);
        setDeletingIndex(null);
        return;
      }

      if (!applicantId) {
        dispatch(
          addToast({
            type: "error",
            message: t("applicant.applicantIdMissing", "Applicant ID is missing. Cannot delete preference."),
          })
        );
        setIsDeletePopupOpen(false);
        setDeletingIndex(null);
        setIsDeleting(false);
        dispatch(hideLoader());
        return;
      }

      if (import.meta.env.DEV) {
        console.log("Calling DELETE API for preference ID:", preferenceToDelete.preferenceId, "applicant ID:", applicantId);
      }
      
      const response = await applicantService.deleteApplicationPreference(preferenceToDelete.preferenceId, applicantId);
      
      if (import.meta.env.DEV) {
        console.log("DELETE API response:", response);
      }

      if (response.status === "success") {
        // Remove the preference from form state
        const updatedPreferences = formik.values.preferences.filter((_, i) => i !== indexToDelete);
        formik.setFieldValue("preferences", updatedPreferences);
        onUpdate({ preferences: updatedPreferences });
        
        // Update editing index if needed
        if (editingIndex === indexToDelete) {
          setEditingIndex(null);
        } else if (editingIndex !== null && editingIndex > indexToDelete) {
          setEditingIndex(editingIndex - 1);
        }

        // Show success toast
        dispatch(
          addToast({
            type: "success",
            message: response.message || t("applicant.preferenceDeleted", "Preference deleted successfully"),
          })
        );

        // Close popup and reset state only after successful deletion
        setIsDeletePopupOpen(false);
        setDeletingIndex(null);
      } else {
        throw new Error(response.message || "Failed to delete preference");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to delete preference");
      dispatch(addToast({ type: "error", message }));
      // Don't close popup on error - let user try again or cancel
    } finally {
      setIsDeleting(false);
      dispatch(hideLoader());
    }
  }, [deletingIndex, isDeleting, formik, editingIndex, setEditingIndex, dispatch, applicantService, t, onUpdate, applicantId]);

  const handleCancelDelete = useCallback(() => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    // Save all unsaved preferences first
    const unsavedPreferences = formik.values.preferences.filter((pref) => !pref.saved);
    
    if (unsavedPreferences.length > 0) {
      // Validate and save each unsaved preference
      const preferenceSchema = getPreferenceSchema();

      let hasErrors = false;
      const updatedPreferences = [...formik.values.preferences];
      const touchedPreferences = [...(formik.touched.preferences || [])];

      for (const pref of unsavedPreferences) {
        const index = formik.values.preferences.findIndex((p) => p.id === pref.id);
        try {
          await preferenceSchema.validate(pref, { abortEarly: false });
          // Mark as saved if validation passes
          updatedPreferences[index] = {
            ...updatedPreferences[index],
            saved: true,
          };
        } catch (error) {
          hasErrors = true;
          // Mark all fields as touched to show errors
          touchedPreferences[index] = markAllFieldsAsTouched();
          handleValidationErrors(error, index);
        }
      }

      // Update form state
      formik.setFieldValue("preferences", updatedPreferences);
      formik.setTouched({
        ...formik.touched,
        preferences: touchedPreferences as any,
      });

      // If there are validation errors, don't proceed with form submission
      if (hasErrors) {
        dispatch(
          addToast({
            type: "error",
            message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
          })
        );
        return;
      }
    }

    // Close edit mode if any preference was being edited
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    setShouldNavigateNext(false);
    // Submit the form (which will call API with saved preferences)
    await formik.submitForm();
  }, [isSaving, formik, editingIndex, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, dispatch, t]);

  const handleSaveAndNextClick = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    // Check if there are any unsaved preferences
    const unsavedPreferences = formik.values.preferences.filter((pref) => !pref.saved);
    if (unsavedPreferences.length > 0) {
      // Validate and save each unsaved preference first
      const preferenceSchema = getPreferenceSchema();
      let hasErrors = false;
      const updatedPreferences = [...formik.values.preferences];
      const touchedPreferences = formik.values.preferences.map((pref, index) => {
        if (!pref.saved) {
          return markAllFieldsAsTouched();
        }
        return formik.touched.preferences?.[index] || {};
      });

      for (const pref of unsavedPreferences) {
        const index = formik.values.preferences.findIndex((p) => p.id === pref.id);
        try {
          await preferenceSchema.validate(pref, { abortEarly: false });
          updatedPreferences[index] = {
            ...updatedPreferences[index],
            saved: true,
          };
        } catch (error) {
          hasErrors = true;
          touchedPreferences[index] = markAllFieldsAsTouched();
          handleValidationErrors(error, index);
        }
      }

      formik.setFieldValue("preferences", updatedPreferences);
      formik.setTouched({
        preferences: touchedPreferences as any,
      });

      if (hasErrors) {
        dispatch(
          addToast({
            type: "error",
            message: t("validation.pleaseFillRequiredFields", "Please fill all required fields"),
          })
        );
        return;
      }
    }

    // Validate all saved preferences before proceeding
    const savedPreferences = formik.values.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
    if (savedPreferences.length === 0) {
      dispatch(
        addToast({
          type: "error",
          message: t("validation.atLeastOnePreferenceRequired", "At least one complete preference is required"),
        })
      );
      return;
    }

    // Close edit mode if any preference was being edited
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    setShouldNavigateNext(true);
    // Submit form and then navigate (navigation happens in onSubmit)
    await formik.submitForm();
  }, [isSaving, formik, editingIndex, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, isPreferenceComplete, dispatch, t]);


  const incomplete = getIncompletePreferences();
  const complete = getCompletePreferences();
  const firstIncomplete = incomplete.length > 0 ? incomplete[0] : null;
  const firstIncompleteIndex = firstIncomplete
    ? formik.values.preferences.findIndex((p) => p.id === firstIncomplete.id)
    : -1;

  return (
    <div className="space-y-6">
      {/* Application Preferences Form Section */}
      <div>

        {/* Show form for only the first incomplete preference */}
        {firstIncomplete && firstIncompleteIndex >= 0 && (
          <PreferenceForm
            preference={firstIncomplete}
            index={firstIncompleteIndex}
            onFieldChange={updatePreferenceField}
            getFieldError={getFieldError}
            onCancel={() => handleCancelIncompletePreference(firstIncompleteIndex)}
            onAddMore={handleAddPreference}
            showCancel={incomplete.length > 1 || complete.length > 0}
            showAddMore={true}
            countryOptions={countryOptions}
            universityOptions={universityOptions}
            campusOptions={campusOptions}
            courseOptions={courseOptions}
            counselorOptions={counselorOptions}
          />
        )}

        {/* Show Add More button if all preferences are complete */}
        {incomplete.length === 0 && formik.values.preferences.length > 0 && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="accent"
              onClick={handleAddPreference}
              rounded
            >
              {t("common.addMore")}
            </Button>
          </div>
        )}
      </div>

      {/* Added University Preferences Section */}
      {complete.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
            {t("applicant.addedUniversityPreferences")}
          </h2>

          <div className="space-y-4">
            {complete.map((preference) => {
              const index = formik.values.preferences.findIndex((p) => p.id === preference.id);
              const isEditing = editingIndex === index;

              return (
                <PreferenceCard
                  key={preference.id}
                  preference={preference}
                  index={index}
                  isEditing={isEditing}
                  onEdit={() => handleEditPreference(index)}
                  onDelete={() => handleDeletePreference(index)}
                  onSave={() => handleSavePreferenceWithAPI(index)}
                  onCancel={handleCancelEdit}
                  onFieldChange={updatePreferenceField}
                  getFieldError={getFieldError}
                  countryOptions={countryOptions}
                  universityOptions={universityOptions}
                  campusOptions={campusOptions}
                  courseOptions={courseOptions}
                  counselorOptions={counselorOptions}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Show message if no preferences added */}
      {complete.length === 0 && incomplete.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            {t("applicant.noPreferencesAdded")}
          </p>
        </div>
      )}

      {/* Action Buttons */}
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
          isLoading={isSaving}
          disabled={isSaving || !applicantId}
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
        title={t("applicant.deletePreference", "Delete Preference")}
        message={`${t("applicant.deleteConfirmation", "Are you sure you want to delete this preference?")} ${t("applicant.deleteWarning", "This action cannot be undone.")}`}
        confirmLabel={t("common.delete", "Delete")}
        variant="danger"
        isLoading={isDeleting}
        isDisabled={isDeleting}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ApplicationPreferences;
