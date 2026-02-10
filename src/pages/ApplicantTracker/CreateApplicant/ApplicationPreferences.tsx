import { useMemo, useState, useCallback, useEffect, useRef, startTransition } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Button, ConfirmationPopup } from "../../../components";
import { COLORS, UserRole } from "../../../constants";
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
import type { CountryItem } from "../../../services/types";

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
  // Track preferences that have been sent to API to prevent duplicate POST calls
  const preferencesSentToApiRef = useRef<Set<string>>(new Set()); // Track by preference data hash
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const hasFetchedCountriesRef = useRef(false);
  const isFetchingCountriesRef = useRef(false);
  const [universityOptions, setUniversityOptions] = useState<SelectOption[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | string | null>(null);
  const isFetchingUniversitiesRef = useRef(false);
  const fetchedUniversitiesRef = useRef<Set<string>>(new Set()); // Track fetched countries for universities
  // Store universities in a map keyed by countryId to support multiple preferences with different countries
  const universityOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | string | null>(null);
  const isFetchingCampusesRef = useRef(false);
  const fetchedCampusesRef = useRef<Set<string>>(new Set()); // Track fetched universities for campuses
  // Store campuses in a map keyed by universityId to support multiple preferences with different universities
  const campusOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
  // Store courses in a map keyed by "campusId-programType" to support multiple preferences with different combinations
  // Using ref to avoid stale closures in callbacks
  const courseOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());
  const isFetchingCoursesRef = useRef(false);
  const fetchedCoursesRef = useRef<Set<string>>(new Set()); // Track fetched campus-program combinations for courses
  const [counselorOptions, setCounselorOptions] = useState<SelectOption[]>([]);
  // Store counselors in a map keyed by countryId to support multiple preferences with different countries
  const counselorOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());
  const isFetchingCounselorsRef = useRef(false);
  const [agencyPartnerOptions, setAgencyPartnerOptions] = useState<SelectOption[]>([]);
  const hasFetchedAgencyPartnersRef = useRef(false);
  const isFetchingAgencyPartnersRef = useRef(false);
  const [enrollmentTypeOptions, setEnrollmentTypeOptions] = useState<SelectOption[]>([]);
  const hasFetchedEnrollmentTypesRef = useRef(false);
  const isFetchingEnrollmentTypesRef = useRef(false);
  // Map to store enrollment type code -> ID mapping for API conversion
  const enrollmentTypeIdMapRef = useRef<Map<string, number>>(new Map());
  const isFetchingPreferencesRef = useRef(false);
  const hasFetchedPreferencesRef = useRef(false);
  const lastFetchedApplicantIdRef = useRef<number | string | null>(null);

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
    enrollmentType: "",
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
      pref.enrollmentType &&
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
      current.enrollmentType !== original.enrollmentType ||
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
    const isManager = userRole === UserRole.MANAGER || UserRole.MANGER_BILLING;
    const isAdmin = userRole === UserRole.ADMIN || UserRole.ADMIN_BILLING || user?.isPrimaryAdmin === true;

    // Convert enrollmentType code to enrollmentTypeId
    const enrollmentTypeId = enrollmentTypeIdMapRef.current.get(pref.enrollmentType);
    
    // Validate that enrollmentTypeId was found
    if (!enrollmentTypeId) {
      throw new Error(`Invalid enrollment type: ${pref.enrollmentType}`);
    }

    // Build base payload
    // Note: preferenceId is sent both as a query parameter and in the payload
    const payload: {
      preferenceId?: number | string;
      enrollmentTypeId: number;
      desiredCountryId: number;
      desiredUniversityId: number;
      desiredCourseType: string;
      desiredCampusId: number;
      desiredCourseId: number;
      desiredIntake: string;
      assignedAgencyId: number | null;
      agencyPartnerId?: number | null;
      assignedCounselorId?: number | null;
      assignedAdminId?: number | null;
      assignedManagerId?: number | null;
    } = {
      enrollmentTypeId: enrollmentTypeId,
      desiredCountryId: parseInt(pref.desiredCountry) || 0,
      desiredUniversityId: parseInt(pref.desiredUniversity) || 0,
      desiredCourseType: mapProgramToCourseType(pref.program),
      desiredCampusId: parseInt(pref.desiredCampus) || 0,
      desiredCourseId: parseInt(pref.course) || 0,
      desiredIntake: pref.desiredIntake, // Format: "YYYY-MM"
      assignedAgencyId: user?.agencyId || null,
    };

    // Include preferenceId in payload for PUT operations (when updating existing preference)
    if (pref.preferenceId) {
      payload.preferenceId = pref.preferenceId;
    }

    // If agency partner is selected, send agencyPartnerId (agency partner ID)
    if (pref.agencyPartnerName && pref.agencyPartnerName !== "") {
      payload.agencyPartnerId = parseInt(pref.agencyPartnerName) || null;
    }

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
        // Only create new preferences (no preferenceId) - PUT API is only called from individual preference card Save button
        // Also check originalPreferencesRef to see if preference was already saved (to prevent duplicate saves)
        // If a preference was already saved, restore its preferenceId synchronously before filtering
        let restoredPreferences = [...values.preferences];
        let preferencesUpdated = false;
        
        for (let i = 0; i < restoredPreferences.length; i++) {
          const pref = restoredPreferences[i];
          if (pref.saved && isPreferenceComplete(pref) && !pref.preferenceId) {
            // Check if this preference was already saved by matching against originalPreferencesRef
            const matchingOriginal = originalPreferencesRef.current.find((orig) => {
              if (!orig.preferenceId) return false;
              // Match by checking if all key fields are the same
              return (
                String(orig.desiredCountry || "").trim() === String(pref.desiredCountry || "").trim() &&
                String(orig.program || "").trim() === String(pref.program || "").trim() &&
                String(orig.desiredUniversity || "").trim() === String(pref.desiredUniversity || "").trim() &&
                String(orig.desiredCampus || "").trim() === String(pref.desiredCampus || "").trim() &&
                String(orig.course || "").trim() === String(pref.course || "").trim() &&
                String(orig.desiredIntake || "").trim() === String(pref.desiredIntake || "").trim() &&
                String(orig.assignCounselor || "").trim() === String(pref.assignCounselor || "").trim() &&
                String(orig.agencyPartnerName || "").trim() === String(pref.agencyPartnerName || "").trim()
              );
            });
            
            if (matchingOriginal) {
              // Restore preferenceId and saved flag synchronously
              restoredPreferences[i] = {
                ...pref,
                preferenceId: matchingOriginal.preferenceId,
                saved: true,
              };
              preferencesUpdated = true;
            }
          }
        }
        
        // Update formik state if we restored any preferenceIds (but use the restored array for filtering)
        if (preferencesUpdated) {
          formik.setFieldValue("preferences", restoredPreferences);
        }
        
        // Now filter using the restored preferences array
        const updatedSavedPreferences = restoredPreferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
        
        // Create a hash function to uniquely identify preferences
        const getPreferenceHash = (pref: PreferenceItem): string => {
          return `${pref.enrollmentType}|${pref.desiredCountry}|${pref.program}|${pref.desiredUniversity}|${pref.desiredCampus}|${pref.course}|${pref.desiredIntake}|${pref.assignCounselor}|${pref.agencyPartnerName}`;
        };
        
        // Filter out preferences that have already been sent to API (by hash) or have preferenceId
        const preferencesToCreate = updatedSavedPreferences.filter((pref) => {
          if (pref.preferenceId) return false; // Skip if already has preferenceId
          const hash = getPreferenceHash(pref);
          return !preferencesSentToApiRef.current.has(hash); // Skip if already sent to API
        });

        // If no new preferences to create, skip API calls
        // Note: PUT API for existing preferences is only called from individual preference card Save button
        if (preferencesToCreate.length === 0) {
          
          // Reset submitting flag
          isSubmittingRef.current = false;
          setIsSaving(false);
          dispatch(hideLoader());
          
          // Mark data as saved (in case it wasn't marked before)
          markAsSaved({ preferences: [...values.preferences] });
          
          // Still navigate if needed
          if (shouldNavigateNext && onSaveAndNext) {
            onSaveAndNext();
            setShouldNavigateNext(false);
          }
          return;
        }

        // Create new preferences using POST (only for new preferences without preferenceId)
        if (preferencesToCreate.length > 0) {
          // Mark these preferences as sent to API before making the call
          preferencesToCreate.forEach((pref) => {
            const hash = getPreferenceHash(pref);
            preferencesSentToApiRef.current.add(hash);
          });
          
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
            
            // Note: preferencesSentToApiRef is already updated before the API call, so no need to update here
          } else {
            throw new Error(createResponse.message || "Failed to create application preferences");
          }
        }

        // Show success toast
        const successMessage = t("applicant.preferencesSaved", "Application preferences saved successfully");

        dispatch(
          addToast({
            type: "success",
            message: successMessage,
          })
        );

        // Mark data as saved and update original preferences
        const finalPreferences = [...values.preferences];
        markAsSaved({ preferences: finalPreferences });
        
        // Update original preferences ref with current state after save
        originalPreferencesRef.current = finalPreferences.map(pref => ({ ...pref }));

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
  // Note: We use markAsSaved to track when data is saved, but we rely on the specific
  // preferencesToUpdate/preferencesToCreate checks in onSubmit for accurate change detection
  const { markAsSaved } = useDataChangeTracking<ApplicationPreferencesFormData>(
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
          currentItem.enrollmentType !== lastItem.enrollmentType ||
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

    const countryIdStr = countryId.toString();
    // Skip if already fetched for this country
    if (fetchedUniversitiesRef.current.has(countryIdStr)) {
      // Update main universityOptions state from map if available
      const cachedOptions = universityOptionsMapRef.current.get(countryIdStr);
      if (cachedOptions) {
        setUniversityOptions(cachedOptions);
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

      // Store in map for this country
      universityOptionsMapRef.current.set(countryIdStr, options);
      // Also update the main universityOptions state (for backward compatibility)
      setUniversityOptions(options);
      fetchedUniversitiesRef.current.add(countryIdStr);
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

    const universityIdStr = universityId.toString();
    // Skip if already fetched for this university
    if (fetchedCampusesRef.current.has(universityIdStr)) {
      // Update main campusOptions state from map if available
      const cachedOptions = campusOptionsMapRef.current.get(universityIdStr);
      if (cachedOptions) {
        setCampusOptions(cachedOptions);
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

      // Store in map for this university
      campusOptionsMapRef.current.set(universityIdStr, options);
      // Also update the main campusOptions state (for backward compatibility)
      setCampusOptions(options);
      fetchedCampusesRef.current.add(universityIdStr);
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
    if (!user?.agencyId || !campusId || !courseType) {
      if (!campusId || !courseType) {
        // Clear courses if no campus or course type selected
        setCourseOptions([]);
      }
      return;
    }

    // Create a key for this campus-program combination
    const key = `${campusId}-${courseType}`;

    // Skip if already fetched for this campus-program combination
    if (fetchedCoursesRef.current.has(key)) {
      // Still update the main courseOptions state from map if available
      const cachedOptions = courseOptionsMapRef.current.get(key);
      if (cachedOptions) {
        setCourseOptions(cachedOptions);
      }
      return;
    }

    // If already fetching, don't fetch again
    if (isFetchingCoursesRef.current) {
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

      // Store in map for future use
      const newMap = new Map(courseOptionsMapRef.current);
      newMap.set(key, options);
      courseOptionsMapRef.current = newMap;
      fetchedCoursesRef.current.add(key);

      setCourseOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch courses");
      dispatch(addToast({ type: "error", message }));
      setCourseOptions([]);
    } finally {
      isFetchingCoursesRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch agency partner names
  const fetchAgencyPartnerNames = useCallback(async () => {
    if (!user?.agencyId || hasFetchedAgencyPartnersRef.current || isFetchingAgencyPartnersRef.current) {
      return;
    }

    isFetchingAgencyPartnersRef.current = true;

    try {
      const agencyPartners = await applicantService.getAgencyPartnerNames(user.agencyId);

      // Convert to SelectOption format
      const options: SelectOption[] = agencyPartners.map((partner) => ({
        value: partner.id.toString(),
        label: partner.name,
      }));

      setAgencyPartnerOptions(options);
      hasFetchedAgencyPartnersRef.current = true;
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch agency partner names");
      dispatch(addToast({ type: "error", message }));
      setAgencyPartnerOptions([]);
      hasFetchedAgencyPartnersRef.current = false; // Allow retry on error
    } finally {
      isFetchingAgencyPartnersRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch enrollment types from API
  const fetchEnrollmentTypes = useCallback(async () => {
    if (isFetchingEnrollmentTypesRef.current || hasFetchedEnrollmentTypesRef.current) {
      return;
    }

    isFetchingEnrollmentTypesRef.current = true;

    try {
      const enrollmentTypes = await applicantService.getEnrollmentTypes();

      // Convert to SelectOption format, filter by isActive and sort by sortOrder
      const options: SelectOption[] = enrollmentTypes
        .filter((type) => type.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((type) => ({
          value: type.code,
          label: type.name,
        }));

      // Create mapping from code to ID for API conversion
      const idMap = new Map<string, number>();
      enrollmentTypes
        .filter((type) => type.isActive)
        .forEach((type) => {
          idMap.set(type.code, type.id);
        });
      enrollmentTypeIdMapRef.current = idMap;

      setEnrollmentTypeOptions(options);
      hasFetchedEnrollmentTypesRef.current = true;
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch enrollment types");
      dispatch(addToast({ type: "error", message }));
      hasFetchedEnrollmentTypesRef.current = false; // Allow retry on error
    } finally {
      isFetchingEnrollmentTypesRef.current = false;
    }
  }, [dispatch]);

  // Fetch countries, agency partners, and enrollment types when component mounts
  useEffect(() => {
    if (user?.agencyId) {
      fetchCountries();
      fetchAgencyPartnerNames();
    }
    // Fetch enrollment types (no agencyId required)
    fetchEnrollmentTypes();
  }, [user?.agencyId, fetchCountries, fetchAgencyPartnerNames, fetchEnrollmentTypes]);

  // Note: Counselors are now fetched dynamically when a country is selected
  // The old fetchCounselors() call is removed as we now use fetchCounselorsByCountry()

  // Fetch application preferences when applicantId is available
  // This handles:
  // 1. After "Save & Next" from personal details (applicantId is set)
  // 2. After POST/PUT operations (already handled in onSubmit)
  // 3. After back button from educational details (applicantId is available)
  // Note: Ensure enrollment types are fetched first before fetching preferences
  useEffect(() => {
    if (applicantId && !isFetchingPreferencesRef.current && hasFetchedEnrollmentTypesRef.current) {
      // Check if we've already fetched preferences for this applicantId
      const hasAlreadyFetched = hasFetchedPreferencesRef.current && 
                                lastFetchedApplicantIdRef.current?.toString() === applicantId.toString();
      
      // Only fetch if:
      // 1. We haven't fetched before for this applicantId, AND
      // 2. We don't have saved preferences with preferenceId
      // 3. Enrollment types have been fetched (needed for mapping enrollmentTypeId to code)
      if (!hasAlreadyFetched) {
        const hasSavedPreferences = formik.values.preferences.some(pref => pref.saved && pref.preferenceId);
        
        // Fetch if no saved preferences exist (this includes empty array case)
        if (!hasSavedPreferences) {
          fetchApplicationPreferences(applicantId);
        } else {
          // If we have saved preferences, mark as fetched to prevent re-fetching
          hasFetchedPreferencesRef.current = true;
          lastFetchedApplicantIdRef.current = applicantId;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId, hasFetchedEnrollmentTypesRef.current]); // Depend on enrollment types being fetched

  // Fetch application preferences from API
  const fetchApplicationPreferences = useCallback(async (id: number | string) => {
    if (!id || isFetchingPreferencesRef.current) {
      return;
    }

    // Ensure enrollment types are fetched first (needed for mapping enrollmentTypeId to code)
    if (!hasFetchedEnrollmentTypesRef.current) {
      await fetchEnrollmentTypes();
    }

    // Check if we've already fetched for this applicantId
    if (hasFetchedPreferencesRef.current && lastFetchedApplicantIdRef.current?.toString() === id.toString()) {
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

            // Extract enrollmentType code from the API response
            // API returns enrollmentType as an object: {id: number, name: string}
            // The 'name' field contains the code (e.g., "WALK_IN")
            let enrollmentTypeCode = "";
            if (pref.enrollmentType) {
              if (typeof pref.enrollmentType === 'object' && pref.enrollmentType !== null && 'name' in pref.enrollmentType) {
                // enrollmentType is an object with name property (the code)
                enrollmentTypeCode = pref.enrollmentType.name;
              } else if (typeof pref.enrollmentType === 'string') {
                // Fallback: if it's already a string, use it directly
                enrollmentTypeCode = pref.enrollmentType;
              }
            }

            return {
              id: `pref-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
              preferenceId: pref.preferenceId || null,
              enrollmentType: enrollmentTypeCode,
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
            agencyPartnerName: (() => {
              const agencyPartner = pref.agencyPartner;
              if (!agencyPartner) return "";
              if (typeof agencyPartner === 'object' && 'id' in agencyPartner) {
                return agencyPartner.id.toString();
              }
              if (typeof agencyPartner === 'number') {
                return agencyPartner.toString();
              }
              return "";
            })(),
            saved: true,
            };
          });

          // Fetch dependent dropdowns for all preferences to ensure all options are loaded
          // Collect unique combinations to avoid duplicate API calls
          const uniqueCountries = new Set<string>();
          const uniqueUniversityCountryPairs = new Set<string>();
          const uniqueCampusUniversityPairs = new Set<string>();
          const uniqueCourseCampusProgramPairs = new Set<string>();

          mappedPreferences.forEach((pref) => {
            if (pref.desiredCountry) {
              uniqueCountries.add(pref.desiredCountry);
            }
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

          // Fetch universities for all unique countries
          for (const countryIdStr of uniqueCountries) {
            const countryId = parseInt(countryIdStr);
            if (!isNaN(countryId) && user?.agencyId) {
              await fetchUniversities(countryId);
            }
          }

          // Fetch campuses for all unique university-country combinations
          for (const pair of uniqueCampusUniversityPairs) {
            const [universityIdStr] = pair.split('-');
            const universityId = parseInt(universityIdStr);
            if (!isNaN(universityId) && user?.agencyId) {
              await fetchCampuses(universityId);
            }
          }

          // Fetch courses for all unique campus-program combinations
          for (const pair of uniqueCourseCampusProgramPairs) {
            const [campusIdStr, program] = pair.split('-');
            const campusId = parseInt(campusIdStr);
            if (!isNaN(campusId) && program && user?.agencyId) {
              await fetchCourses(campusId, program);
            }
          }

          // Fetch counselors for all unique countries to ensure counselor options are loaded
          for (const countryIdStr of uniqueCountries) {
            const countryId = parseInt(countryIdStr);
            if (!isNaN(countryId) && user?.agencyId) {
              await fetchCounselorsByCountry(countryId);
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
        
        // Populate preferencesSentToApiRef with hashes of existing preferences (those with preferenceId)
        // This prevents duplicate POST calls when user navigates back to this tab
        const getPreferenceHash = (pref: PreferenceItem): string => {
          return `${pref.enrollmentType}|${pref.desiredCountry}|${pref.program}|${pref.desiredUniversity}|${pref.desiredCampus}|${pref.course}|${pref.desiredIntake}|${pref.assignCounselor}|${pref.agencyPartnerName}`;
        };
        
        mappedPreferences.forEach((pref) => {
          // Only add to Set if preference has preferenceId (was already saved to API)
          if (pref.preferenceId) {
            const hash = getPreferenceHash(pref);
            preferencesSentToApiRef.current.add(hash);
          }
        });
        
        // Mark as fetched to prevent duplicate API calls
        hasFetchedPreferencesRef.current = true;
        lastFetchedApplicantIdRef.current = id;
        
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
  }, [dispatch, applicantService, formik, onUpdate, user?.agencyId, fetchUniversities, fetchCampuses, fetchCourses, getEmptyPreference, fetchEnrollmentTypes]);

  // Reset fetch flags when applicantId changes (new applicant)
  useEffect(() => {
    if (applicantId && lastFetchedApplicantIdRef.current?.toString() !== applicantId.toString()) {
      hasFetchedPreferencesRef.current = false;
    }
  }, [applicantId]);


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
  // Fetch courses for all preferences to ensure all course names are available for display
  useEffect(() => {
    if (!user?.agencyId) return;

    // Collect all unique campus-program combinations from all preferences
    const courseCombinations = new Set<string>();
    
    formik.values.preferences.forEach((pref) => {
      if (pref.desiredCampus && pref.desiredCampus !== "" && pref.program && pref.program !== "") {
        const key = `${pref.desiredCampus}-${pref.program}`;
        courseCombinations.add(key);
      }
    });

    // Fetch courses for each unique combination that we don't already have in the map
    courseCombinations.forEach((combination) => {
      const [campusIdStr, program] = combination.split('-');
      const campusIdNum = parseInt(campusIdStr);
      
      if (!isNaN(campusIdNum) && program) {
        // Check if we already have this combination in the map (using ref to avoid stale closure)
        if (!courseOptionsMapRef.current.has(combination)) {
          // Fetch courses for this combination (will be stored in the map by fetchCourses)
          fetchCourses(campusIdNum, program);
        }
      }
    });
  }, [formik.values.preferences, user?.agencyId, fetchCourses]);

  // Check form validity - at least one complete preference required (saved or not)
  // This allows Save & Next to work even if preferences aren't saved yet (they'll be saved first)
  // Also consider preferences with preferenceId as valid (already saved to API) even if enrollmentType mapping failed
  useEffect(() => {
    const validPreferences = formik.values.preferences.filter((pref) => 
      isPreferenceComplete(pref) || !!pref.preferenceId
    );
    setIsFormValid(validPreferences.length > 0);
  }, [formik.values.preferences, isPreferenceComplete]);

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
          currentItem.enrollmentType !== prevItem.enrollmentType ||
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
      enrollmentType: true,
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
    handleEditPreference: baseHandleEditPreference,
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

  // Fetch counselors by country
  const fetchCounselorsByCountry = useCallback(async (countryId: number | string | null) => {
    if (!user?.agencyId || !countryId || isFetchingCounselorsRef.current) {
      if (!countryId) {
        // Clear counselors if no country selected
        setCounselorOptions([]);
      }
      return;
    }

    const countryIdStr = countryId.toString();
    // Skip if already fetched for this country
    if (counselorOptionsMapRef.current.has(countryIdStr)) {
      // Update main counselorOptions state from map
      const cachedOptions = counselorOptionsMapRef.current.get(countryIdStr);
      if (cachedOptions) {
        setCounselorOptions(cachedOptions);
      }
      return;
    }

    isFetchingCounselorsRef.current = true;

    try {
      const counselors = await applicantService.getCounselorsByCountry(user.agencyId, countryId);

      // Convert to SelectOption format
      const options: SelectOption[] = counselors.map((counselor) => ({
        value: counselor.id.toString(),
        label: counselor.name,
      }));

      // Store in map for this country
      counselorOptionsMapRef.current.set(countryIdStr, options);
      // Also update the main counselorOptions state (for backward compatibility)
      setCounselorOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch counselors");
      dispatch(addToast({ type: "error", message }));
      setCounselorOptions([]);
    } finally {
      isFetchingCounselorsRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Wrapper for handleEditPreference that fetches all necessary dropdowns when entering edit mode
  const handleEditPreference = useCallback(async (index: number) => {
    const preference = formik.values.preferences[index];
    
    if (!user?.agencyId) {
      baseHandleEditPreference(index);
      return;
    }
    
    // Fetch all dependent dropdowns based on the preference's current values
    // This ensures all dropdowns have the correct options when editing
    
    // 1. Fetch universities and counselors if country is selected
    if (preference.desiredCountry) {
      const countryIdNum = parseInt(preference.desiredCountry);
      if (!isNaN(countryIdNum)) {
        await Promise.all([
          fetchUniversities(countryIdNum),
          fetchCounselorsByCountry(countryIdNum)
        ]);
      }
    }
    
    // 2. Fetch campuses if university is selected
    if (preference.desiredUniversity) {
      const universityIdNum = parseInt(preference.desiredUniversity);
      if (!isNaN(universityIdNum)) {
        await fetchCampuses(universityIdNum);
      }
    }
    
    // 3. Fetch courses if campus and program are selected
    if (preference.desiredCampus && preference.program) {
      const campusIdNum = parseInt(preference.desiredCampus);
      if (!isNaN(campusIdNum)) {
        await fetchCourses(campusIdNum, preference.program);
      }
    }
    
    // Agency partners are already fetched on mount, so no need to fetch again
    
    // Set editing index to enter edit mode
    baseHandleEditPreference(index);
  }, [formik.values.preferences, user?.agencyId, fetchUniversities, fetchCampuses, fetchCourses, fetchCounselorsByCountry, baseHandleEditPreference]);

  // Wrapper for updatePreferenceField that also handles university fetching when country changes
  const updatePreferenceField = useCallback(async (index: number, field: keyof PreferenceItem, value: string) => {
    // Update the field
    await baseUpdatePreferenceField(index, field, value);

    // Get current preference values for dependent field updates
    const currentPreference = formik.values.preferences[index];

    // If country changed, fetch universities and counselors for that country
    if (field === "desiredCountry" && value) {
      const countryIdNum = parseInt(value);
      if (!isNaN(countryIdNum) && user?.agencyId) {
        setSelectedCountryId(countryIdNum);
        await fetchUniversities(countryIdNum);
        await fetchCounselorsByCountry(countryIdNum);
        
        // Clear university, campus, course, and counselor selection when country changes
        await formik.setFieldValue(`preferences[${index}].desiredUniversity`, "");
        await formik.setFieldValue(`preferences[${index}].desiredCampus`, "");
        await formik.setFieldValue(`preferences[${index}].course`, "");
        await formik.setFieldValue(`preferences[${index}].assignCounselor`, "");
      } else if (!value) {
        // Clear universities, campuses, courses, and counselors if country is cleared
        setSelectedCountryId(null);
        setUniversityOptions([]);
        setCampusOptions([]);
        setCourseOptions([]);
        setCounselorOptions([]);
        await formik.setFieldValue(`preferences[${index}].desiredUniversity`, "");
        await formik.setFieldValue(`preferences[${index}].desiredCampus`, "");
        await formik.setFieldValue(`preferences[${index}].course`, "");
        await formik.setFieldValue(`preferences[${index}].assignCounselor`, "");
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
          await fetchCourses(campusIdNum, value);
          
          // Clear course selection when program changes
          await formik.setFieldValue(`preferences[${index}].course`, "");
        }
      } else if (!value) {
        // Clear courses if program is cleared
        setCourseOptions([]);
        await formik.setFieldValue(`preferences[${index}].course`, "");
      }
    }

    // If campus changed, fetch courses if program is already selected
    if (field === "desiredCampus") {
      if (value && currentPreference.program) {
        const campusIdNum = parseInt(value);
        if (!isNaN(campusIdNum) && user?.agencyId) {
          await fetchCourses(campusIdNum, currentPreference.program);
          
          // Clear course selection when campus changes
          await formik.setFieldValue(`preferences[${index}].course`, "");
        }
      } else if (!value) {
        // Clear courses if campus is cleared
        setCourseOptions([]);
        await formik.setFieldValue(`preferences[${index}].course`, "");
      }
    }
  }, [baseUpdatePreferenceField, user?.agencyId, fetchUniversities, fetchCampuses, fetchCourses, fetchCounselorsByCountry, formik]);

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

    // If preference has preferenceId, it's an existing preference - call PUT API only if changed
    if (preference.preferenceId && applicantId) {
      // Check if preference has actually changed
      const original = originalPreferencesRef.current.find(
        (orig) => orig.preferenceId?.toString() === preference.preferenceId?.toString()
      );
      
      if (!hasPreferenceChanged(preference, original)) {
        // No changes, just mark as saved and close edit mode
        const updatedPreferences = [...formik.values.preferences];
        updatedPreferences[index] = {
          ...preference,
          saved: true,
        };
        formik.setFieldValue("preferences", updatedPreferences);
        
        if (editingIndex === index) {
          setEditingIndex(null);
        }
        
        dispatch(
          addToast({
            type: "success",
            message: t("applicant.preferenceAlreadySaved", "Preference already saved"),
          })
        );
        return;
      }
      
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
            // Extract enrollmentType code from the API response
            // API returns enrollmentType as an object: {id: number, name: string}
            // The 'name' field contains the code (e.g., "WALK_IN")
            let enrollmentTypeCode = preference.enrollmentType;
            if (responseData.enrollmentType) {
              if (typeof responseData.enrollmentType === 'object' && responseData.enrollmentType !== null && 'name' in responseData.enrollmentType) {
                // enrollmentType is an object with name property (the code)
                enrollmentTypeCode = responseData.enrollmentType.name;
              } else if (typeof responseData.enrollmentType === 'string') {
                // Fallback: if it's already a string, use it directly
                enrollmentTypeCode = responseData.enrollmentType;
              }
            }

            updatedPreferences[index] = {
              ...preference,
              preferenceId: responseData.preferenceId || preference.preferenceId,
              enrollmentType: enrollmentTypeCode,
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
          setIsSaving(false);
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
    setIsSaving,
    originalPreferencesRef,
    hasPreferenceChanged,
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

      const response = await applicantService.deleteApplicationPreference(preferenceToDelete.preferenceId, applicantId);

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

  // Handle Add More button - save current preferences to API if complete, then add new one
  const handleAddPreferenceWithAPI = useCallback(async () => {
    if (!applicantId) {
      dispatch(
        addToast({
          type: "error",
          message: t("applicant.applicantIdRequired", "Please save personal details first to get applicant ID"),
        })
      );
      return;
    }

    if (isSubmittingRef.current) {
      return;
    }

    // Check if there are any unsaved complete preferences
    // Also check originalPreferencesRef to see if preference was already saved (to prevent duplicate saves)
    // If a preference was already saved, restore its preferenceId synchronously before filtering
    let restoredPreferences = [...formik.values.preferences];
    let preferencesUpdated = false;
    
    for (let i = 0; i < restoredPreferences.length; i++) {
      const pref = restoredPreferences[i];
      if (!pref.saved && isPreferenceComplete(pref) && !pref.preferenceId) {
        // Check if this preference was already saved by matching against originalPreferencesRef
        const matchingOriginal = originalPreferencesRef.current.find((orig) => {
          if (!orig.preferenceId) return false;
          // Match by checking if all key fields are the same
          return (
            String(orig.enrollmentType || "").trim() === String(pref.enrollmentType || "").trim() &&
            String(orig.desiredCountry || "").trim() === String(pref.desiredCountry || "").trim() &&
            String(orig.program || "").trim() === String(pref.program || "").trim() &&
            String(orig.desiredUniversity || "").trim() === String(pref.desiredUniversity || "").trim() &&
            String(orig.desiredCampus || "").trim() === String(pref.desiredCampus || "").trim() &&
            String(orig.course || "").trim() === String(pref.course || "").trim() &&
            String(orig.desiredIntake || "").trim() === String(pref.desiredIntake || "").trim() &&
            String(orig.assignCounselor || "").trim() === String(pref.assignCounselor || "").trim() &&
            String(orig.agencyPartnerName || "").trim() === String(pref.agencyPartnerName || "").trim()
          );
        });
        
        if (matchingOriginal) {
          // Restore preferenceId and saved flag synchronously
          restoredPreferences[i] = {
            ...pref,
            preferenceId: matchingOriginal.preferenceId,
            saved: true,
          };
          preferencesUpdated = true;
        }
      }
    }
    
    // Now filter using the restored preferences array
    const unsavedCompletePreferences = restoredPreferences.filter(
      (pref: PreferenceItem) => !pref.saved && isPreferenceComplete(pref) && !pref.preferenceId
    );

    // If there are unsaved complete preferences, save them first
    if (unsavedCompletePreferences.length > 0) {
      // Create a hash function to uniquely identify preferences
      const getPreferenceHash = (pref: PreferenceItem): string => {
        return `${pref.desiredCountry}|${pref.program}|${pref.desiredUniversity}|${pref.desiredCampus}|${pref.course}|${pref.desiredIntake}|${pref.assignCounselor}|${pref.agencyPartnerName}`;
      };
      
      // Filter out preferences that have already been sent to API
      const preferencesToSave = unsavedCompletePreferences.filter((pref) => {
        const hash = getPreferenceHash(pref);
        return !preferencesSentToApiRef.current.has(hash);
      });
      
      // If all preferences have already been sent, skip API call and just add new preference
      if (preferencesToSave.length === 0) {
        // Update formik state with restored preferences and add new preference in one batch
        // Use startTransition to prevent flashing
        startTransition(() => {
          const finalPreferences = preferencesUpdated ? restoredPreferences : formik.values.preferences;
          const emptyPref = getEmptyPreference();
          formik.setFieldValue("preferences", [...finalPreferences, emptyPref]);
        });
        return;
      }
      
      // Mark these preferences as sent to API before making the call
      preferencesToSave.forEach((pref) => {
        const hash = getPreferenceHash(pref);
        preferencesSentToApiRef.current.add(hash);
      });
      
      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        const createPayload = preferencesToSave.map(convertPreferenceToApiFormat);
        const createResponse = await applicantService.createApplicationPreferences(applicantId, createPayload);

        if (createResponse.status === "success" && createResponse.data) {
          // Use restored preferences as base if we restored any, otherwise use current formik values
          // This ensures we have the latest state including any restorations
          const basePreferences = preferencesUpdated ? restoredPreferences : [...formik.values.preferences];
          const updatedPreferences = [...basePreferences];
          let responseIndex = 0;

          for (let i = 0; i < updatedPreferences.length; i++) {
            const pref = updatedPreferences[i];
            if (preferencesToSave.some((p: PreferenceItem) => p.id === pref.id)) {
              if (createResponse.data[responseIndex]) {
                const responseData = createResponse.data[responseIndex];
                updatedPreferences[i] = {
                  ...pref,
                  preferenceId: responseData.id || null,
                  saved: true,
                };
                responseIndex++;
              }
            }
          }

          // Add new empty preference in the same update to avoid flashing
          // Use startTransition to batch the update and prevent flashing
          startTransition(() => {
            const emptyPref = getEmptyPreference();
            const finalPreferences = [...updatedPreferences, emptyPref];

            // Batch all updates in a single setFieldValue call
            formik.setFieldValue("preferences", finalPreferences);
            onUpdate({ preferences: finalPreferences });
            originalPreferencesRef.current = updatedPreferences.map(pref => ({ ...pref }));
          });

          dispatch(
            addToast({
              type: "success",
              message: t("applicant.preferencesSaved", "Preferences saved successfully"),
            })
          );
        } else {
          throw new Error(createResponse.message || "Failed to save preferences");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save preferences");
        dispatch(addToast({ type: "error", message }));
      } finally {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
    } else {
      // No unsaved preferences, update formik with restored preferences (if any) and add new one in one batch
      if (preferencesUpdated) {
        // Use startTransition to prevent flashing
        startTransition(() => {
          const emptyPref = getEmptyPreference();
          formik.setFieldValue("preferences", [...restoredPreferences, emptyPref]);
        });
      } else {
        // No restoration needed, just add new preference
        handleAddPreference();
      }
    }
  }, [
    applicantId,
    formik,
    isPreferenceComplete,
    convertPreferenceToApiFormat,
    dispatch,
    t,
    onUpdate,
    originalPreferencesRef,
    setIsSaving,
    handleAddPreference,
  ]);

  const handleSave = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    // Validate all unsaved preferences first
    const unsavedPreferences = formik.values.preferences.filter((pref) => !pref.saved && isPreferenceComplete(pref));
    
    if (unsavedPreferences.length > 0) {
      // Validate each unsaved preference
      const preferenceSchema = getPreferenceSchema();

      let hasErrors = false;
      const touchedPreferences = [...(formik.touched.preferences || [])];

      for (const pref of unsavedPreferences) {
        const index = formik.values.preferences.findIndex((p) => p.id === pref.id);
        try {
          await preferenceSchema.validate(pref, { abortEarly: false });
        } catch (error) {
          hasErrors = true;
          // Mark all fields as touched to show errors
          touchedPreferences[index] = markAllFieldsAsTouched();
          handleValidationErrors(error, index);
        }
      }

      // Update touched state
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

    // Check if there are any preferences that need to be saved (no preferenceId)
    // Also check originalPreferencesRef to see if preference was already saved (to prevent duplicate saves)
    // If a preference was already saved, restore its preferenceId synchronously before filtering
    // Note: PUT API for existing preferences is only called from individual preference card Save button
    let restoredPreferences = [...formik.values.preferences];
    
    for (let i = 0; i < restoredPreferences.length; i++) {
      const pref = restoredPreferences[i];
      if (isPreferenceComplete(pref) && !pref.preferenceId) {
        // Check if this preference was already saved by matching against originalPreferencesRef
        const matchingOriginal = originalPreferencesRef.current.find((orig) => {
          if (!orig.preferenceId) return false;
          // Match by checking if all key fields are the same
          return (
            String(orig.enrollmentType || "").trim() === String(pref.enrollmentType || "").trim() &&
            String(orig.desiredCountry || "").trim() === String(pref.desiredCountry || "").trim() &&
            String(orig.program || "").trim() === String(pref.program || "").trim() &&
            String(orig.desiredUniversity || "").trim() === String(pref.desiredUniversity || "").trim() &&
            String(orig.desiredCampus || "").trim() === String(pref.desiredCampus || "").trim() &&
            String(orig.course || "").trim() === String(pref.course || "").trim() &&
            String(orig.desiredIntake || "").trim() === String(pref.desiredIntake || "").trim() &&
            String(orig.assignCounselor || "").trim() === String(pref.assignCounselor || "").trim() &&
            String(orig.agencyPartnerName || "").trim() === String(pref.agencyPartnerName || "").trim()
          );
        });
        
        if (matchingOriginal) {
          // Restore preferenceId and saved flag synchronously
          restoredPreferences[i] = {
            ...pref,
            preferenceId: matchingOriginal.preferenceId,
            saved: true,
          };
        }
      }
    }
    
    // Don't update formik state here if we're going to update it later anyway
    // We'll use restoredPreferences for filtering and update formik only when needed
    // This prevents unnecessary re-renders and flashing
    
    // Now filter using the restored preferences array
    const preferencesNeedingSave = restoredPreferences.filter((pref) => {
      return isPreferenceComplete(pref) && !pref.preferenceId;
    });

    // If no new preferences need to be created, skip API call
    // PUT API is only called from individual preference card Save button, not from main Save button
    if (preferencesNeedingSave.length === 0) {
      dispatch(
        addToast({
          type: "success",
          message: t("applicant.preferencesAlreadySaved", "Application preferences already saved"),
        })
      );
      return;
    }

    // Close edit mode if any preference was being edited
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    setShouldNavigateNext(false);
    // Submit the form (which will call API with preferences that need to be saved)
    // Note: Only POST API for new preferences, PUT API is only called from individual preference card Save button
    // Only submit if not already submitting to prevent duplicate calls
    if (!isSubmittingRef.current) {
      await formik.submitForm();
    }
  }, [isSaving, formik, editingIndex, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, isPreferenceComplete, dispatch, t, originalPreferencesRef]);

  const handleSaveAndNextClick = useCallback(async () => {
    if (isSaving || isSubmittingRef.current) return;

    // Validate and save all unsaved complete preferences first
    // Also check originalPreferencesRef to see if preference was already saved (to prevent duplicate saves)
    // If a preference was already saved, restore its preferenceId synchronously before filtering
    let updatedPreferences = [...formik.values.preferences];
    let preferencesUpdated = false;
    
    for (let i = 0; i < updatedPreferences.length; i++) {
      const pref = updatedPreferences[i];
      if (!pref.saved && isPreferenceComplete(pref) && !pref.preferenceId) {
        // Check if this preference was already saved by matching against originalPreferencesRef
        const matchingOriginal = originalPreferencesRef.current.find((orig) => {
          if (!orig.preferenceId) return false;
          // Match by checking if all key fields are the same
          return (
            String(orig.enrollmentType || "").trim() === String(pref.enrollmentType || "").trim() &&
            String(orig.desiredCountry || "").trim() === String(pref.desiredCountry || "").trim() &&
            String(orig.program || "").trim() === String(pref.program || "").trim() &&
            String(orig.desiredUniversity || "").trim() === String(pref.desiredUniversity || "").trim() &&
            String(orig.desiredCampus || "").trim() === String(pref.desiredCampus || "").trim() &&
            String(orig.course || "").trim() === String(pref.course || "").trim() &&
            String(orig.desiredIntake || "").trim() === String(pref.desiredIntake || "").trim() &&
            String(orig.assignCounselor || "").trim() === String(pref.assignCounselor || "").trim() &&
            String(orig.agencyPartnerName || "").trim() === String(pref.agencyPartnerName || "").trim()
          );
        });
        
        if (matchingOriginal) {
          // Restore preferenceId and saved flag synchronously
          updatedPreferences[i] = {
            ...pref,
            preferenceId: matchingOriginal.preferenceId,
            saved: true,
          };
          preferencesUpdated = true;
        }
      }
    }
    
    // Update formik state if we restored any preferenceIds
    if (preferencesUpdated) {
      formik.setFieldValue("preferences", updatedPreferences);
    }
    
    // Now filter using the updated preferences array
    const unsavedCompletePreferences = updatedPreferences.filter(
      (pref) => !pref.saved && isPreferenceComplete(pref) && !pref.preferenceId
    );
    
    // If there are unsaved complete preferences, save them first
    if (unsavedCompletePreferences.length > 0) {
      // Validate each unsaved preference
      const preferenceSchema = getPreferenceSchema();
      let hasErrors = false;
      const touchedPreferences = formik.values.preferences.map((pref, index) => {
        if (!pref.saved && isPreferenceComplete(pref)) {
          return markAllFieldsAsTouched();
        }
        return formik.touched.preferences?.[index] || {};
      });

      for (const pref of unsavedCompletePreferences) {
        const index = formik.values.preferences.findIndex((p) => p.id === pref.id);
        try {
          await preferenceSchema.validate(pref, { abortEarly: false });
        } catch (error) {
          hasErrors = true;
          touchedPreferences[index] = markAllFieldsAsTouched();
          handleValidationErrors(error, index);
        }
      }

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

      // Save unsaved complete preferences via POST API before proceeding
      if (!applicantId) {
        dispatch(
          addToast({
            type: "error",
            message: t("applicant.applicantIdRequired", "Please save personal details first to get applicant ID"),
          })
        );
        return;
      }

      if (isSubmittingRef.current) return;

      // Create a hash function to uniquely identify preferences
      const getPreferenceHash = (pref: PreferenceItem): string => {
        return `${pref.desiredCountry}|${pref.program}|${pref.desiredUniversity}|${pref.desiredCampus}|${pref.course}|${pref.desiredIntake}|${pref.assignCounselor}|${pref.agencyPartnerName}`;
      };
      
      // Filter out preferences that have already been sent to API
      const preferencesToSave = unsavedCompletePreferences.filter((pref) => {
        const hash = getPreferenceHash(pref);
        return !preferencesSentToApiRef.current.has(hash);
      });
      
      // If all preferences have already been sent, skip API call
      if (preferencesToSave.length === 0) {
        // Reset submitting flag
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
        
        // Check if there are any remaining preferences to save after restoration
        const finalCheck = formik.values.preferences.filter((pref: PreferenceItem) => isPreferenceComplete(pref) && !pref.preferenceId);
        if (finalCheck.length === 0) {
          if (onSaveAndNext) {
            onSaveAndNext();
          }
        }
        return;
      }
      
      // Mark these preferences as sent to API before making the call
      preferencesToSave.forEach((pref) => {
        const hash = getPreferenceHash(pref);
        preferencesSentToApiRef.current.add(hash);
      });

      isSubmittingRef.current = true;
      setIsSaving(true);
      dispatch(showLoader());

      try {
        const createPayload = preferencesToSave.map(convertPreferenceToApiFormat);
        const createResponse = await applicantService.createApplicationPreferences(applicantId, createPayload);

        if (createResponse.status === "success" && createResponse.data) {
          const updatedPreferences = [...formik.values.preferences];
          let responseIndex = 0;

          for (let i = 0; i < updatedPreferences.length; i++) {
            const pref = updatedPreferences[i];
            if (preferencesToSave.some((p: PreferenceItem) => p.id === pref.id)) {
              if (createResponse.data[responseIndex]) {
                const responseData = createResponse.data[responseIndex];
                updatedPreferences[i] = {
                  ...pref,
                  preferenceId: responseData.id || null,
                  saved: true,
                };
                responseIndex++;
              }
            }
          }

          formik.setFieldValue("preferences", updatedPreferences);
          onUpdate({ preferences: updatedPreferences });
          originalPreferencesRef.current = updatedPreferences.map(pref => ({ ...pref }));

          dispatch(
            addToast({
              type: "success",
              message: t("applicant.preferencesSaved", "Preferences saved successfully"),
            })
          );

          // After saving unsaved preferences, check if there are any saved preferences
          // Use the updated preferences array to check (not formik.values which might be stale)
          const savedPreferencesAfterSave = updatedPreferences.filter(
            (pref) => pref.saved && isPreferenceComplete(pref)
          );

          // Reset flags first
          isSubmittingRef.current = false;
          setIsSaving(false);
          dispatch(hideLoader());

          // After successfully saving preferences, navigate immediately if we have any saved preferences
          // Use updatedPreferences array which has the latest data with preferenceId and saved flags set
          // This ensures we navigate right after saving, before any stale formik value checks
          if (savedPreferencesAfterSave.length > 0) {
            if (onSaveAndNext) {
              onSaveAndNext();
            }
            return; // Exit early - navigate immediately after saving, don't continue to validation check below
          }

          // If no saved preferences found after saving, this is unexpected
          // Wait a bit for formik state to update and continue to validation as fallback
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          throw new Error(createResponse.message || "Failed to save preferences");
        }
      } catch (error: any) {
        const { message } = handleApiError(error, "Failed to save preferences");
        dispatch(addToast({ type: "error", message }));
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
        return; // Don't proceed if save failed
      }
    }

    // Validate all saved preferences before proceeding
    // This check only runs if we didn't save any preferences in the block above
    // (i.e., there were no unsaved complete preferences to save)
    const savedPreferences = formik.values.preferences.filter((pref) => pref.saved && isPreferenceComplete(pref));
    if (savedPreferences.length === 0) {
      // Show error and reset flags
      dispatch(
        addToast({
          type: "error",
          message: t("validation.atLeastOnePreferenceRequired", "At least one complete preference is required"),
        })
      );
      // Reset flags if they're still set
      if (isSubmittingRef.current) {
        isSubmittingRef.current = false;
        setIsSaving(false);
        dispatch(hideLoader());
      }
      return;
    }

    // Check if there are any preferences that need to be saved (no preferenceId)
    // Also check originalPreferencesRef to see if preference was already saved (to prevent duplicate saves)
    // Note: PUT API for existing preferences is only called from individual preference card Save button
    const preferencesNeedingSave = formik.values.preferences.filter((pref) => {
      if (!isPreferenceComplete(pref) || pref.preferenceId) {
        return false; // Skip if incomplete or already has preferenceId
      }
      // Check if this preference was already saved (exists in originalPreferencesRef with same data)
      const alreadySaved = originalPreferencesRef.current.some((orig) => {
        // Match by checking if all key fields are the same
        return (
          orig.enrollmentType === pref.enrollmentType &&
          orig.desiredCountry === pref.desiredCountry &&
          orig.program === pref.program &&
          orig.desiredUniversity === pref.desiredUniversity &&
          orig.desiredCampus === pref.desiredCampus &&
          orig.course === pref.course &&
          orig.desiredIntake === pref.desiredIntake &&
          orig.assignCounselor === pref.assignCounselor &&
          orig.agencyPartnerName === pref.agencyPartnerName &&
          orig.preferenceId !== null // Must have been saved (has preferenceId)
        );
      });
      return !alreadySaved; // Only include if not already saved
    });

    // If no new preferences need to be created, just navigate
    // PUT API is only called from individual preference card Save button, not from Save & Next button
    if (preferencesNeedingSave.length === 0) {
      // Navigate to next step without API call
      if (onSaveAndNext) {
        onSaveAndNext();
      }
      return;
    }

    // Close edit mode if any preference was being edited
    if (editingIndex !== null) {
      setEditingIndex(null);
    }

    setShouldNavigateNext(true);
    // Submit form and then navigate (navigation happens in onSubmit)
    // Note: Only POST API for new preferences, PUT API is only called from individual preference card Save button
    // Only call if not already submitting to prevent duplicate calls when user clicks multiple times
    if (!isSubmittingRef.current) {
      await formik.submitForm();
    } else {
      // If already submitting, just navigate (the save is already in progress)
      if (onSaveAndNext) {
        onSaveAndNext();
      }
    }
  }, [isSaving, formik, editingIndex, getPreferenceSchema, markAllFieldsAsTouched, handleValidationErrors, isPreferenceComplete, dispatch, t, onSaveAndNext, applicantId, convertPreferenceToApiFormat, applicantService, onUpdate, originalPreferencesRef, setIsSaving]);


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
            onAddMore={handleAddPreferenceWithAPI}
            showCancel={incomplete.length > 1 || complete.length > 0}
            showAddMore={true}
            enrollmentTypeOptions={enrollmentTypeOptions}
            countryOptions={countryOptions}
            universityOptions={universityOptions}
            campusOptions={campusOptions}
            courseOptions={courseOptions}
            counselorOptions={counselorOptions}
            agencyPartnerOptions={agencyPartnerOptions}
          />
        )}

        {/* Show Add More button if all preferences are complete */}
        {incomplete.length === 0 && formik.values.preferences.length > 0 && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="accent"
              onClick={handleAddPreferenceWithAPI}
              disabled={!applicantId || isSaving}
              isLoading={isSaving}
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

              // Get university options for this specific preference based on its country
              const preferenceUniversityOptions = (() => {
                if (preference.desiredCountry) {
                  const countryIdStr = preference.desiredCountry;
                  // Use ref to get the latest map value
                  return universityOptionsMapRef.current.get(countryIdStr) || universityOptions;
                }
                return universityOptions;
              })();

              // Get campus options for this specific preference based on its university
              const preferenceCampusOptions = (() => {
                if (preference.desiredUniversity) {
                  const universityIdStr = preference.desiredUniversity;
                  // Use ref to get the latest map value
                  return campusOptionsMapRef.current.get(universityIdStr) || campusOptions;
                }
                return campusOptions;
              })();

              // Get course options for this specific preference based on its campus and program
              const preferenceCourseOptions = (() => {
                if (preference.desiredCampus && preference.program) {
                  const key = `${preference.desiredCampus}-${preference.program}`;
                  // Use ref to get the latest map value
                  return courseOptionsMapRef.current.get(key) || courseOptions;
                }
                return courseOptions;
              })();

              // Get counselor options for this specific preference based on its country
              const preferenceCounselorOptions = (() => {
                if (preference.desiredCountry) {
                  const countryIdStr = preference.desiredCountry;
                  // Use ref to get the latest map value
                  return counselorOptionsMapRef.current.get(countryIdStr) || counselorOptions;
                }
                return counselorOptions;
              })();

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
                  enrollmentTypeOptions={enrollmentTypeOptions}
                  countryOptions={countryOptions}
                  universityOptions={preferenceUniversityOptions}
                  campusOptions={preferenceCampusOptions}
                  courseOptions={preferenceCourseOptions}
                  counselorOptions={preferenceCounselorOptions}
                  agencyPartnerOptions={agencyPartnerOptions}
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
