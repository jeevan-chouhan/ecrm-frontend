import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface EligibilityTabProps {
  university: UniversityDetail;
}

const EligibilityTab = ({ university }: EligibilityTabProps) => {
  const { t } = useTranslation();
  const hasCriteria = university.eligibilityCriteria && university.eligibilityCriteria.length > 0;

  if (hasCriteria) {
    const criteria = university.eligibilityCriteria!;
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-base" style={{ color: COLORS.textDark }}>
          {t("universityDetail.eligibilityCriteria", "Eligibility Criteria")}
        </h4>
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: COLORS.border }}>
          <table className="w-full" style={{ backgroundColor: COLORS.surface }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.background }}>
                <th
                  className="text-left text-sm font-medium px-4 py-3"
                  style={{ color: COLORS.textDark }}
                >
                  {t("universityDetail.programType", "Program Type")}
                </th>
                <th
                  className="text-left text-sm font-medium px-4 py-3"
                  style={{ color: COLORS.textDark }}
                >
                  {t("universityDetail.description", "Description")}
                </th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((row, index) => (
                <tr
                  key={index}
                  className="border-t align-top"
                  style={{ borderColor: COLORS.border }}
                >
                  <td
                    className="text-sm font-medium px-4 py-3 w-[140px] shrink-0"
                    style={{ color: COLORS.textDark }}
                  >
                    {row.programType}
                  </td>
                  <td className="text-sm px-4 py-3" style={{ color: COLORS.textMuted }}>
                    <ul className="list-disc list-inside space-y-1">
                      {row.description.map((line, i) => (
                        <li key={i} className="pl-1">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: legacy eligibilityItems as simple list
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-base mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.eligibilityRequirements", "Eligibility Requirements")}
      </h4>
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
