import { useMemo, useRef } from "react";
import type { PreferenceItem } from "../types";
import type { SelectOption } from "../../../../components";

interface UsePreferenceOptionsProps {
  completePreferences: PreferenceItem[];
  universityOptions: SelectOption[];
  campusOptions: SelectOption[];
  counselorOptions: SelectOption[];
  universityOptionsMapRef: React.MutableRefObject<Map<string, SelectOption[]>>;
  campusOptionsMapRef: React.MutableRefObject<Map<string, SelectOption[]>>;
  courseOptionsMapRef: React.MutableRefObject<Map<string, SelectOption[]>>;
  counselorOptionsMapRef: React.MutableRefObject<Map<string, SelectOption[]>>;
  lastFetchedCourseKeyRef: React.MutableRefObject<string>;
  lastFetchedCourseKey: string; // State value to trigger re-renders
  firstIncomplete: PreferenceItem | null;
}

/**
 * Hook to manage and memoize preference options for each preference
 * Creates stable references to prevent unnecessary re-renders
 */
export function usePreferenceOptions({
  completePreferences,
  universityOptions,
  campusOptions,
  counselorOptions,
  universityOptionsMapRef,
  campusOptionsMapRef,
  courseOptionsMapRef,
  counselorOptionsMapRef,
  lastFetchedCourseKey,
  firstIncomplete,
}: UsePreferenceOptionsProps) {
  // Create a stable key based on preference values to determine when course options might have changed
  const preferenceCourseKeys = useMemo(() => {
    return completePreferences.map(pref => 
      pref.desiredCampus && pref.program 
        ? `${pref.id}-${pref.desiredCampus}-${pref.program}-${pref.course || 'none'}` 
        : `${pref.id}-none`
    ).join('|');
  }, [completePreferences]);

  // Memoize option lookups for each preference to avoid recalculating on every render
  // Don't depend on lastFetchedCourseKey - it causes infinite loops
  // The refs will have the latest options when needed
  const preferenceOptionsMap = useMemo(() => {
    const map = new Map<string, {
      universityOptions: SelectOption[];
      campusOptions: SelectOption[];
      courseOptions: SelectOption[];
      counselorOptions: SelectOption[];
    }>();
    
    completePreferences.forEach((preference) => {
      const prefUniversityOptions = preference.desiredCountry
        ? (universityOptionsMapRef.current.get(preference.desiredCountry) || universityOptions)
        : universityOptions;
      
      const prefCampusOptions = preference.desiredUniversity
        ? (campusOptionsMapRef.current.get(preference.desiredUniversity) || campusOptions)
        : campusOptions;
      
      let prefCourseOptions: SelectOption[] = [];
      if (preference.desiredCampus && preference.program) {
        const key = `${preference.desiredCampus}-${preference.program}`;
        const cachedOptions = courseOptionsMapRef.current.get(key);
        prefCourseOptions = cachedOptions ? [...cachedOptions] : [];
      }
      
      if (preference.course) {
        const courseExists = prefCourseOptions.some(opt => opt.value === preference.course);
        if (!courseExists) {
          prefCourseOptions = [
            ...prefCourseOptions,
            {
              value: preference.course,
              label: preference.courseName || preference.course,
            }
          ];
        }
      }
      
      const prefCounselorOptions = preference.desiredCountry
        ? (counselorOptionsMapRef.current.get(preference.desiredCountry) || counselorOptions)
        : counselorOptions;
      
      map.set(preference.id, {
        universityOptions: prefUniversityOptions,
        campusOptions: prefCampusOptions,
        courseOptions: prefCourseOptions,
        counselorOptions: prefCounselorOptions,
      });
    });
    
    return map;
  }, [completePreferences, universityOptions, campusOptions, counselorOptions, preferenceCourseKeys, universityOptionsMapRef, campusOptionsMapRef, courseOptionsMapRef, counselorOptionsMapRef]);

  // Memoize courseOptions for incomplete preferences to ensure stable references
  // Use a stable key that only changes when relevant fields change
  // Check the ref to see if courses were fetched for this specific combination, but don't include counter in dependencies
  const incompleteCourseKey = useMemo(() => {
    if (!firstIncomplete) return "none";
    // Use state value to trigger recalculation when courses are fetched
    const key = `${firstIncomplete.id}-${firstIncomplete.desiredCampus || 'none'}-${firstIncomplete.program || 'none'}-${firstIncomplete.course || 'none'}-${lastFetchedCourseKey}`;
    return key;
  }, [firstIncomplete?.id, firstIncomplete?.desiredCampus, firstIncomplete?.program, firstIncomplete?.course, lastFetchedCourseKey]);

  // Use refs to store previous options to maintain stable references
  const prevOptionsRef = useRef<SelectOption[]>([]);
  const prevOptionsKeyRef = useRef<string>("");
  
  // Use ref to check if options have actually changed, avoiding state dependency
  // Read the ref value inside the memo to check if courses were fetched, but don't include it in dependencies
  // This way, when fields change, we recalculate and pick up the latest cached options
  const incompleteCourseOptions: SelectOption[] = useMemo(() => {
    if (!firstIncomplete) {
      const emptyArray: SelectOption[] = [];
      prevOptionsRef.current = emptyArray;
      prevOptionsKeyRef.current = "";
      return emptyArray; // Return empty array, not courseOptions state to prevent re-renders
    }
    
    if (firstIncomplete.desiredCampus && firstIncomplete.program) {
      const key = `${firstIncomplete.desiredCampus}-${firstIncomplete.program}`;
      const cachedOptions = courseOptionsMapRef.current.get(key);
      
      // Use cached options directly if available, otherwise empty array
      let options: SelectOption[] = cachedOptions ? [...cachedOptions] : [];
      
      // Only add current course if it's not already in the options
      if (firstIncomplete.course) {
        const courseExists = options.some(opt => opt.value === firstIncomplete.course);
        if (!courseExists) {
          options = [
            ...options,
            {
              value: firstIncomplete.course,
              label: firstIncomplete.courseName || firstIncomplete.course,
            }
          ];
        }
      }
      
      // Create a stable key to compare options
      const optionsKey = JSON.stringify(options.map(opt => ({ value: opt.value, label: opt.label })));
      
      // If options haven't changed, return previous reference to prevent re-render
      if (prevOptionsKeyRef.current === optionsKey && prevOptionsRef.current.length === options.length) {
        return prevOptionsRef.current; // Return previous reference to maintain stability
      }
      
      // Options changed, update refs and return new array
      prevOptionsKeyRef.current = optionsKey;
      prevOptionsRef.current = options;
      return options;
    }
    
    // Return empty array if no campus/program
    const emptyArray: SelectOption[] = [];
    prevOptionsRef.current = emptyArray;
    prevOptionsKeyRef.current = "";
    return emptyArray;
  }, [incompleteCourseKey, firstIncomplete, courseOptionsMapRef]); // Don't include lastFetchedCourseKeyRef - read it inside instead

  return {
    preferenceOptionsMap,
    incompleteCourseOptions,
  };
}

