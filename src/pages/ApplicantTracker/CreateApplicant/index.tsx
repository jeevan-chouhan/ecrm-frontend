import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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

const CreateApplicant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [formState, setFormState] = useState<ApplicantFormState>(getInitialFormState());

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

      // TODO: Replace with actual API endpoint
      // const response = await fetch("/api/applicant/submit", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(payload),
      // });
      // if (!response.ok) {
      //   throw new Error("Failed to submit applicant");
      // }
      // const result = await response.json();

      // Log payload in development only
      if (import.meta.env.DEV) {
        console.log("Final submit payload ready for API:", payload);
        console.log("API endpoint: POST /api/applicant/submit");
      }

      // Simulate API call success
      // After successful API response, redirect to applicant tracker list
      navigate(ROUTES.APPLICANT_TRACKER);
    } catch (error) {
      // TODO: Show error message to user
      if (import.meta.env.DEV) {
        console.error("Error submitting applicant:", error);
      }
      // TODO: Show error message to user
    }
  }, [formState, navigate]);

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

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 md:p-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className="text-xl md:text-2xl font-semibold uppercase" style={{ color: COLORS.textDark }}>
            {t("applicant.addApplicant")}
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

