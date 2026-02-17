import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface DocumentsTabProps {
  university: UniversityDetail;
}

const DocumentsTab = ({ university }: DocumentsTabProps) => {
  const { t } = useTranslation();
  const hasProgramDocs =
    university.programSpecificDocuments && university.programSpecificDocuments.length > 0;

  if (!hasProgramDocs) {
    return (
      <p className="text-sm" style={{ color: COLORS.textMuted }}>
        {t("universityDetail.noProgramDocuments", "No program specific documents available.")}
      </p>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-base mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.programSpecificDocuments", "Agency Required Documents")}
      </h4>
      <div
        className="rounded-lg overflow-hidden border"
        style={{ borderColor: COLORS.border }}
      >
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
                {t("universityDetail.programSpecificDocumentsList", "Program Specific Documents")}
              </th>
            </tr>
          </thead>
          <tbody>
            {university.programSpecificDocuments!.map((row, index) => (
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
                <td className="text-sm px-4 py-3" style={{ color: COLORS.textMuted }}>
                  <ul className="list-disc list-inside space-y-1">
                    {row.documents.map((doc, i) => (
                      <li key={i} className="pl-1">
                        {doc}
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
};

export default DocumentsTab;
