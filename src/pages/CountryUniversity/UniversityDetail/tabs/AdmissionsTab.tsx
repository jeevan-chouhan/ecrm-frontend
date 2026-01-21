import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface AdmissionsTabProps {
  university: UniversityDetail;
}

const AdmissionsTab = ({ university }: AdmissionsTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.admissionProcess", "Admission Process")}
      </h3>
      
      <div className="relative">
        {university.admissionSteps.map((step, index) => (
          <div key={step.step} className="flex gap-4 pb-6">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: COLORS.accent, color: "white" }}
              >
                {step.step}
              </div>
              {index < university.admissionSteps.length - 1 && (
                <div
                  className="w-0.5 flex-1 mt-2"
                  style={{ backgroundColor: COLORS.border }}
                />
              )}
            </div>
            
            {/* Content */}
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
