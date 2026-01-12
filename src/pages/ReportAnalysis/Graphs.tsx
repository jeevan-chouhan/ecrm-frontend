import { useTranslation } from "react-i18next";
import { COLORS, typography } from "../../constants";

const Graphs = () => {
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
        {t("reportAnalysis.graphs.title", "Graphs")}
      </h2>
      <p style={{ color: COLORS.textMuted }}>
        {t("reportAnalysis.graphs.description", "View Analytics And Visual Reports")}
      </p>
      {/* TODO: Add Graphs Content */}
    </div>
  );
};

export default Graphs;

