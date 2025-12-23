import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout, Card, SearchBar, Button, Checkbox } from "../../../components";
import { COLORS } from "../../../constants";
import {
  ArrowLeft,
  File,
  Download,
  Trash,
  Plus,
  Eye,
  Close,
  Minus,
} from "../../../assets";

// Document type icons mapping
const documentIcons: Record<string, string> = {
  passport: "#8B5CF6",
  transcript: "#3B82F6",
  letter: "#10B981",
  statement: "#F59E0B",
  resume: COLORS.error,
  financial: "#6366F1",
  default: "#64748B",
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

// Mock applicants data
const applicantsData: Record<string, { name: string; applicantId: string; stage: string; enrollmentType: string }> = {
  "S324": {
    name: "Jane Doe",
    applicantId: "S324",
    stage: "Application Submitted",
    enrollmentType: "Walk-in",
  },
  "S342": {
    name: "Rayn",
    applicantId: "S342",
    stage: "Document Submission",
    enrollmentType: "Agency Partner - IDP",
  },
};

// Mock documents data
const initialDocuments: DocumentItem[] = [
  { id: "1", name: "Passport", type: "passport", uploaded: true, verified: true, fileUrl: "/sample.pdf", fileName: "passport.pdf" },
  { id: "2", name: "Transcripts (UG)", type: "transcript", uploaded: false, verified: false },
  { id: "3", name: "Letters of Recommendation", type: "letter", uploaded: false, verified: false },
  { id: "4", name: "Statement of Purpose", type: "statement", uploaded: false, verified: false },
  { id: "5", name: "Resume", type: "resume", uploaded: false, verified: false },
  { id: "6", name: "Financial Statement", type: "financial", uploaded: false, verified: false },
];

const DocumentDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { applicantId } = useParams<{ applicantId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // Get applicant data
  const applicantData = applicantsData[applicantId || "S324"] || applicantsData["S324"];

  // Stats
  const totalDocuments = documents.length;
  const verifiedCount = documents.filter((d) => d.verified).length;
  const pendingCount = documents.filter((d) => !d.verified).length;

  // Filter documents based on search
  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    navigate(-1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocs(documents.map((d) => d.id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleSelectDoc = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocs([...selectedDocs, docId]);
    } else {
      setSelectedDocs(selectedDocs.filter((id) => id !== docId));
    }
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

  const handleVerify = (docId: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === docId ? { ...doc, verified: true } : doc
      )
    );
  };

  const handleDeleteSelected = () => {
    setDocuments(documents.filter((doc) => !selectedDocs.includes(doc.id)));
    setSelectedDocs([]);
  };

  const handleDownloadSelected = () => {
    selectedDocs.forEach((docId) => {
      const doc = documents.find((d) => d.id === docId);
      if (doc?.fileUrl && doc?.fileName) {
        handleDownload(doc.fileUrl, doc.fileName);
      }
    });
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

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
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

        {/* Back Button */}
        <Button
          variant="accent"
          size="sm"
          rounded
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={handleBack}
          className="mb-4"
        />

        {/* Applicant Info */}
        <div className="mb-6">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {applicantData.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
            Applicant ID - {applicantData.applicantId}
          </p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Applicant Stage - {applicantData.stage}
          </p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Enrollment Type - {applicantData.enrollmentType}
          </p>
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
              {verifiedCount}
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("documentVault.verified", "Verified")}
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

        {/* Search Bar with Action Buttons */}
        <div className="flex justify-end items-center gap-3 mb-4">
          {/* Download & Delete buttons - always visible but disabled when no selection */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="h-5 w-5" style={{ color: COLORS.accent }} />}
            onClick={handleDownloadSelected}
            title={t("common.download", "Download Selected")}
            disabled={selectedDocs.length === 0}
            style={{ opacity: selectedDocs.length === 0 ? 0.4 : 1 }}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash className="h-5 w-5" style={{ color: COLORS.error }} />}
            onClick={handleDeleteSelected}
            title={t("common.delete", "Delete Selected")}
            disabled={selectedDocs.length === 0}
            style={{ opacity: selectedDocs.length === 0 ? 0.4 : 1 }}
          />
          <div className="w-full max-w-xs">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t("documentVault.searchPlaceholder", "Search document name, ID...")}
            />
          </div>
        </div>

        {/* Documents Table */}
        <div
          className="rounded-lg overflow-hidden overflow-x-auto"
          style={{ border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}
        >
          <div className="min-w-[600px]">
          {/* Table Header */}
          <div
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center shrink-0"
            style={{ backgroundColor: COLORS.background }}
          >
            <div className="col-span-1">
              <Checkbox
                checked={selectedDocs.length === documents.length && documents.length > 0}
                onChange={handleSelectAll}
              />
            </div>
            <div className="col-span-5">
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: COLORS.textMuted }}
              >
                {t("documentVault.documentName", "Document Name")}
              </span>
            </div>
            <div className="col-span-3">
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: COLORS.textMuted }}
              >
                {t("documentVault.upload", "Upload")}
              </span>
            </div>
            <div className="col-span-3">
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: COLORS.textMuted }}
              >
                {t("documentVault.verificationStatus", "Verification Status")}
              </span>
            </div>
          </div>

          {/* Table Body - Scrollable */}
          <div className="flex-1 overflow-y-auto">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center"
              style={{ borderTop: `1px solid ${COLORS.border}` }}
            >
              {/* Checkbox */}
              <div className="col-span-1">
                <Checkbox
                  checked={selectedDocs.includes(doc.id)}
                  onChange={(checked) => handleSelectDoc(doc.id, checked)}
                />
              </div>

              {/* Document Name */}
              <div className="col-span-5 flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
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
                    placeholder="Enter document name"
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
                    autoFocus
                  />
                ) : (
                  <span style={{ color: COLORS.textDark }}>{doc.name}</span>
                )}
              </div>

              {/* Upload Actions */}
              <div className="col-span-3 flex items-center gap-2">
                {doc.uploaded ? (
                  <>
                    {/* View Button */}
                    <Button
                      variant="accent"
                      size="sm"
                      rounded
                      leftIcon={<Eye className="h-4 w-4" />}
                      onClick={() => handleViewDocument(doc)}
                    >
                      {t("documentVault.view", "View")}
                    </Button>
                    {/* Download */}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download className="h-4 w-4" style={{ color: COLORS.textMuted }} />}
                      onClick={() => doc.fileUrl && doc.fileName && handleDownload(doc.fileUrl, doc.fileName)}
                      title={t("common.download", "Download")}
                    />
                    {/* Remove/Cross Icon */}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Close className="h-4 w-4" style={{ color: COLORS.error }} />}
                      onClick={() => handleRemoveFile(doc.id)}
                      title={t("common.remove", "Remove")}
                    />
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUploadClick(doc.id)}
                    disabled={doc.isNew && !doc.name}
                    style={{ color: COLORS.accent }}
                  >
                    {t("documentVault.upload", "Upload")}
                  </Button>
                )}
              </div>

              {/* Verification Status */}
              <div className="col-span-3 flex items-center gap-2">
                {doc.verified ? (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${COLORS.success}20`,
                      color: COLORS.success,
                    }}
                  >
                    {t("documentVault.verified", "Verified")}
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerify(doc.id)}
                    style={{ color: COLORS.accent }}
                  >
                    {t("documentVault.verify", "Verify")}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredDocuments.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p style={{ color: COLORS.textMuted }}>
                {t("documentVault.noDocuments", "No documents found")}
              </p>
            </div>
          )}
          </div>

          {/* Add Document Row */}
          <div
            className="flex justify-end px-4 py-3 shrink-0"
            style={{ borderTop: `1px solid ${COLORS.border}` }}
          >
            <Button
              variant={selectedDocs.length > 0 ? "danger" : "accent"}
              size="md"
              rounded
              icon={selectedDocs.length > 0 ? (
                <Minus className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              onClick={selectedDocs.length > 0 ? handleDeleteSelected : handleAddDocument}
              title={selectedDocs.length > 0 ? t("common.deleteSelected", "Delete Selected") : t("common.addDocument", "Add Document")}
              className="shadow-md hover:scale-110 transition-transform"
            />
          </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewerOpen && viewerFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeViewer}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Viewer Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${COLORS.border}` }}
            >
              <h3 className="font-semibold" style={{ color: COLORS.textDark }}>
                {viewerFile.name}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download className="h-5 w-5" style={{ color: COLORS.textMuted }} />}
                  onClick={() => handleDownload(viewerFile.url, viewerFile.name)}
                  title={t("common.download", "Download")}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Close className="h-5 w-5" style={{ color: COLORS.textMuted }} />}
                  onClick={closeViewer}
                />
              </div>
            </div>

            {/* Viewer Content */}
            <div className="p-4 overflow-auto" style={{ height: "calc(90vh - 60px)" }}>
              {viewerFile.type === "pdf" && (
                <iframe
                  src={viewerFile.url}
                  className="w-full h-full"
                  title={viewerFile.name}
                />
              )}
              {viewerFile.type === "image" && (
                <img
                  src={viewerFile.url}
                  alt={viewerFile.name}
                  className="max-w-full max-h-full mx-auto"
                />
              )}
              {viewerFile.type === "text" && (
                <iframe
                  src={viewerFile.url}
                  className="w-full h-full bg-white"
                  title={viewerFile.name}
                />
              )}
              {viewerFile.type === "csv" && (
                <iframe
                  src={viewerFile.url}
                  className="w-full h-full bg-white"
                  title={viewerFile.name}
                />
              )}
              {(viewerFile.type === "excel" || viewerFile.type === "word") && (
                <div className="flex flex-col items-center justify-center h-full">
                  <File className="h-16 w-16 mb-4" style={{ color: COLORS.textMuted }} />
                  <p style={{ color: COLORS.textDark }} className="mb-4">
                    {t("documentVault.cannotPreview", "This file type cannot be previewed directly.")}
                  </p>
                  <Button
                    variant="accent"
                    rounded
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => handleDownload(viewerFile.url, viewerFile.name)}
                  >
                    {t("common.download", "Download")}
                  </Button>
                </div>
              )}
              {viewerFile.type === "other" && (
                <div className="flex flex-col items-center justify-center h-full">
                  <File className="h-16 w-16 mb-4" style={{ color: COLORS.textMuted }} />
                  <p style={{ color: COLORS.textDark }} className="mb-4">
                    {t("documentVault.cannotPreview", "This file type cannot be previewed directly.")}
                  </p>
                  <Button
                    variant="accent"
                    rounded
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => handleDownload(viewerFile.url, viewerFile.name)}
                  >
                    {t("common.download", "Download")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DocumentDetail;
