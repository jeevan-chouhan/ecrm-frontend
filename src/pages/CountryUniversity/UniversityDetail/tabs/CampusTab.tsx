import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface CampusTabProps {
  university: UniversityDetail;
}

const CampusTab = ({ university }: CampusTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-3" style={{ color: COLORS.textDark }}>
          {t("universityDetail.campusInformation", "Campus Information")}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
          {university.campusInfo}
        </p>
      </div>
      
      {university.campusHighlights && university.campusHighlights.length > 0 && (
        <div>
          <h4 className="font-medium text-md mb-3" style={{ color: COLORS.textDark }}>
            {t("universityDetail.campusHighlights", "Campus Highlights")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {university.campusHighlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ backgroundColor: COLORS.background }}
              >
                <span style={{ color: COLORS.accent }}>🏛️</span>
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusTab;
