import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";
import { File, Eye, Download } from "../../../assets";
import { EmptyState } from "./DisplayComponents";

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

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  uploaded: boolean;
  verified: boolean;
  fileUrl?: string;
  fileName?: string;
}

interface DocumentsDisplayProps {
  documents: DocumentItem[];
  onView?: (document: DocumentItem) => void;
  onDownload?: (document: DocumentItem) => void;
}

const DocumentsDisplay = ({
  documents,
  onView,
  onDownload,
}: DocumentsDisplayProps) => {
  const { t } = useTranslation();

  const getDocumentIconColor = (type: string): string => {
    return documentIcons[type] || documentIcons.default;
  };

  const handleView = (document: DocumentItem) => {
    if (onView) {
      onView(document);
    }
  };

  const handleDownload = (document: DocumentItem, e: React.MouseEvent) => {
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
      <EmptyState message={t("applicantDetailView.noDocuments", "No documents available.")} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              {t("applicantDetailView.documentName", "DOCUMENT NAME")}
            </th>
            <th
              className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              {t("applicantDetailView.actions", "ACTIONS")}
            </th>
            <th
              className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide"
              style={{
                color: COLORS.textMuted,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              {t("applicantDetailView.verificationStatus", "VERIFICATION STATUS")}
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
    </div>
  );
};

export default memo(DocumentsDisplay);

