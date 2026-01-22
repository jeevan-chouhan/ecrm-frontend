import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface DocumentsTabProps {
  university: UniversityDetail;
}

const DocumentsTab = ({ university }: DocumentsTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.requiredDocuments", "Required Documents")}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {university.documents?.map((doc, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg border"
            style={{ borderColor: COLORS.border }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: COLORS.accentLight }}
            >
              <span style={{ color: COLORS.accent }}>📄</span>
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted }}>
              {doc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsTab;
