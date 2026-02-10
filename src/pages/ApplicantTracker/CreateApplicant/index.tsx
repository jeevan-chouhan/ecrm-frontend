import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../../components";
import ApplicantPersonalDetails from "./ApplicantPersonalDetails";
import ApplicationPreferences from "./ApplicationPreferences";
import EducationalDetails from "./EducationalDetails";
import WorkExperience from "./WorkExperience";
import Achievements from "./Achievements";
import { COLORS, ROUTES, typography } from "../../../constants";
import type {
  ApplicantFormState,
  PersonalDetailsFormData,
  ApplicationPreferencesFormData,
  EducationalDetailFormData,
  WorkExperienceFormData,
  AchievementFormData,
} from "./types";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

type TabType = "personal" | "preferences" | "educational" | "work" | "achievements";

interface Tab {
  id: TabType;
  labelKey: string;
}

// Initial state for all forms
const getInitialFormState = (): ApplicantFormState => ({
  personalDetails: {
    profilePhoto: null,
    name: "",
    dateOfBirth: null,
    gender: "",
    countryCode: "",
    contactNumber: "",
    emailId: "",
    permanentAddress: "",
    notes: "",
  },
  applicationPreferences: {
    preferences: [],
  },
  educationalDetails: {
    highestQualification: "",
    institutionName: "",
    boardUniversity: "",
    program: "",
    major: "",
    scoreType: "",
    score: "",
    passingYear: null,
  },
  workExperience: {
    hasWorkExperience: "",
    workExperiences: [],
  },
  achievements: {
    hasAchievements: "",
    achievements: [],
  },
});

