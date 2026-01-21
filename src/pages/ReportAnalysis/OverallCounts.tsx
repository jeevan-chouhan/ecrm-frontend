import { useTranslation } from "react-i18next";
import { COLORS, typography } from "../../constants";

interface StatCard {
  label: string;
  value: number;
}

const OverallCounts = () => {
  const { t } = useTranslation();

  // Stats data - TODO: Replace with API data
  const stats: StatCard[] = [
    {
      label: t("reportAnalysis.overallCounts.totalAgencyPartner", "Total Agency Partner"),
      value: 3,
    },
    {
      label: t("reportAnalysis.overallCounts.totalStaff", "Total Staff"),
      value: 16,
    },
    {
      label: t("reportAnalysis.overallCounts.totalApplicants", "Total Applicants"),
      value: 160,
    },
    {
      label: t("reportAnalysis.overallCounts.totalEnrolledApplicants", "Total Enrolled Applicants"),
      value: 60,
    },
    {
      label: t("reportAnalysis.overallCounts.totalInProgressApplicants", "Total In-progress Applicants"),
      value: 80,
    },
    {
      label: t("reportAnalysis.overallCounts.totalRejectedApplicants", "Total Rejected Applicants"),
      value: 15,
    },
    {
      label: t("reportAnalysis.overallCounts.inactiveApplicants", "Inactive Applicants"),
      value: 5,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            style={{
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p
              className="text-sm mb-2"
              style={{
                color: COLORS.textMuted,
                fontSize: typography.fontSize.small,
              }}
            >
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold"
              style={{
                color: COLORS.textDark,
                fontSize: typography.fontSize.h1,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverallCounts;
