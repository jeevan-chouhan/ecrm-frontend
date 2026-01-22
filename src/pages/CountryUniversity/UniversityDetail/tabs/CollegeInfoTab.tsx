import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface CollegeInfoTabProps {
  university: UniversityDetail;
}

const CollegeInfoTab = ({ university }: CollegeInfoTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-3" style={{ color: COLORS.textDark }}>
          {t("universityDetail.aboutUniversity", "About the University")}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
          {university.description}
        </p>
      </div>
      
      {university.highlights && university.highlights.length > 0 && (
        <div>
          <h4 className="font-medium text-md mb-3" style={{ color: COLORS.textDark }}>
            {t("universityDetail.highlights", "Key Highlights")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {university.highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{ backgroundColor: COLORS.background }}
              >
                <span style={{ color: COLORS.accent }}>✓</span>
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {university.website && (
        <div>
          <a
            href={university.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: COLORS.accent }}
          >
            {t("universityDetail.visitOfficialWebsite", "Visit Official Website")} ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default CollegeInfoTab;
