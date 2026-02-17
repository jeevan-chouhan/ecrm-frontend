import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface AdmissionsTabProps {
  university: UniversityDetail;
}

const AdmissionsTab = ({ university }: AdmissionsTabProps) => {
  const { t } = useTranslation();
  const hasDetails = university.admissionDetails && university.admissionDetails.length > 0;

  if (hasDetails) {
    const details = university.admissionDetails!;
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-base" style={{ color: COLORS.textDark }}>
          {t("universityDetail.admissionDetails", "Admission Details")}
        </h4>
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: COLORS.border }}>
          <table className="w-full" style={{ backgroundColor: COLORS.surface }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.background }}>
                <th
                  className="text-left text-sm font-medium px-4 py-3 w-[140px] shrink-0"
                  style={{ color: COLORS.textDark }}
                >
                  {t("universityDetail.programType", "Program Type")}
                </th>
                <th
                  className="text-left text-sm font-medium px-4 py-3"
                  style={{ color: COLORS.textDark }}
                >
                  {t("universityDetail.admissionProcedure", "Admission Procedure")}
                </th>
              </tr>
            </thead>
            <tbody>
              {details.map((row, index) => (
                <tr
                  key={index}
                  className="border-t align-top"
                  style={{ borderColor: COLORS.border }}
                >
                  <td
                    className="text-sm font-medium px-4 py-3"
                    style={{ color: COLORS.textDark }}
                  >
                    {row.programType}
                  </td>
                  <td
                    className="text-sm px-4 py-3"
                    style={{ color: COLORS.textMuted, whiteSpace: "pre-wrap" }}
                  >
                    {row.admissionProcedure}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: timeline of admission steps
  const steps = university.admissionSteps ?? [];
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-base mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.admissionProcess", "Admission Process")}
      </h4>
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.step} className="flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: COLORS.accent, color: "white" }}
              >
                {step.step}
              </div>
              {index < steps.length - 1 && (
                <div
                  className="w-0.5 flex-1 mt-2"
                  style={{ backgroundColor: COLORS.border }}
                />
              )}
            </div>
            <div className="flex-1 pb-2">
              <h4 className="font-medium text-sm mb-1" style={{ color: COLORS.textDark }}>
                {step.title}
              </h4>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdmissionsTab;
