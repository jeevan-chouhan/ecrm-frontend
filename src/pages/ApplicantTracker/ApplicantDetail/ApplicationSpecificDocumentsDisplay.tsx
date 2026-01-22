import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components";
import { COLORS, typography } from "../../../constants";
import { File, Eye, Download } from "../../../assets";
import { EmptyState } from "./DisplayComponents";
import ScrollableContainer from "./ScrollableContainer";
import type { ApplicationSpecificDocumentItem } from "./types";

// Document type icons mapping
const documentIcons: Record<string, string> = {
  passport: COLORS.documentPassport,
  transcript: COLORS.documentTranscript,
  letter: COLORS.documentLetter,
  statement: COLORS.documentStatement,
  resume: COLORS.documentResume,
  financial: COLORS.documentFinancial,
  default: COLORS.documentDefault,
};

interface ApplicationSpecificDocumentsDisplayProps {
  documents: ApplicationSpecificDocumentItem[];
  onView?: (document: ApplicationSpecificDocumentItem) => void;
  onDownload?: (document: ApplicationSpecificDocumentItem) => void;
}

const ApplicationSpecificDocumentsDisplay = ({
  documents,
  onView,
  onDownload,
}: ApplicationSpecificDocumentsDisplayProps) => {
  const { t } = useTranslation();

  const getDocumentIconColor = (type: string): string => {
    return documentIcons[type] || documentIcons.default;
  };

  const handleView = (document: ApplicationSpecificDocumentItem) => {
    if (onView) {
      onView(document);
    }
  };

  const handleDownload = (document: ApplicationSpecificDocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(document);
    }
  };

  // Filter only uploaded documents
  const uploadedDocuments = useMemo(
    () => documents?.filter((doc) => doc.uploaded) || [],
    [documents]
  );

  if (!uploadedDocuments || uploadedDocuments.length === 0) {
    return (
      <EmptyState message={t("applicantDetailView.noApplicationSpecificDocuments", "No application-specific documents available.")} />
    );
  }

  return (
    <ScrollableContainer
      maxHeight="400px"
      className="overflow-x-auto"
      scrollbarClassName="application-specific-documents-scroll"
    >
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              className="text-left py-3 px-4 font-semibold tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
                fontSize: typography.fontSize.body,
              }}
            >
              {t("applicantDetailView.documentName", "Document Name")}
            </th>
            <th
              className="text-left py-3 px-4 font-semibold tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
                fontSize: typography.fontSize.body,
              }}
            >
              {t("applicantDetailView.universityName", "University")}
            </th>
            <th
              className="text-left py-3 px-4 font-semibold tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
                fontSize: typography.fontSize.body,
              }}
            >
              {t("applicantDetailView.courseName", "Course")}
            </th>
            <th
              className="text-left py-3 px-4 font-semibold tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
                fontSize: typography.fontSize.body,
              }}
            >
              {t("applicantDetailView.actions", "Actions")}
            </th>
            <th
              className="text-left py-3 px-4 font-semibold tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
                fontSize: typography.fontSize.body,
              }}
            >
              {t("applicantDetailView.verificationStatus", "Verification Status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {uploadedDocuments.map((document, index) => (
            <tr
              key={document.id || index}
              style={{
                borderBottom: index < uploadedDocuments.length - 1 ? `1px solid ${COLORS.border}` : "none",
              }}
            >
              {/* Document Name */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: `${getDocumentIconColor(document.type)}20`,
                    }}
                  >
                    <File
                      className="w-4 h-4"
                      style={{ color: getDocumentIconColor(document.type) }}
                    />
                  </div>
                  <span className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                    {document.name}
                  </span>
                </div>
              </td>

              {/* University Name */}
              <td className="py-3 px-4">
                <span className="text-sm" style={{ color: COLORS.textDark }}>
                  {document.universityName || "-"}
                </span>
              </td>

              {/* Course Name */}
              <td className="py-3 px-4">
                <span className="text-sm" style={{ color: COLORS.textDark }}>
                  {document.courseName || "-"}
                </span>
              </td>

              {/* Actions */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded
                    onClick={() => handleView(document)}
                    style={{
                      color: COLORS.accent,
                      padding: "4px 8px",
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t("applicantTracker.view", "View")}
                  </Button>
                  <button
                    onClick={(e) => handleDownload(document, e)}
                    className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
                    style={{ color: COLORS.accent }}
                    aria-label={t("common.download", "Download")}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </td>

              {/* Verification Status */}
              <td className="py-3 px-4">
                {document.verified ? (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${COLORS.success}20`,
                      color: COLORS.success,
                    }}
                  >
                    {t("applicantDetailView.verified", "Verified")}
                  </span>
                ) : (
                  <span
                    className="text-sm"
                    style={{ color: COLORS.textMuted }}
                  >
                    {t("applicantDetailView.pending", "Pending")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableContainer>
  );
};

export default memo(ApplicationSpecificDocumentsDisplay);

