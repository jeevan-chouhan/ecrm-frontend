import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout, Card, Button, Popup, DataTable, ConfirmationPopup } from "../../../components";
import type { GridColDef, GridRowId } from "../../../components";
import { COLORS } from "../../../constants";
import { getEnrollmentTypeLabel } from "../../../utils/commonUtils";
import {
  ArrowLeft,
  File,
  Eye,
  Download,
  Close,
} from "../../../assets";
import UploadDocView from "./UploadDocView";
import type { ViewerFile } from "./UploadDocView";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { handleApiError } from "../../../utils";
import type { ApplicationPreferenceDocument } from "../../../services";

// Interface for navigation state from DocumentVault
interface LocationState {
  applicantName?: string;
  contactNo?: string;
  email?: string;
  enrollmentType?: string;
  status?: string;
  applicationPrefId?: number | string;
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
  fileType?: string;
  applicationPrefId?: number | string;
}

// Mock documents data
const initialDocuments: DocumentItem[] = [
  { id: "1", name: "Passport", type: "passport", uploaded: false, verified: false },
  { id: "2", name: "Transcripts (UG)", type: "transcript", uploaded: false, verified: false },
  { id: "3", name: "Letters of Recommendation", type: "letter", uploaded: false, verified: false },
  { id: "4", name: "Statement of Purpose", type: "statement", uploaded: false, verified: false },
  { id: "5", name: "Resume", type: "resume", uploaded: false, verified: false },
  { id: "6", name: "Financial Statement", type: "financial", uploaded: false, verified: false },
  { id: "7", name: "Embassy Approved Visa", type: "passport", uploaded: false, verified: false },
];

const DocumentDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { applicantId } = useParams<{ applicantId: string }>();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedDocs, setSelectedDocs] = useState<GridRowId[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<ViewerFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [approvePopupOpen, setApprovePopupOpen] = useState(false);
  const [approvingDocId, setApprovingDocId] = useState<string | null>(null);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Refs to prevent duplicate API calls
  const isFetchingRef = useRef(false);
  const fetchedApplicantIdRef = useRef<string | null>(null);

  // Get applicant data from navigation state
  const locationState = location.state as LocationState | null;
  const storedApplicationPrefId = locationState?.applicationPrefId; // Store applicationPrefId from navigation state
  
  // State for applicant data and document counts from API
  const [applicantData, setApplicantData] = useState({
    name: locationState?.applicantName || "",
    applicantId: applicantId || "",
    stage: "Application Submitted",
    enrollmentType: locationState?.enrollmentType || "",
    status: locationState?.status || "",
  });
  
  const [documentCount, setDocumentCount] = useState({
    totalDocuments: 0,
    approved: 0,
    pending: 0,
  });

  // State for verified university and course names
  const [verifiedUniversityAndCourses, setVerifiedUniversityAndCourses] = useState<
    Array<{ universityName: string; courseName: string }>
  >([]);

  // Fetch documents from API and merge with fixed list
  const fetchDocuments = useCallback(async () => {
    if (!applicantId || !storedApplicationPrefId) return;
    
    // Use new API with applicationPrefId
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    
    // Skip if already fetched for this applicantId and applicationPrefId combination
    const fetchKey = `${applicantId}-${storedApplicationPrefId}`;
    if (fetchedApplicantIdRef.current === fetchKey) return;
    
    isFetchingRef.current = true;
    fetchedApplicantIdRef.current = fetchKey;
    dispatch(showLoader());

    try {
      const response = await applicantService.getApplicationPreferenceDocuments(
        applicantId,
        storedApplicationPrefId
      );

      if (response.status === "success" && response.data) {
        // Update applicant data from API
        if (response.data.applicantPersonalDetail) {
          setApplicantData({
            name: response.data.applicantPersonalDetail.applicantName,
            applicantId: response.data.applicantPersonalDetail.applicantId.toString(),
            stage: "Application Submitted",
            enrollmentType: response.data.applicantPersonalDetail.enrollmentType,
            status: locationState?.status || "",
          });
        }

        // Update document count from API
        if (response.data.documentCount) {
          setDocumentCount({
            totalDocuments: response.data.documentCount.totalDocuments,
            approved: response.data.documentCount.approved,
            pending: response.data.documentCount.pending,
          });
        }

        // Update verified university and course names
        if (response.data.verifiedUniversityAndCoursesName && response.data.verifiedUniversityAndCoursesName.length > 0) {
          setVerifiedUniversityAndCourses(
            response.data.verifiedUniversityAndCoursesName.filter(
              (item) => item.universityName && item.courseName
            ).map((item) => ({
              universityName: item.universityName,
              courseName: item.courseName,
            }))
          );
        } else {
          setVerifiedUniversityAndCourses([]);
        }

        // Combine commonDocuments and applicationSpecificDocuments
        const allApiDocuments = [
          ...response.data.commonDocuments,
          ...response.data.applicationSpecificDocuments,
        ];

        // Merge API documents with fixed list
        const mergedDocuments = initialDocuments.map((fixedDoc) => {
          // Find matching document from API by name
          const apiDoc = allApiDocuments.find(
            (doc) => doc.documentName === fixedDoc.name
          );

          if (apiDoc) {
            // Merge API data with fixed document
            return {
              ...fixedDoc,
              id: apiDoc.id.toString(),
              uploaded: true,
              verified: apiDoc.isVerified,
              fileUrl: apiDoc.document?.accessUrl,
              fileName: apiDoc.document?.fileName,
              fileType: apiDoc.document?.fileType,
            };
          }

          // Return fixed document as-is if no match found
          return fixedDoc;
        });

        // Add application-specific documents that are not in initialDocuments
        const applicationSpecificDocs = response.data.applicationSpecificDocuments
          .filter((apiDoc: ApplicationPreferenceDocument) => !initialDocuments.some((fixedDoc) => fixedDoc.name === apiDoc.documentName))
          .map((apiDoc: ApplicationPreferenceDocument) => ({
            id: apiDoc.id.toString(),
            name: apiDoc.documentName,
            type: "default",
            uploaded: true,
            verified: apiDoc.isVerified,
            fileUrl: apiDoc.document?.accessUrl,
            fileName: apiDoc.document?.fileName,
            fileType: apiDoc.document?.fileType,
            applicationPrefId: storedApplicationPrefId,
          }));

        setDocuments([...mergedDocuments, ...applicationSpecificDocs]);
      }
    } catch (error) {
      // Reset ref on error to allow retry
      fetchedApplicantIdRef.current = null;
      const errorMessage = handleApiError(error);
      dispatch(
        addToast({
          type: "error",
          message: typeof errorMessage === "string" ? errorMessage : "Failed to fetch documents",
        })
      );
    } finally {
      isFetchingRef.current = false;
      dispatch(hideLoader());
    }
  }, [applicantId, storedApplicationPrefId, dispatch, locationState?.status]);

  // Fetch documents on mount or when applicantId/applicationPrefId changes
  useEffect(() => {
    // Reset refs when applicantId or applicationPrefId changes
    const fetchKey = storedApplicationPrefId ? `${applicantId}-${storedApplicationPrefId}` : applicantId;
    if (fetchedApplicantIdRef.current && fetchedApplicantIdRef.current !== fetchKey) {
      fetchedApplicantIdRef.current = null;
      isFetchingRef.current = false;
    }
    fetchDocuments();
  }, [fetchDocuments, applicantId, storedApplicationPrefId]);

  // Stats - use API data from documentCount
  const totalDocuments = documentCount.totalDocuments;
  const approvedCount = documentCount.approved;
  const pendingCount = documentCount.pending;

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

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId || !applicantId) {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const doc = documents.find((d) => d.id === uploadingDocId);
    if (!doc) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    dispatch(showLoader());

    try {
      // Check if document is in initialDocuments (predefined documents from screenshot)
      // Embassy Approved Visa is an exception - it always needs applicationPrefId
      // If not in initialDocuments, it's a new document and needs applicationPrefId
      const isPredefinedDocument = initialDocuments.some(
        (initialDoc) => initialDoc.name === doc.name
      );
      
      // Embassy Approved Visa always requires applicationPrefId, even though it's a predefined document
      const isEmbassyApprovedVisa = doc.name === "Embassy Approved Visa";
      
      // Include applicationPrefId for:
      // 1. New documents (not in initialDocuments)
      // 2. Embassy Approved Visa (always requires applicationPrefId)
      const shouldIncludeApplicationPrefId = 
        !isPredefinedDocument || isEmbassyApprovedVisa;
      
      // For Embassy Approved Visa and new documents, always use applicationPrefId
      // Priority: storedApplicationPrefId (from navigation) > doc.applicationPrefId
      const uploadApplicationPrefId = shouldIncludeApplicationPrefId 
        ? (storedApplicationPrefId || doc.applicationPrefId)
        : undefined;

      const response = await applicantService.uploadDocument(
        applicantId,
        doc.name,
        file,
        uploadApplicationPrefId
      );

      if (response.status === "success" && response.data) {
        dispatch(
          addToast({
            type: "success",
            message: response.message || "Document uploaded successfully",
          })
        );

        // Update local state with API response data
        setDocuments(
          documents.map((d) =>
            d.id === uploadingDocId
              ? {
                  ...d,
                  id: response.data.id.toString(),
                  uploaded: true,
                  verified: response.data.isVerified,
                  fileUrl: response.data.document?.accessUrl,
                  fileName: response.data.document?.fileName,
                  fileType: response.data.document?.fileType,
                  file: undefined, // Clear local file object
                }
              : d
          )
        );

        // Refetch documents to get updated list
        await fetchDocuments();
      } else {
        throw new Error(response.message || "Failed to upload document");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(
        addToast({
          type: "error",
          message: typeof errorMessage === "string" ? errorMessage : "Failed to upload document",
        })
      );
    } finally {
      dispatch(hideLoader());
      setUploadingDocId(null);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [uploadingDocId, applicantId, documents, dispatch, fetchDocuments]);

  const handleDeleteClick = (docId: string) => {
    setDeletingDocId(docId);
    setDeletePopupOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingDocId || !applicantId) return;

    setIsDeleting(true);
    dispatch(showLoader());

    try {
      const response = await applicantService.deleteDocument(applicantId, deletingDocId);

      if (response.status === "success") {
        dispatch(
          addToast({
            type: "success",
            message: response.message || "Document deleted successfully",
          })
        );

        // Update local state - remove file data but keep the document row
        setDocuments(
          documents.map((doc) =>
            doc.id === deletingDocId
              ? { ...doc, uploaded: false, file: undefined, fileName: undefined, fileUrl: undefined, fileType: undefined }
              : doc
          )
        );

        // Refetch documents to get updated data
        await fetchDocuments();
      } else {
        throw new Error(response.message || "Failed to delete document");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(
        addToast({
          type: "error",
          message: typeof errorMessage === "string" ? errorMessage : "Failed to delete document",
        })
      );
    } finally {
      setIsDeleting(false);
      dispatch(hideLoader());
      setDeletePopupOpen(false);
      setDeletingDocId(null);
    }
  }, [deletingDocId, applicantId, documents, dispatch, fetchDocuments]);

  const handleDeleteCancel = () => {
    setDeletePopupOpen(false);
    setDeletingDocId(null);
  };

  const handleVerifyClick = (docId: string) => {
    setApprovingDocId(docId);
    setApprovePopupOpen(true);
  };

  const handleVerifyConfirm = useCallback(async () => {
    if (!approvingDocId || !applicantId) return;

    dispatch(showLoader());

    try {
      const response = await applicantService.verifyDocument(
        applicantId,
        approvingDocId,
        true // isVerified = true
      );

      if (response.status === "success") {
        dispatch(
          addToast({
            type: "success",
            message: response.message || "Document verified successfully",
          })
        );

        // Update local state
        setDocuments(
          documents.map((doc) =>
            doc.id === approvingDocId ? { ...doc, verified: true } : doc
          )
        );

        // Refetch documents to get updated data
        await fetchDocuments();
      } else {
        throw new Error(response.message || "Failed to verify document");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(
        addToast({
          type: "error",
          message: typeof errorMessage === "string" ? errorMessage : "Failed to verify document",
        })
      );
    } finally {
      dispatch(hideLoader());
      setApprovePopupOpen(false);
      setApprovingDocId(null);
    }
  }, [approvingDocId, applicantId, documents, dispatch, fetchDocuments]);

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
      // Use fileType from API if available, otherwise detect from fileName
      let detectedType = "other";
      if (doc.fileType) {
        // Use MIME type from API - normalize to lowercase for comparison
        const fileTypeLower = doc.fileType.toLowerCase();
        if (fileTypeLower.includes("pdf")) {
          detectedType = "pdf";
        } else if (fileTypeLower.startsWith("image/")) {
          detectedType = "image";
        } else if (fileTypeLower.includes("text")) {
          detectedType = "text";
        } else if (fileTypeLower.includes("csv")) {
          detectedType = "csv";
        } else if (fileTypeLower.includes("excel") || fileTypeLower.includes("spreadsheet")) {
          detectedType = "excel";
        } else if (fileTypeLower.includes("word") || fileTypeLower.includes("document")) {
          detectedType = "word";
        } else {
          detectedType = getFileType(doc.fileName || "");
        }
      } else {
        detectedType = getFileType(doc.fileName || "");
      }
      
      setViewerFile({
        url: doc.fileUrl,
        name: doc.fileName || doc.name,
        type: detectedType,
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
      applicationPrefId: storedApplicationPrefId, // Store applicationPrefId for new documents
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
      flex: 3,
      minWidth: 300,
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
      field: "verified",
      headerName: t("documentVault.verificationStatus", "Verification Status"),
      flex: 1.2,
      minWidth: 180,
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
    {
      field: "upload",
      headerName: t("documentVault.actions", "Actions"),
      flex: 1,
      minWidth: 150,
      sortable: false,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => {
        const doc = params.row as DocumentItem;
        return (
          <div className="flex items-center gap-2 h-full">
            {doc.uploaded ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDocument(doc);
                  }}
                  className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
                  style={{ color: COLORS.accent }}
                  aria-label={t("documentVault.view", "View")}
                  title={t("documentVault.view", "View")}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (doc.fileUrl && doc.fileName) handleDownload(doc.fileUrl, doc.fileName);
                  }}
                  className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
                  style={{ color: COLORS.accent }}
                  aria-label={t("common.download", "Download")}
                  title={t("common.download", "Download")}
                >
                  <Download className="w-4 h-4" />
                </button>
                {!doc.verified && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(doc.id);
                    }}
                    className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
                    style={{ color: COLORS.error }}
                    aria-label={t("documentVault.deleteDocument", "Delete Document")}
                    title={t("documentVault.deleteDocument", "Delete Document")}
                  >
                    <Close className="w-4 h-4" />
                  </button>
                )}
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
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Enrolment Type - {getEnrollmentTypeLabel(applicantData.enrollmentType)}
            </p>
            {verifiedUniversityAndCourses.length > 0 && (
              <p className="text-sm mt-1" style={{ color: COLORS.error }}>
                {verifiedUniversityAndCourses.length === 1 ? (
                  <>
                    {t("documentVault.embassyVisaApprovedMultiple", "This is to note that the applicant's Embassy visa for")}{" "}
                    <strong>{verifiedUniversityAndCourses[0].universityName}</strong> {t("documentVault.inTheProgram", "in the program")}{" "}
                    <strong>{verifiedUniversityAndCourses[0].courseName}</strong> {t("documentVault.hasBeenApproved", "has been approved.")}
                  </>
                ) : (
                  <>
                    {t("documentVault.embassyVisaApprovedMultiple", "This is to note that the applicant's Embassy visa for")}{" "}
                    {verifiedUniversityAndCourses.map((item, index) => (
                      <span key={index}>
                        <strong>{item.universityName}</strong> {t("documentVault.inTheProgram", "in the program")} <strong>{item.courseName}</strong>
                        {index < verifiedUniversityAndCourses.length - 1 ? "; " : ` ${t("documentVault.hasBeenApproved", "has been approved.")}`}
                      </span>
                    ))}
                  </>
                )}
              </p>
            )}
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
              {t("documentVault.uploadedDocuments", "Uploaded Documents")}
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
          isRowSelectable={(params) => {
            if (!params.row) return false;
            const doc = params.row as DocumentItem;
            return doc?.uploaded === true;
          }}
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
        {approvingDocId && (
          <div>
            <p className="text-sm mb-4" style={{ color: COLORS.textDark }}>
              {t("documentVault.verifyConfirmation", "Are you sure you want to verify this document?")}
            </p>
            {(() => {
              const docToVerify = documents.find((d) => d.id === approvingDocId);
              return docToVerify ? (
                <div className="text-sm space-y-1 mb-6">
                  <div>
                    <span className="font-medium" style={{ color: COLORS.textDark }}>
                      {t("documentVault.documentName", "Document Name")}:{" "}
                    </span>
                    <span style={{ color: COLORS.textMuted }}>{docToVerify.name}</span>
                  </div>
                  {docToVerify.fileName && (
                    <div>
                      <span className="font-medium" style={{ color: COLORS.textDark }}>
                        {t("documentVault.fileName", "File Name")}:{" "}
                      </span>
                      <span style={{ color: COLORS.textMuted }}>{docToVerify.fileName}</span>
                    </div>
                  )}
                </div>
              ) : null;
            })()}
            <div className="flex justify-end gap-3">
              <Button variant="cancel" rounded onClick={handleVerifyCancel}>
                {t("common.no", "No")}
              </Button>
              <Button variant="accent" rounded onClick={handleVerifyConfirm}>
                {t("common.yes", "Yes")}
              </Button>
            </div>
          </div>
        )}
      </Popup>

      {/* Document Viewer Modal */}
      <UploadDocView
        isOpen={viewerOpen}
        file={viewerFile}
        onClose={closeViewer}
      />

      {/* Delete Confirmation Popup */}
      <ConfirmationPopup
        isOpen={deletePopupOpen}
        title={t("documentVault.deleteDocument", "Delete Document")}
        isLoading={isDeleting}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      >
        {deletingDocId && (
          <div className="space-y-3">
            {(() => {
              const docToDelete = documents.find((d) => d.id === deletingDocId);
              return docToDelete ? (
                <>
                  <p className="text-sm" style={{ color: COLORS.textDark }}>
                    {t(
                      "documentVault.deleteConfirmation",
                      "Are you sure you want to delete the document '{{documentName}}'?",
                      { documentName: docToDelete.name }
                    )}
                  </p>
                  <div className="text-sm space-y-1">
                    {docToDelete.fileName && (
                      <div>
                        <span className="font-medium" style={{ color: COLORS.textDark }}>
                          {t("documentVault.fileName", "File Name")}:{" "}
                        </span>
                        <span style={{ color: COLORS.textMuted }}>{docToDelete.fileName}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: COLORS.textDark }}>
                  {t(
                    "documentVault.deleteConfirmation",
                    "Are you sure you want to delete this document? This action cannot be undone."
                  )}
                </p>
              );
            })()}
          </div>
        )}
      </ConfirmationPopup>
    </Layout>
  );
};

export default DocumentDetail;
