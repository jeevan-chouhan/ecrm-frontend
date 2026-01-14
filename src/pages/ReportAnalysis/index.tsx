import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../../components";
import { COLORS, typography } from "../../constants";
import TeamOverview from "./TeamOverview";
import OverallCounts from "./OverallCounts";
import Graphs from "./Graphs";

type TabType = "teamOverview" | "overallCounts" | "graphs";

interface Tab {
  id: TabType;
  labelKey: string;
}

const ReportAnalysis = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("teamOverview");

  // Memoize tabs array to prevent recreation on every render
  const tabs: Tab[] = useMemo(
    () => [
      { id: "teamOverview", labelKey: "reportAnalysis.tabs.teamOverview" },
      { id: "overallCounts", labelKey: "reportAnalysis.tabs.overallCounts" },
      { id: "graphs", labelKey: "reportAnalysis.tabs.graphs" },
    ],
    []
  );

  // Handle tab change
  const handleTabChange = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
  }, []);

  // Render only the active tab content - memoized to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "teamOverview":
        return <TeamOverview />;
      case "overallCounts":
        return <OverallCounts />;
      case "graphs":
        return <Graphs />;
      default:
        return <TeamOverview />;
    }
  }, [activeTab]);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-4 md:p-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1
            className="text-xl md:text-2xl font-semibold"
            style={{
              color: COLORS.textDark,
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {t("reportAnalysis.title", "Report & Analysis")}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: COLORS.border }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  px-4 md:px-6 py-3 md:py-4 text-base font-medium whitespace-nowrap
                  transition-colors duration-200 relative
                  hover:bg-slate-50
                `}
                style={{
                  color: isActive ? COLORS.accent : COLORS.textMuted,
                  backgroundColor: "transparent",
                  borderBottom: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  fontSize: typography.fontSize.body,
                  cursor: "pointer",
                }}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">{renderTabContent}</div>
      </div>
    </Layout>
  );
};

export default ReportAnalysis;

