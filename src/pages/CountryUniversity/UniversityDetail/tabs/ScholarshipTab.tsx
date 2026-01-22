import { useTranslation } from "react-i18next";
import { Card } from "../../../../components";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface ScholarshipTabProps {
  university: UniversityDetail;
}

const ScholarshipTab = ({ university }: ScholarshipTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.availableScholarships", "Available Scholarships")}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {university.scholarships.map((scholarship, index) => (
          <Card key={index} padding="md">
            <h4 className="font-medium text-sm mb-2" style={{ color: COLORS.textDark }}>
              {scholarship.name}
            </h4>
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: COLORS.accent }}
            >
              {scholarship.amount}
            </p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              <span className="font-medium">Eligibility:</span> {scholarship.eligibility}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScholarshipTab;
