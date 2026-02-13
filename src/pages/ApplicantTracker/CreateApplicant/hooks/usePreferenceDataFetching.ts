import { useCallback, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { addToast } from "../../../../redux/slices/toast/toastSlice";
import { applicantService } from "../../../../services";
import { handleApiError } from "../../../../utils";
import type { SelectOption } from "../../../../components";

/**
 * Hook to manage all data fetching for preference dropdowns
 * Handles countries, universities, campuses, courses, counselors, enrollment types, and agency partners
 */
export function usePreferenceDataFetching() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Countries
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const hasFetchedCountriesRef = useRef(false);
  const isFetchingCountriesRef = useRef(false);

  // Universities
  const [universityOptions, setUniversityOptions] = useState<SelectOption[]>([]);
  const isFetchingUniversitiesRef = useRef(false);
  const fetchedUniversitiesRef = useRef<Set<string>>(new Set());
  const universityOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());

  // Campuses
  const [campusOptions, setCampusOptions] = useState<SelectOption[]>([]);
  const isFetchingCampusesRef = useRef(false);
  const fetchedCampusesRef = useRef<Set<string>>(new Set());
  const campusOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());

  // Courses
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
  const [lastFetchedCourseKey, setLastFetchedCourseKey] = useState<string>(""); // Use state to trigger re-renders
  const isFetchingCoursesRef = useRef(false);
  const fetchedCoursesRef = useRef<Set<string>>(new Set());
  const courseOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());
  const lastFetchedCourseKeyRef = useRef<string>(""); // Keep ref for internal tracking

  // Counselors
  const [counselorOptions, setCounselorOptions] = useState<SelectOption[]>([]);
  const isFetchingCounselorsRef = useRef(false);
  const counselorOptionsMapRef = useRef<Map<string, SelectOption[]>>(new Map());

  // Agency Partners
  const [agencyPartnerOptions, setAgencyPartnerOptions] = useState<SelectOption[]>([]);
  const hasFetchedAgencyPartnersRef = useRef(false);
  const isFetchingAgencyPartnersRef = useRef(false);

  // Enrollment Types
  const [enrollmentTypeOptions, setEnrollmentTypeOptions] = useState<SelectOption[]>([]);
  const hasFetchedEnrollmentTypesRef = useRef(false);
  const isFetchingEnrollmentTypesRef = useRef(false);
  const enrollmentTypeIdMapRef = useRef<Map<string, number>>(new Map());

  // Program Types
  const [programTypeOptions, setProgramTypeOptions] = useState<SelectOption[]>([]);
  const hasFetchedProgramTypesRef = useRef(false);
  const isFetchingProgramTypesRef = useRef(false);
  const programTypeIdMapRef = useRef<Map<string, number>>(new Map());

  // Map program type string to program type ID using API data
  const mapProgramToProgramTypeId = useCallback((program: string): number | null => {
    if (!program) return null;
    // Use the API data if available, otherwise return null
    const programTypeId = programTypeIdMapRef.current.get(program.toUpperCase());
    if (!programTypeId) {
    }
    return programTypeId || null;
  }, []);

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    if (!user?.agencyId || hasFetchedCountriesRef.current || isFetchingCountriesRef.current) {
      return;
    }

    isFetchingCountriesRef.current = true;

    try {
      const response = await applicantService.getCountries(user.agencyId);
      
      // Handle both direct array response and wrapped ApiResponse
      let countries: any[] = [];
      if (Array.isArray(response)) {
        countries = response;
      } else if (response && typeof response === "object" && "status" in response) {
        if (response.status === "success" && response.data && Array.isArray(response.data)) {
          countries = response.data;
        }
      } else if (Array.isArray((response as any)?.data)) {
        countries = (response as any).data;
      }
      
      const options: SelectOption[] = countries.map((country: any) => ({
        value: country.id.toString(),
        label: country.name,
      }));

      setCountryOptions(options);
      hasFetchedCountriesRef.current = true;
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch countries");
      dispatch(addToast({ type: "error", message }));
      hasFetchedCountriesRef.current = false;
    } finally {
      isFetchingCountriesRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch universities
  const fetchUniversities = useCallback(async (countryId: number | string | null) => {
    if (!user?.agencyId || !countryId || isFetchingUniversitiesRef.current) {
      if (!countryId) {
        setUniversityOptions([]);
      }
      return;
    }

    const countryIdStr = countryId.toString();
    if (fetchedUniversitiesRef.current.has(countryIdStr)) {
      const cachedOptions = universityOptionsMapRef.current.get(countryIdStr);
      if (cachedOptions) {
        setUniversityOptions(cachedOptions);
      }
      return;
    }

    isFetchingUniversitiesRef.current = true;

    try {
      const universities = await applicantService.getUniversities(user.agencyId, countryId);
      const options: SelectOption[] = universities.map((university) => ({
        value: university.id.toString(),
        label: university.name,
      }));

      universityOptionsMapRef.current.set(countryIdStr, options);
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

  // Fetch campuses
  const fetchCampuses = useCallback(async (universityId: number | string | null) => {
    if (!user?.agencyId || !universityId || isFetchingCampusesRef.current) {
      if (!universityId) {
        setCampusOptions([]);
      }
      return;
    }

    const universityIdStr = universityId.toString();
    if (fetchedCampusesRef.current.has(universityIdStr)) {
      const cachedOptions = campusOptionsMapRef.current.get(universityIdStr);
      if (cachedOptions) {
        setCampusOptions(cachedOptions);
      }
      return;
    }

    isFetchingCampusesRef.current = true;

    try {
      const campuses = await applicantService.getCampuses(user.agencyId, universityId);
      const options: SelectOption[] = campuses.map((campus) => ({
        value: campus.id.toString(),
        label: campus.name,
      }));

      campusOptionsMapRef.current.set(universityIdStr, options);
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

  // Fetch courses
  const fetchCourses = useCallback(async (campusId: number | string | null, program: string | null) => {
    if (!user?.agencyId || !campusId || !program) {
      if (!campusId || !program) {
        setCourseOptions([]);
      }
      return;
    }

    const programTypeId = mapProgramToProgramTypeId(program);
    if (!programTypeId) {
      setCourseOptions([]);
      return;
    }

    const key = `${campusId}-${program}`;
    
    // Check if already fetched - return early WITHOUT updating lastFetchedCourseKey
    // Updating lastFetchedCourseKey causes infinite re-renders because it triggers incompleteCourseOptions recalculation
    if (fetchedCoursesRef.current.has(key)) {
      // Update ref but NOT state to prevent re-renders
      lastFetchedCourseKeyRef.current = key;
      // DON'T update state here - it causes infinite loops
      // The options are already in the ref, so they'll be available when needed
      return;
    }

    // Check if already fetching - return early
    if (isFetchingCoursesRef.current) {
      return;
    }

    isFetchingCoursesRef.current = true;

    try {
      const courses = await applicantService.getCourses(user.agencyId, campusId, programTypeId);
      
      const options: SelectOption[] = courses.map((course) => ({
        value: course.id.toString(),
        label: course.name,
      }));

      // Update refs first
      const newMap = new Map(courseOptionsMapRef.current);
      newMap.set(key, options);
      courseOptionsMapRef.current = newMap;
      fetchedCoursesRef.current.add(key);

      // Update both ref and state - state triggers re-render
      lastFetchedCourseKeyRef.current = key;
      setLastFetchedCourseKey(key); // Update state to trigger re-render
      
      // The state update will trigger incompleteCourseOptions to recalculate
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch courses");
      dispatch(addToast({ type: "error", message }));
      setCourseOptions([]);
    } finally {
      isFetchingCoursesRef.current = false;
    }
  }, [user?.agencyId, dispatch, mapProgramToProgramTypeId]);

  // Fetch counselors
  const fetchCounselorsByCountry = useCallback(async (countryId: number | string | null) => {
    if (!user?.agencyId || !countryId || isFetchingCounselorsRef.current) {
      if (!countryId) {
        setCounselorOptions([]);
      }
      return;
    }

    const countryIdStr = countryId.toString();
    if (counselorOptionsMapRef.current.has(countryIdStr)) {
      const cachedOptions = counselorOptionsMapRef.current.get(countryIdStr);
      if (cachedOptions) {
        setCounselorOptions(cachedOptions);
      }
      return;
    }

    isFetchingCounselorsRef.current = true;

    try {
      const counselors = await applicantService.getCounselorsByCountry(user.agencyId, countryId);
      const options: SelectOption[] = counselors.map((counselor) => ({
        value: counselor.id.toString(),
        label: counselor.name,
      }));

      counselorOptionsMapRef.current.set(countryIdStr, options);
      setCounselorOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch counselors");
      dispatch(addToast({ type: "error", message }));
      setCounselorOptions([]);
    } finally {
      isFetchingCounselorsRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch agency partners
  const fetchAgencyPartnerNames = useCallback(async () => {
    if (!user?.agencyId || hasFetchedAgencyPartnersRef.current || isFetchingAgencyPartnersRef.current) {
      return;
    }

    isFetchingAgencyPartnersRef.current = true;

    try {
      const agencyPartners = await applicantService.getAgencyPartnerNames(user.agencyId);
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
      hasFetchedAgencyPartnersRef.current = false;
    } finally {
      isFetchingAgencyPartnersRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch enrollment types
  const fetchEnrollmentTypes = useCallback(async () => {
    if (isFetchingEnrollmentTypesRef.current || hasFetchedEnrollmentTypesRef.current) {
      return;
    }

    isFetchingEnrollmentTypesRef.current = true;

    try {
      const enrollmentTypes = await applicantService.getEnrollmentTypes();
      const options: SelectOption[] = enrollmentTypes
        .filter((type) => type.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((type) => ({
          value: type.code,
          label: type.name,
        }));

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
      hasFetchedEnrollmentTypesRef.current = false;
    } finally {
      isFetchingEnrollmentTypesRef.current = false;
    }
  }, [dispatch]);

  // Fetch program types
  const fetchProgramTypes = useCallback(async () => {
    if (isFetchingProgramTypesRef.current || hasFetchedProgramTypesRef.current) {
      return;
    }

    isFetchingProgramTypesRef.current = true;

    try {
      const programTypes = await applicantService.getProgramTypes();
      const options: SelectOption[] = programTypes
        .filter((type) => type.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((type) => ({
          value: type.code,
          label: type.name,
        }));

      const idMap = new Map<string, number>();
      programTypes
        .filter((type) => type.isActive)
        .forEach((type) => {
          idMap.set(type.code, type.id);
        });
      programTypeIdMapRef.current = idMap;

      setProgramTypeOptions(options);
      hasFetchedProgramTypesRef.current = true;
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch program types");
      dispatch(addToast({ type: "error", message }));
      hasFetchedProgramTypesRef.current = false;
    } finally {
      isFetchingProgramTypesRef.current = false;
    }
  }, [dispatch]);

  return {
    // Options
    countryOptions,
    universityOptions,
    campusOptions,
    courseOptions,
    counselorOptions,
    agencyPartnerOptions,
    enrollmentTypeOptions,
    programTypeOptions,
    
    // Refs for internal state management
    universityOptionsMapRef,
    campusOptionsMapRef,
    courseOptionsMapRef,
    counselorOptionsMapRef,
    enrollmentTypeIdMapRef,
    programTypeIdMapRef,
    lastFetchedCourseKeyRef,
    lastFetchedCourseKey, // Expose state to trigger re-renders
    hasFetchedEnrollmentTypesRef, // Expose for checking if enrollment types are fetched
    hasFetchedProgramTypesRef, // Expose for checking if program types are fetched
    
    // Fetch functions
    fetchCountries,
    fetchUniversities,
    fetchCampuses,
    fetchCourses,
    fetchCounselorsByCountry,
    fetchAgencyPartnerNames,
    fetchEnrollmentTypes,
    fetchProgramTypes,
    
    // Utility functions
    mapProgramToProgramTypeId,
  };
}

