import { useTranslation } from "react-i18next";
import { COLORS, typography } from "../../constants";

const OverallCounts = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold"
        style={{
          color: COLORS.textDark,
          fontSize: typography.fontSize.h3,
          fontWeight: typography.fontWeight.semibold,
        }}
      >
        {t("reportAnalysis.overallCounts.title", "Overall Counts")}
      </h2>
      <p style={{ color: COLORS.textMuted }}>
        {t("reportAnalysis.overallCounts.description", "View Overall Statistics And Counts")}
      </p>
      {/* TODO: Add Overall Counts Content */}
    </div>
  );
};

export default OverallCounts;

