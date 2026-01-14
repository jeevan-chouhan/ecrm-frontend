import { useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout, Card, Button, Popup, DataTable } from "../../../components";
import type { GridColDef, GridRowId } from "../../../components";
import { COLORS } from "../../../constants";
import { getEnrollmentTypeLabel } from "../../../utils/commonUtils";
import {
  ArrowLeft,
  File,
  Download,
  Close,
} from "../../../assets";
import UploadDocView from "./UploadDocView";
import type { ViewerFile } from "./UploadDocView";

// Interface for navigation state from DocumentVault
interface LocationState {
  applicantName?: string;
  contactNo?: string;
  email?: string;
  enrollmentType?: string;
  status?: string;
}

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

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  uploaded: boolean;
  verified: boolean;
  fileUrl?: string;
  fileName?: string;
  file?: File;
  isNew?: boolean;
}

// Mock documents data
const initialDocuments: DocumentItem[] = [
  { id: "1", name: "Passport", type: "passport", uploaded: false, verified: false },
  { id: "2", name: "Transcripts (UG)", type: "transcript", uploaded: false, verified: false },
  { id: "3", name: "Letters of Recommendation", type: "letter", uploaded: false, verified: false },
  { id: "4", name: "Statement of Purpose", type: "statement", uploaded: false, verified: false },
  { id: "5", name: "Resume", type: "resume", uploaded: false, verified: false },
  { id: "6", name: "Financial Statement", type: "financial", uploaded: false, verified: false },
  { id: "7", name: "Embassy approved visa", type: "passport", uploaded: false, verified: false },
];

const DocumentDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { applicantId } = useParams<{ applicantId: string }>();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedDocs, setSelectedDocs] = useState<GridRowId[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<ViewerFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [approvePopupOpen, setApprovePopupOpen] = useState(false);
  const [approvingDocId, setApprovingDocId] = useState<string | null>(null);

  // Get applicant data from navigation state
  const locationState = location.state as LocationState | null;
  const applicantData = {
    name: locationState?.applicantName || "",
    applicantId: applicantId || "",
    stage: "Application Submitted",
    enrollmentType: locationState?.enrollmentType || "",
    status: locationState?.status || "",
  };

  // Stats
  const totalDocuments = documents.length;
  const approvedCount = documents.filter((d) => d.verified).length;
  const pendingCount = documents.filter((d) => !d.verified).length;

  const handleBack = () => {
    navigate(-1);
  };

  const handleSelectionChange = (newSelection: GridRowId[]) => {
    setSelectedDocs(newSelection);
  };

  const handleUploadClick = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDocId) {
      const fileUrl = URL.createObjectURL(file);
      setDocuments(
        documents.map((doc) =>
          doc.id === uploadingDocId
            ? { ...doc, uploaded: true, file, fileName: file.name, fileUrl }
            : doc
        )
      );
      setUploadingDocId(null);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (docId: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === docId
          ? { ...doc, uploaded: false, file: undefined, fileName: undefined, fileUrl: undefined }
          : doc
      )
    );
  };

  const handleVerifyClick = (docId: string) => {
    setApprovingDocId(docId);
    setApprovePopupOpen(true);
  };

  const handleVerifyConfirm = () => {
    if (approvingDocId) {
      setDocuments(
        documents.map((doc) =>
          doc.id === approvingDocId ? { ...doc, verified: true } : doc
        )
      );
    }
    setApprovePopupOpen(false);
    setApprovingDocId(null);
  };

  const handleVerifyCancel = () => {
    setApprovePopupOpen(false);
    setApprovingDocId(null);
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDocument = (doc: DocumentItem) => {
    if (doc.fileUrl) {
      setViewerFile({
        url: doc.fileUrl,
        name: doc.fileName || doc.name,
        type: getFileType(doc.fileName || ""),
      });
      setViewerOpen(true);
    }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return "pdf";
    if (["txt"].includes(ext)) return "text";
    if (["csv"].includes(ext)) return "csv";
    if (["xls", "xlsx"].includes(ext)) return "excel";
    if (["doc", "docx"].includes(ext)) return "word";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    return "other";
  };

  const handleAddDocument = () => {
    const newId = `new-${Date.now()}`;
    const newDoc: DocumentItem = {
      id: newId,
      name: "",
      type: "default",
      uploaded: false,
      verified: false,
      isNew: true,
    };
    setDocuments([...documents, newDoc]);
  };

  const handleDownloadSelected = () => {
    selectedDocs.forEach((docId) => {
      const doc = documents.find((d) => d.id === String(docId));
      if (doc?.fileUrl && doc?.fileName && doc.uploaded) {
        handleDownload(doc.fileUrl, doc.fileName);
      }
    });
  };

  // Check if any selected documents have files to download
  const hasDownloadableSelection = selectedDocs.some((docId) => {
    const doc = documents.find((d) => d.id === String(docId));
    return doc?.uploaded && doc?.fileUrl;
  });

  const handleUpdateDocName = (docId: string, name: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === docId ? { ...doc, name } : doc
      )
    );
  };


  const closeViewer = () => {
    setViewerOpen(false);
    setViewerFile(null);
  };

  // DataTable columns
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: t("documentVault.documentName", "Document Name"),
      flex: 2,
      minWidth: 250,
      sortable: true,
      renderCell: (params) => {
        const doc = params.row as DocumentItem;
        return (
          <div className="flex items-center gap-3 h-full">
            <div
              className="p-2 rounded-lg shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${documentIcons[doc.type] || documentIcons.default}20` }}
            >
              <File
                className="h-5 w-5"
                style={{ color: documentIcons[doc.type] || documentIcons.default }}
              />
            </div>
            {doc.isNew && !doc.name ? (
              <input
                type="text"
                placeholder={t("documentVault.enterDocName", "Enter Document Name")}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textDark,
                }}
                onBlur={(e) => handleUpdateDocName(doc.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateDocName(doc.id, (e.target as HTMLInputElement).value);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span style={{ color: COLORS.textDark }}>{doc.name}</span>
            )}
          </div>
        );
      },
    },
    {
      field: "upload",
      headerName: t("documentVault.upload", "Upload"),
      flex: 1.5,
      minWidth: 200,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const doc = params.row as DocumentItem;
        return (
          <div className="flex items-center justify-center gap-2 h-full">
            {doc.uploaded ? (
              <>
                <Button
                  variant="accent"
                  size="sm"
                  rounded
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDocument(doc);
                  }}
                >
                  {t("documentVault.view", "View")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download className="h-4 w-4" style={{ color: COLORS.textMuted }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (doc.fileUrl && doc.fileName) handleDownload(doc.fileUrl, doc.fileName);
                  }}
                  title={t("common.download", "Download")}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Close className="h-4 w-4" style={{ color: COLORS.error }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(doc.id);
                  }}
                  title={t("common.remove", "Remove")}
                />
              </>
            ) : (
              <Button
                variant="accent"
                size="sm"
                rounded
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadClick(doc.id);
                }}
                disabled={doc.isNew && !doc.name}
              >
                {t("documentVault.upload", "Upload")}
              </Button>
            )}
          </div>
        );
      },
    },
    {
      field: "verified",
      headerName: t("documentVault.verificationStatus", "Verification Status"),
      flex: 1,
      minWidth: 150,
      sortable: true,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const doc = params.row as DocumentItem;
        return (
          <div className="flex items-center justify-center gap-2 h-full">
            {doc.verified ? (
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${COLORS.success}20`,
                  color: COLORS.success,
                }}
              >
                {t("documentVault.approved", "Approved")}
              </span>
            ) : (
              <Button
                variant="accent"
                size="sm"
                rounded
                onClick={(e) => {
                  e.stopPropagation();
                  handleVerifyClick(doc.id);
                }}
                disabled={!doc.uploaded}
              >
                {t("documentVault.verify", "Verify")}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png"
        />

        {/* Back Button with Applicant Info */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="accent"
            size="md"
            rounded
            icon={<ArrowLeft className="h-5 w-5" />}
            onClick={handleBack}
          />
          <div>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {applicantData.name}
            </h1>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              ID: {applicantData.applicantId}
            </p>
            <p className="text-sm" style={{ color: COLORS.accent }}>
              Enrollment Type - {getEnrollmentTypeLabel(applicantData.enrollmentType)}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card padding="md" shadow="sm">
            <p
              className="text-2xl md:text-3xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {totalDocuments}
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("documentVault.totalDocuments", "Total Documents")}
            </p>
          </Card>
          <Card padding="md" shadow="sm">
            <p
              className="text-2xl md:text-3xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {approvedCount}
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("documentVault.approved", "Approved")}
            </p>
          </Card>
          <Card padding="md" shadow="sm">
            <p
              className="text-2xl md:text-3xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {pendingCount}
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("documentVault.pending", "Pending")}
            </p>
          </Card>
        </div>

        {/* Add Document & Download Buttons */}
        <div className="flex justify-end items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="h-5 w-5" style={{ color: hasDownloadableSelection ? COLORS.accent : COLORS.textMuted }} />}
            onClick={handleDownloadSelected}
            title={t("common.downloadSelected", "Download Selected")}
            disabled={!hasDownloadableSelection}
            style={{ opacity: hasDownloadableSelection ? 1 : 0.4 }}
          />
          <Button
            variant="accent"
            size="sm"
            rounded
            onClick={handleAddDocument}
          >
            {t("documentVault.addDocument", "Add Document")}
          </Button>
        </div>

        {/* Documents Table */}
        <DataTable
          rows={documents}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          hideFooter
          rowSelectionModel={selectedDocs}
          onRowSelectionModelChange={handleSelectionChange}
        />
      </div>

      {/* Verify Confirmation Popup */}
      <Popup
        isOpen={approvePopupOpen}
        onClose={handleVerifyCancel}
        title={t("documentVault.verifyDocument", "Verify Document")}
        size="sm"
        showCloseButton
      >
        <div>
          <p className="text-base mb-6" style={{ color: COLORS.textDark }}>
            {t("documentVault.verifyConfirmation", "Are you sure you want to verify this document?")}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="cancel" rounded onClick={handleVerifyCancel}>
              {t("common.no", "No")}
            </Button>
            <Button variant="accent" rounded onClick={handleVerifyConfirm}>
              {t("common.yes", "Yes")}
            </Button>
          </div>
        </div>
      </Popup>

      {/* Document Viewer Modal */}
      <UploadDocView
        isOpen={viewerOpen}
        file={viewerFile}
        onClose={closeViewer}
      />
    </Layout>
  );
};

export default DocumentDetail;
