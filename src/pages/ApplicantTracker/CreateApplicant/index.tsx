import { useState } from "react";
import { Layout } from "../../../components";
import ApplicantPersonalDetails from "./ApplicantPersonalDetails";
import ApplicationPreferences from "./ApplicationPreferences";
import EducationalDetails from "./EducationalDetails";
import WorkExperience from "./WorkExperience";
import Achievements from "./Achievements";
import { COLORS } from "../../../constants";

type TabType = "personal" | "preferences" | "educational" | "work" | "achievements";

interface Tab {
  id: TabType;
  label: string;
}

const tabs: Tab[] = [
  { id: "personal", label: "Personal Details" },
  { id: "preferences", label: "Application Preferences" },
  { id: "educational", label: "Educational Details" },
  { id: "work", label: "Work Experience" },
  { id: "achievements", label: "Achievements" },
];

const CreateApplicant = () => {
  const [activeTab, setActiveTab] = useState<TabType>("personal");

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return <ApplicantPersonalDetails />;
      case "preferences":
        return <ApplicationPreferences onSaveAndNext={handleNextTab} />;
      case "educational":
        return <EducationalDetails />;
      case "work":
        return <WorkExperience />;
      case "achievements":
        return <Achievements />;
      default:
        return <ApplicantPersonalDetails />;
    }
  };

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 md:p-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className="text-xl md:text-2xl font-semibold" style={{ color: COLORS.textDark }}>
            ADD APPLICANT
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: COLORS.border }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 md:px-6 py-3 md:py-4 text-sm font-medium whitespace-nowrap
                  transition-COLORS duration-200 relative
                  ${isActive ? "" : "hover:bg-slate-50"}
                `}
                style={{
                  color: isActive ? COLORS.accent : COLORS.textMuted,
                  backgroundColor: isActive ? "transparent" : "transparent",
                  borderBottom: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">{renderTabContent()}</div>
      </div>
    </Layout>
  );
};

export default CreateApplicant;

