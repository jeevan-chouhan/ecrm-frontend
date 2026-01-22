import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface EligibilityTabProps {
  university: UniversityDetail;
}

const EligibilityTab = ({ university }: EligibilityTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.eligibilityRequirements", "Eligibility Requirements")}
      </h3>
      
      <div className="space-y-3">
        {university.eligibilityItems?.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ backgroundColor: COLORS.background }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
              style={{ backgroundColor: COLORS.accent, color: "white" }}
            >
              {index + 1}
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EligibilityTab;
