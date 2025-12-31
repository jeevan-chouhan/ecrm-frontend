import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../../components";
import ApplicantPersonalDetails from "./ApplicantPersonalDetails";
import ApplicationPreferences from "./ApplicationPreferences";
import EducationalDetails from "./EducationalDetails";
import WorkExperience from "./WorkExperience";
import Achievements from "./Achievements";
import { COLORS, ROUTES } from "../../../constants";
import type {
  ApplicantFormState,
  PersonalDetailsFormData,
  ApplicationPreferencesFormData,
  EducationalDetailFormData,
  WorkExperienceFormData,
  AchievementFormData,
} from "./types";
import type { ApplicantDetail } from "../ApplicantDetail/types";
import { mockApplicantDetail } from "../../../constants";

type TabType = "personal" | "preferences" | "educational" | "work" | "achievements";

interface Tab {
  id: TabType;
  labelKey: string;
}

// Initial state for all forms
const getInitialFormState = (): ApplicantFormState => ({
  personalDetails: {
    profilePhoto: null,
    enrollmentType: "",
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

// Helper function to map ApplicantDetail to ApplicantFormState
const mapApplicantDetailToFormState = (applicantDetail: ApplicantDetail): ApplicantFormState => {
  // Map personal details
  const personalDetails: PersonalDetailsFormData = {
    profilePhoto: null, // Will need to fetch separately if needed
    enrollmentType: applicantDetail.personalDetails?.enrollmentType || "",
    name: applicantDetail.personalDetails?.name || "",
    dateOfBirth: applicantDetail.personalDetails?.dateOfBirth
      ? new Date(applicantDetail.personalDetails.dateOfBirth)
      : null,
    gender: applicantDetail.personalDetails?.gender || "",
    countryCode: applicantDetail.personalDetails?.countryCode || "",
    contactNumber: applicantDetail.personalDetails?.contactNumber || "",
    emailId: applicantDetail.personalDetails?.emailId || "",
    permanentAddress: applicantDetail.personalDetails?.permanentAddress || "",
    notes: applicantDetail.personalDetails?.notes || applicantDetail.notes || "",
  };

  // Map application preferences from applications array
  // Extract program type from course name if possible (e.g., "Masters - Computer Science" -> "pg")
  const extractProgramFromCourse = (course: string): string => {
    const courseLower = course.toLowerCase();
    if (courseLower.includes("masters") || courseLower.includes("master") || courseLower.includes("ms") || courseLower.includes("m.sc")) {
      return "pg";
    }
    if (courseLower.includes("bachelors") || courseLower.includes("bachelor") || courseLower.includes("bs") || courseLower.includes("b.sc") || courseLower.includes("b.tech")) {
      return "ug";
    }
    if (courseLower.includes("phd") || courseLower.includes("ph.d") || courseLower.includes("doctorate")) {
      return "phd";
    }
    if (courseLower.includes("diploma") || courseLower.includes("certificate")) {
      return "diploma";
    }
    return ""; // Return empty if can't determine
  };

  // Normalize country value to match dropdown options (e.g., "USA" -> "usa")
  const normalizeCountry = (country: string): string => {
    if (!country) return "";
    const countryLower = country.toLowerCase();
    // Map common country name variations to dropdown values
    if (countryLower === "usa" || countryLower === "united states" || countryLower === "united states of america") {
      return "usa";
    }
    if (countryLower === "uk" || countryLower === "united kingdom") {
      return "uk";
    }
    // Return lowercase version if it matches a known value, otherwise return as-is
    return countryLower;
  };

  // Normalize university value to match dropdown options (e.g., "MIT" -> "mit")
  const normalizeUniversity = (university: string): string => {
    if (!university) return "";
    const universityLower = university.toLowerCase();
    // Map common university name variations to dropdown values
    if (universityLower === "mit" || universityLower === "massachusetts institute of technology") {
      return "mit";
    }
    if (universityLower === "stanford" || universityLower === "stanford university") {
      return "stanford"; // Note: "stanford" might not be in dropdown, but we'll use it
    }
    // Return as-is - Select component might have search/filter functionality
    return university;
  };

  const preferences = (applicantDetail.applications || []).map((app, index) => {
    // Check if preference has enough data to be considered "saved"
    // (campus is optional in existing data, so we check other required fields)
    const hasEssentialData = !!(
      app.country &&
      app.course &&
      app.intake &&
      app.university
    );
    
    return {
      id: app.id || `pref-${index}`,
      desiredCountry: normalizeCountry(app.country || ""),
      program: extractProgramFromCourse(app.course || ""), // Try to extract from course name
      desiredUniversity: normalizeUniversity(app.university || ""),
      desiredCampus: "", // Not available in UniversityApplication - will need to be filled by user
      course: app.course || "",
      desiredIntake: app.intake || "",
      assignCounselor: app.counselor || "",
      agencyPartnerName: app.agencyPartner === "-" ? "" : app.agencyPartner || "",
      saved: hasEssentialData, // Mark as saved if it has essential data, so it shows as a card
    };
  });

  // Map educational details
  const educationalDetails: EducationalDetailFormData = {
    highestQualification: applicantDetail.educationalDetails?.highestQualification || "",
    institutionName: applicantDetail.educationalDetails?.institutionName || "",
    boardUniversity: applicantDetail.educationalDetails?.boardUniversity || "",
    program: applicantDetail.educationalDetails?.program || "",
    major: applicantDetail.educationalDetails?.major || "",
    scoreType: applicantDetail.educationalDetails?.scoreType || "",
    score: applicantDetail.educationalDetails?.score || "",
    passingYear: applicantDetail.educationalDetails?.passingYear
      ? new Date(applicantDetail.educationalDetails.passingYear)
      : null,
  };

  // Map work experience
  const workExperiences = (applicantDetail.workExperience?.experiences || []).map((exp) => ({
    id: exp.id,
    companyName: exp.companyName,
    jobTitle: exp.jobTitle,
    startDate: exp.startDate ? new Date(exp.startDate) : null,
    endDate: exp.endDate ? new Date(exp.endDate) : null,
    currentlyWorking: exp.currentlyWorking,
    saved: true,
  }));

  const workExperience: WorkExperienceFormData = {
    hasWorkExperience: workExperiences.length > 0 ? "yes" : "no",
    workExperiences,
  };

  // Map achievements
  const achievements = (applicantDetail.achievements?.achievements || []).map((ach) => ({
    id: ach.id,
    category: ach.category,
    description: ach.description,
    documents: null, // Documents are URLs/strings in detail view, not File objects
    saved: true,
  }));

  const achievementFormData: AchievementFormData = {
    hasAchievements: achievements.length > 0 ? "yes" : "no",
    achievements,
  };

  return {
    personalDetails,
    applicationPreferences: { preferences },
    educationalDetails,
    workExperience,
    achievements: achievementFormData,
  };
};

const CreateApplicant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicantId = searchParams.get("applicantId");
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [formState, setFormState] = useState<ApplicantFormState>(getInitialFormState());
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
      setActiveTab(tabs[currentIndex - 1].id);
    }
  }, [activeTab, tabs]);

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

  // Fetch applicant data when applicantId is present
  useEffect(() => {
    if (!applicantId) {
      setIsEditMode(false);
      return;
    }

    setIsEditMode(true);
    setLoading(true);

    // Simulate API call with mock data
    const fetchApplicantData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/applicants/${applicantId}`);
        // if (!response.ok) throw new Error("Failed to fetch applicant");
        // const data = await response.json();

        // Mock data for now
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Use mock data - in production, use data from API
        const applicantData = mockApplicantDetail;
        
        // Map the data to form state
        const mappedFormState = mapApplicantDetailToFormState(applicantData);
        setFormState(mappedFormState);
        setLoading(false);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching applicant data:", error);
        }
        // TODO: Show error toast notification
        // On error, reset to initial state
        setIsEditMode(false);
        setFormState(getInitialFormState());
        setLoading(false);
      }
    };

    fetchApplicantData();
  }, [applicantId]);

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
      
      // After successful API response, redirect to applicant tracker list
      navigate(ROUTES.APPLICANT_TRACKER);
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
      />
    ),
    [formState.personalDetails, updatePersonalDetails, handleNextTab, resetPersonalDetails]
  );

  const preferencesTabContent = useMemo(
    () => (
      <ApplicationPreferences
        initialValues={formState.applicationPreferences}
        onUpdate={updateApplicationPreferences}
        onSaveAndNext={handleNextTab}
        onBack={handlePreviousTab}
      />
    ),
    [formState.applicationPreferences, updateApplicationPreferences, handleNextTab, handlePreviousTab]
  );

  const educationalTabContent = useMemo(
    () => (
      <EducationalDetails
        initialValues={formState.educationalDetails}
        onUpdate={updateEducationalDetails}
        onSaveAndNext={handleNextTab}
        onBack={handlePreviousTab}
      />
    ),
    [formState.educationalDetails, updateEducationalDetails, handleNextTab, handlePreviousTab]
  );

  const workTabContent = useMemo(
    () => (
      <WorkExperience
        initialValues={formState.workExperience}
        onUpdate={updateWorkExperience}
        onSaveAndNext={handleNextTab}
        onBack={handlePreviousTab}
      />
    ),
    [formState.workExperience, updateWorkExperience, handleNextTab, handlePreviousTab]
  );

  const achievementsTabContent = useMemo(
    () => (
      <Achievements
        initialValues={formState.achievements}
        onUpdate={updateAchievements}
        onBack={handlePreviousTab}
        onSubmit={handleFinalSubmit}
      />
    ),
    [formState.achievements, updateAchievements, handlePreviousTab, handleFinalSubmit]
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

  // Show loading state while fetching data
  if (loading) {
    return (
      <Layout userName="Admin" userRole="Abroad Agency">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <p style={{ color: COLORS.textMuted }}>{t("common.loading", "Loading...")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 md:p-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className="text-xl md:text-2xl font-semibold" style={{ color: COLORS.textDark }}>
            {isEditMode ? t("applicant.editApplicant", "Edit Applicant") : t("applicant.addApplicant", "Add Applicant")}
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
                  fontSize: "16px",
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