const CreateApplicant = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const applicantIdFromUrl = searchParams.get("applicantId");
  const [applicantId, setApplicantId] = useState<number | string | null>(applicantIdFromUrl);
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [formState, setFormState] = useState<ApplicantFormState>(getInitialFormState());
  const [isEditMode, setIsEditMode] = useState(false);
  const hasFetchedPersonalDetailsRef = useRef(false);
  const isFetchingPersonalDetailsRef = useRef(false);

  // Memoize tabs array to prevent recreation on every render
  const tabs: Tab[] = useMemo(() => [
    { id: "personal", labelKey: "applicant.personalDetails" },
    { id: "preferences", labelKey: "applicant.applicationPreferences" },
    { id: "educational", labelKey: "applicant.educationalDetails" },
    { id: "work", labelKey: "applicant.workExperience" },
    { id: "achievements", labelKey: "applicant.achievements" },
  ], []);

  // Memoize tab navigation handlers
  const handleNextTab = useCallback(() => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  }, [activeTab, tabs]);

  const handlePreviousTab = useCallback(() => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex > 0) {
      const previousTab = tabs[currentIndex - 1].id;
      setActiveTab(previousTab);
      
      // If going back to personal tab and we have applicantId, fetch data if not already fetched
      // The useEffect will handle the fetch when activeTab changes to "personal"
      if (previousTab === "personal" && applicantId) {
        // Reset fetch flag to allow re-fetch if needed (e.g., data might have changed)
        // hasFetchedPersonalDetailsRef.current = false;
        // Actually, we don't want to re-fetch unnecessarily, so we'll let the useEffect handle it
      }
    }
  }, [activeTab, tabs, applicantId]);

  // Handlers to update form state
  const updatePersonalDetails = useCallback((data: PersonalDetailsFormData) => {
    setFormState((prev) => ({ ...prev, personalDetails: data }));
  }, []);

  const updateApplicationPreferences = useCallback((data: ApplicationPreferencesFormData) => {
    setFormState((prev) => ({ ...prev, applicationPreferences: data }));
  }, []);

  const updateEducationalDetails = useCallback((data: EducationalDetailFormData) => {
    setFormState((prev) => ({ ...prev, educationalDetails: data }));
  }, []);

  const updateWorkExperience = useCallback((data: WorkExperienceFormData) => {
    setFormState((prev) => ({ ...prev, workExperience: data }));
  }, []);

  const updateAchievements = useCallback((data: AchievementFormData) => {
    setFormState((prev) => ({ ...prev, achievements: data }));
  }, []);

  // Fetch personal details when applicantId is present (edit mode or back navigation)
  const fetchPersonalDetails = useCallback(async (id: number | string) => {
    if (isFetchingPersonalDetailsRef.current) {
      return;
    }

    isFetchingPersonalDetailsRef.current = true;
    dispatch(showLoader());

    try {
      const response = await applicantService.getPersonalDetails(id);

      if (response.status === "success" && response.data) {
        const data = response.data;
        
        // Map API response to PersonalDetailsFormData
        const personalDetails: PersonalDetailsFormData = {
          profilePhoto: null, // Profile photo would need separate handling if URL is returned
          name: data.name || "",
          dateOfBirth: data.dob ? new Date(data.dob + "T00:00:00") : null, // Add time to avoid timezone issues
          gender: data.gender || "",
          countryCode: data.countryCode || "",
          contactNumber: data.contactNumber || "",
          emailId: data.email || "",
          permanentAddress: data.permanentAddress || "",
          notes: data.notes || "",
        };

        // Update form state with fetched data
        setFormState((prev) => ({
          ...prev,
          personalDetails,
        }));

        setIsEditMode(true);
        hasFetchedPersonalDetailsRef.current = true;
      } else {
        throw new Error(response.message || "Failed to fetch personal details");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch personal details");
      dispatch(addToast({ type: "error", message }));
      
      // On error, reset to initial state
      setIsEditMode(false);
      setFormState(getInitialFormState());
    } finally {
      isFetchingPersonalDetailsRef.current = false;
      dispatch(hideLoader());
    }
  }, [dispatch]);

  // Handle applicantId from URL or state changes
  useEffect(() => {
    const currentApplicantId = applicantIdFromUrl || applicantId;
    
    if (!currentApplicantId) {
      setIsEditMode(false);
      hasFetchedPersonalDetailsRef.current = false;
      return;
    }

    // Update state if URL changed
    if (applicantIdFromUrl && applicantIdFromUrl !== applicantId) {
      setApplicantId(applicantIdFromUrl);
      hasFetchedPersonalDetailsRef.current = false; // Reset fetch flag when ID changes
    }

    // Fetch personal details if we have applicantId and are on personal tab
    // Fetch when:
    // 1. Component mounts with applicantId and on personal tab
    // 2. User navigates to personal tab with applicantId
    if (currentApplicantId && activeTab === "personal" && !hasFetchedPersonalDetailsRef.current) {
      fetchPersonalDetails(currentApplicantId);
    }
  }, [applicantIdFromUrl, applicantId, activeTab, fetchPersonalDetails]);

  // Handle applicantId change callback (when created from API)
  const handleApplicantIdChange = useCallback((newApplicantId: number) => {
    setApplicantId(newApplicantId);
    
    // Update URL with new applicantId
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("applicantId", newApplicantId.toString());
    setSearchParams(newSearchParams, { replace: true });
    
    // Mark as edit mode
    setIsEditMode(true);
  }, [searchParams, setSearchParams]);

  // Final submit handler - submits all form data and redirects
  const handleFinalSubmit = useCallback(async () => {
    try {
      // Prepare the complete payload with all form data
      const payload = {
        personalDetails: formState.personalDetails,
        applicationPreferences: formState.applicationPreferences,
        educationalDetails: formState.educationalDetails,
        workExperience: formState.workExperience,
        achievements: formState.achievements,
      };

      // Determine API endpoint and method based on edit mode
      const method = isEditMode ? "PUT" : "POST";
      const endpoint = isEditMode 
        ? `/api/applicants/${applicantId}`
        : "/api/applicant/submit";

      // TODO: Replace with actual API endpoint
      // const response = await fetch(endpoint, {
      //   method,
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(payload),
      // });
      // if (!response.ok) {
      //   throw new Error(`Failed to ${isEditMode ? "update" : "submit"} applicant`);
      // }
      // const result = await response.json();

      // Log payload in development only
      if (import.meta.env.DEV) {
        console.log("Final submit payload ready for API:", payload);
        console.log(`API endpoint: ${method} ${endpoint}`);
      }

      // Simulate API call success
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // After successful API response, redirect to dashboard
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      // TODO: Show error message to user
      if (import.meta.env.DEV) {
        console.error(`Error ${isEditMode ? "updating" : "submitting"} applicant:`, error);
      }
      // TODO: Show error message to user
    }
  }, [formState, navigate, isEditMode, applicantId]);

  // Reset functions for each form section
  const resetPersonalDetails = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      personalDetails: getInitialFormState().personalDetails,
    }));
  }, []);

  // Memoize individual tab components to prevent unnecessary re-renders
  // Each tab only re-renders when its own state changes, not when other tabs change
  const personalTabContent = useMemo(
    () => (
      <ApplicantPersonalDetails
        initialValues={formState.personalDetails}
        onUpdate={updatePersonalDetails}
        onSaveAndNext={handleNextTab}
        onReset={resetPersonalDetails}
        applicantId={applicantId}
        onApplicantIdChange={handleApplicantIdChange}
      />
    ),
    [formState.personalDetails, updatePersonalDetails, handleNextTab, resetPersonalDetails, applicantId, handleApplicantIdChange]
  );

  const preferencesTabContent = useMemo(
    () => (
      <ApplicationPreferences
        initialValues={formState.applicationPreferences}
        onUpdate={updateApplicationPreferences}
        onSaveAndNext={handleNextTab}
        onBack={handlePreviousTab}
        applicantId={applicantId}
      />
    ),
    [formState.applicationPreferences, updateApplicationPreferences, handleNextTab, handlePreviousTab, applicantId]
  );

  const educationalTabContent = useMemo(
    () => (
      <EducationalDetails
        initialValues={formState.educationalDetails}
        onUpdate={updateEducationalDetails}
        onSaveAndNext={handleNextTab}
        onBack={handlePreviousTab}
        applicantId={applicantId}
      />
    ),
    [formState.educationalDetails, updateEducationalDetails, handleNextTab, handlePreviousTab, applicantId]
  );

  const workTabContent = useMemo(
    () => (
      <WorkExperience
        initialValues={formState.workExperience}
        onUpdate={updateWorkExperience}
        onSaveAndNext={handleNextTab}
        onBack={handlePreviousTab}
        applicantId={applicantId}
      />
    ),
    [formState.workExperience, updateWorkExperience, handleNextTab, handlePreviousTab, applicantId]
  );

  const achievementsTabContent = useMemo(
    () => (
      <Achievements
        initialValues={formState.achievements}
        onUpdate={updateAchievements}
        onBack={handlePreviousTab}
        onSubmit={handleFinalSubmit}
        applicantId={applicantId}
      />
    ),
    [formState.achievements, updateAchievements, handlePreviousTab, handleFinalSubmit, applicantId]
  );

  // Render only the active tab content - memoized to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "personal":
        return personalTabContent;
      case "preferences":
        return preferencesTabContent;
      case "educational":
        return educationalTabContent;
      case "work":
        return workTabContent;
      case "achievements":
        return achievementsTabContent;
      default:
        return personalTabContent;
    }
  }, [activeTab, personalTabContent, preferencesTabContent, educationalTabContent, workTabContent, achievementsTabContent]);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 md:p-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className="text-xl md:text-2xl font-semibold" style={{ color: COLORS.textDark }}>
            {t("applicant.applicantDetails", "Applicant Details")}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: COLORS.border }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                className={`
                  px-4 md:px-6 py-3 md:py-4 text-base font-medium whitespace-nowrap
                  transition-colors duration-200 relative
                `}
                style={{
                  color: isActive ? COLORS.accent : COLORS.textMuted,
                  backgroundColor: "transparent",
                  borderBottom: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  fontSize: typography.fontSize.body,
                  cursor: "default",
                }}
              >
                {t(tab.labelKey)}
              </div>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">{renderTabContent}</div>
      </div>
    </Layout>
  );
};

export default CreateApplicant;

