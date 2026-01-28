import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "../../components";
import { COLORS, typography } from "../../constants";
import { useAppSelector } from "../../redux/hooks";
import TeamOverview from "./TeamOverview";
import OverallCounts from "./OverallCounts";
import Graphs from "./Graphs";

type TabType = "teamOverview" | "agencyOverview" | "graphs";

interface Tab {
  id: TabType;
  labelKey: string;
}

const ReportAnalysis = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<TabType>("teamOverview");

  // Get user role and check if tabs should be hidden
  const userRole = (user?.role || "").toUpperCase().trim();
  const isCounsellor = userRole === "COUNSELLOR";
  const isBilling = userRole === "BILLING";
  const shouldHideTabs = isCounsellor || isBilling;

  // Memoize tabs array to prevent recreation on every render
  // Hide "teamOverview" and "agencyOverview" tabs for COUNSELLOR and BILLING roles
  const tabs: Tab[] = useMemo(
    () => {
      const allTabs: Tab[] = [
        { id: "teamOverview", labelKey: "reportAnalysis.tabs.teamOverview" },
        { id: "agencyOverview", labelKey: "reportAnalysis.tabs.agencyOverview" },
        { id: "graphs", labelKey: "reportAnalysis.tabs.graphs" },
      ];

      if (shouldHideTabs) {
        return allTabs.filter(tab => tab.id === "graphs");
      }

      return allTabs;
    },
    [shouldHideTabs]
  );

  // Update activeTab if current tab is hidden for this role
  useEffect(() => {
    if (shouldHideTabs && (activeTab === "teamOverview" || activeTab === "agencyOverview")) {
      setActiveTab("graphs");
    }
  }, [shouldHideTabs, activeTab]);

  // Handle tab change
  const handleTabChange = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
  }, []);

  // Render only the active tab content - memoized to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "teamOverview":
        return <TeamOverview />;
      case "agencyOverview":
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

