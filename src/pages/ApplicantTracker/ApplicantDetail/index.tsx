import { useState, useEffect, useCallback, startTransition, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { Layout, StatusChangePopup, ConfirmationPopup } from "../../../components";
import { COLORS, ROUTES, applicationStatusOptions, mockApplicantDetail } from "../../../constants";
import { formatDateTime, toSlug, handleApiError } from "../../../utils";
import type { ApplicantDetail, UniversityApplication, ApplicationStatusHistory, PersonalDetails, EducationalDetails, WorkExperienceItem, AchievementItem, DocumentItem, ApplicationSpecificDocumentItem } from "./types";
import { applicantService, userService } from "../../../services";
import type { CompleteDetailsData, ApplicationListItem, ApplicationPreferenceDocument } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import ApplicantHeader from "./ApplicantHeader";
import UniversityApplicationTable from "./UniversityApplicationTable";
import ApplicantCards from "./ApplicantCards";
import ApplicationStatusPopup from "./ApplicationStatusPopup";
import ApplicationStatusHistoryPopup from "./ApplicationStatusHistoryPopup";
import UploadDocView from "../../DocumentVault/DocumentDetail/UploadDocView";
import type { ViewerFile } from "../../DocumentVault/DocumentDetail/UploadDocView";

// Helper function to get document type from document name
const getDocumentType = (documentName: string): string => {
  const nameLower = documentName.toLowerCase();
  if (nameLower.includes("passport") || nameLower.includes("visa")) return "passport";
  if (nameLower.includes("transcript")) return "transcript";
  if (nameLower.includes("recommendation") || nameLower.includes("lor")) return "letter";
  if (nameLower.includes("purpose") || nameLower.includes("sop")) return "statement";
  if (nameLower.includes("resume") || nameLower.includes("cv")) return "resume";
  if (nameLower.includes("financial")) return "financial";
  return "default";
};

// Transform API document to DocumentItem format
const transformDocument = (apiDoc: ApplicationPreferenceDocument): DocumentItem => {
  return {
    id: apiDoc.id.toString(),
    name: apiDoc.documentName,
    type: getDocumentType(apiDoc.documentName),
    uploaded: !!apiDoc.document,
    verified: apiDoc.isVerified,
    fileUrl: apiDoc.document?.accessUrl,
    fileName: apiDoc.document?.fileName,
    fileType: apiDoc.document?.fileType,
  };
};

// Transform API application-specific document to ApplicationSpecificDocumentItem format
const transformApplicationSpecificDocument = (apiDoc: ApplicationPreferenceDocument): ApplicationSpecificDocumentItem => {
  return {
    id: apiDoc.id.toString(),
    name: apiDoc.documentName,
    type: getDocumentType(apiDoc.documentName),
    uploaded: !!apiDoc.document,
    verified: apiDoc.isVerified,
    fileUrl: apiDoc.document?.accessUrl,
    fileName: apiDoc.document?.fileName,
    fileType: apiDoc.document?.fileType,
    universityName: apiDoc.universityName || null,
    courseName: apiDoc.courseName || null,
  };
};

// Transform API data to component format
const transformCompleteDetails = (
  apiData: CompleteDetailsData,
  applicantId: string
): Partial<ApplicantDetail> => {
  const { personalDetails, educationalDetails, workExperiences, achievements, commonDocuments, applicationSpecificDocuments } = apiData;

  // Transform personal details
  const transformedPersonalDetails: PersonalDetails = {
    profilePhoto: personalDetails.profilePhoto,
    enrollmentType: personalDetails.enrollmentType || undefined,
    name: personalDetails.name,
    dateOfBirth: personalDetails.dob,
    gender: personalDetails.gender,
    countryCode: personalDetails.countryCode,
    contactNumber: personalDetails.contactNumber,
    emailId: personalDetails.email,
    permanentAddress: personalDetails.permanentAddress,
    notes: personalDetails.notes,
  };

  // Transform educational details
  const transformedEducationalDetails: EducationalDetails = {
    highestQualification: educationalDetails.highestQualification,
    institutionName: educationalDetails.instituteName,
    boardUniversity: educationalDetails.universityName,
    program: educationalDetails.courseType,
    major: educationalDetails.fieldType,
    scoreType: educationalDetails.scoreType,
    score: educationalDetails.score,
    passingYear: educationalDetails.passingYear,
  };

  // Transform work experiences
  const transformedWorkExperiences: WorkExperienceItem[] = workExperiences.map((exp) => ({
    id: exp.id.toString(),
    companyName: exp.companyName,
    jobTitle: exp.jobTitle,
    startDate: exp.startDate,
    endDate: exp.endDate,
    currentlyWorking: exp.isCurrentlyWorking,
  }));

  // Transform achievements
  const transformedAchievements: AchievementItem[] = achievements.map((ach) => {
    // Parse document JSON if it exists
    let documentFileName: string | null = null;
    if (ach.document) {
      try {
        const docData = JSON.parse(ach.document);
        documentFileName = docData.fileName || null;
      } catch {
        // If parsing fails, use the raw string
        documentFileName = ach.document;
      }
    }
    
    return {
      id: ach.id.toString(),
      category: ach.category,
      description: ach.description,
      documents: documentFileName,
    };
  });

  // Transform documents from commonDocuments and applicationSpecificDocuments
  const transformedCommonDocuments: DocumentItem[] = [];
  const transformedApplicationSpecificDocuments: ApplicationSpecificDocumentItem[] = [];
  
  // Add common documents
  if (commonDocuments && commonDocuments.length > 0) {
    transformedCommonDocuments.push(...commonDocuments.map(transformDocument));
  }
  
  // Add application-specific documents
  if (applicationSpecificDocuments && applicationSpecificDocuments.length > 0) {
    transformedApplicationSpecificDocuments.push(...applicationSpecificDocuments.map(transformApplicationSpecificDocument));
  }

  // Map status from API response (ACTIVE/INACTIVE) to component format (Active/Inactive)
  const mappedStatus: "Active" | "Inactive" = 
    personalDetails.status === "ACTIVE" ? "Active" : 
    personalDetails.status === "INACTIVE" ? "Inactive" : 
    "Active"; // Default to Active if status is not provided

  return {
    id: applicantId,
    applicantId: personalDetails.applicantId.toString(),
    applicantName: personalDetails.name,
    applicantStage: "Lead", // Default stage, can be updated from applications
    enrollmentType: personalDetails.enrollmentType || "",
    notes: personalDetails.notes || "",
    status: mappedStatus,
    personalDetails: transformedPersonalDetails,
    educationalDetails: transformedEducationalDetails,
    workExperience: { experiences: transformedWorkExperiences },
    achievements: { achievements: transformedAchievements },
    documents: { 
      documents: transformedCommonDocuments,
      applicationSpecificDocuments: transformedApplicationSpecificDocuments,
    },
  };
};

// Transform API ApplicationListItem to UniversityApplication format
const transformApplicationListItemToUniversityApplication = (
  item: ApplicationListItem,
  index: number
): UniversityApplication => {
  return {
    id: item.preferenceId.toString(),
    no: index + 1,
    university: item.universityName || "-",
    country: item.countryName || "-",
    course: item.course || "-",
    applicationStage: item.applicantStage || "-",
    status: item.applicantStatus || "Apply",
    intake: item.desiredIntake || "-",
    counselor: item.counselorName || "-",
    agencyPartner: item.agencyPartnerName || item.agencyName || "-",
    appliedDate: item.appliedDate ? formatDateTime(new Date(item.appliedDate)) : "",
    lastUpdated: item.updatedAt ? formatDateTime(new Date(item.updatedAt)) : "",
  };
};

// Type for navigation state from dashboard
interface NavigationState {
  from?: string;
  applicantData?: {
    applicantId: number;
    applicantName: string;
    email: string;
    contactNo: string;
    enrollmentType: string;
    status: string;
    notes: string;
  };
}

const ApplicantDetailView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { applicantId } = useParams<{ applicantId: string }>();
  const { user } = useAppSelector((state) => state.auth);

  // Get applicant data from navigation state (passed from dashboard)
  const locationState = location.state as NavigationState | null;
  const applicantDataFromDashboard = locationState?.applicantData;

  // State - initialize with data from navigation state if available
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(() => {
    if (applicantDataFromDashboard) {
      return {
        id: applicantDataFromDashboard.applicantId.toString(),
        applicantId: applicantDataFromDashboard.applicantId.toString(),
        applicantName: applicantDataFromDashboard.applicantName,
        applicantStage: "",
        enrollmentType: applicantDataFromDashboard.enrollmentType || "",
        applications: [],
        notes: applicantDataFromDashboard.notes || "",
        status: applicantDataFromDashboard.status as "Active" | "Inactive",
        personalDetails: undefined,
        educationalDetails: undefined,
        workExperience: undefined,
        achievements: undefined,
        documents: undefined,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [totalRowCount, setTotalRowCount] = useState(0);

  // Sort state - default to lastUpdated desc
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "lastUpdated", sort: "desc" },
  ]);
  
  // Status change popup state (for applicant status)
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  
  // Application status change popup state
  const [isApplicationStatusPopupOpen, setIsApplicationStatusPopupOpen] = useState(false);
  const [isChangingApplicationStatus, setIsChangingApplicationStatus] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<UniversityApplication | null>(null);
  const [newApplicationStatus, setNewApplicationStatus] = useState("");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [notifyStudent, setNotifyStudent] = useState(true);
  
  // Apply button confirmation popup state
  const [isApplyConfirmationOpen, setIsApplyConfirmationOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationToApply, setApplicationToApply] = useState<UniversityApplication | null>(null);
  
  // Status history popup state - using single object for better performance
  const [isStatusHistoryPopupOpen, setIsStatusHistoryPopupOpen] = useState(false);
  const [selectedApplicationForHistory, setSelectedApplicationForHistory] = useState<UniversityApplication | null>(null);
  const [statusHistoryData, setStatusHistoryData] = useState<{
    history: ApplicationStatusHistory[];
    universityName: string;
    applicantName: string;
  } | null>(null);
  const [isLoadingStatusHistory, setIsLoadingStatusHistory] = useState(false);
  
  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<ViewerFile | null>(null);

  // Track which applicantId has been fetched to prevent duplicate calls
  const fetchedForApplicantId = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchedApplicationsForApplicantId = useRef<string | null>(null);
  const hasFetchedApplicationsOnMountRef = useRef(false);
  const lastPaginationRef = useRef({ page: paginationModel.page, pageSize: paginationModel.pageSize });

  // Set mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch applicant applications
  const fetchApplicantApplications = useCallback(async (showLoaderFlag = false) => {
    if (!applicantId || !user?.agencyId) return;

    // Skip if already fetched for this applicantId (unless forced refresh)
    // Note: We always refetch when pagination changes, so we check paginationModel too
    if (fetchedApplicationsForApplicantId.current === applicantId && !showLoaderFlag) return;
    
    // Mark as fetching for this applicantId
    fetchedApplicationsForApplicantId.current = applicantId;

    if (showLoaderFlag) {
      setLoading(true);
      dispatch(showLoader());
    }

    try {
      // Fetch applications list with proper pagination and applicantId filter
      const response = await applicantService.getApplicationsList({
        agencyId: user.agencyId,
        applicantId: parseInt(applicantId), // Send applicantId as query parameter
        assignedAdminId: null, // Not sending assignedAdminId for University Application Summary table
        assignedManagerId: null,
        assignedCounselorId: null,
        applicationStatus: null,
        applicationStage: null,
        universityId: null,
        desiredIntake: null,
        agencyPartnerId: null,
        appliedFrom: null,
        appliedTo: null,
        updatedFrom: null,
        updatedTo: null,
        search: null,
        page: paginationModel.page,
        size: paginationModel.pageSize, // Use pagination size from model
        sortBy: sortModel.length > 0 ? (sortModel[0].field === "lastUpdated" ? "updatedAt" : sortModel[0].field) : "updatedAt",
        asc: sortModel.length > 0 ? (sortModel[0].sort === "asc") : false,
      });

      if (response.status === "success" && response.data) {
        // No need to filter client-side since API now filters by applicantId
        const applicantApplications = response.data.content;

        // Transform API response to UniversityApplication format
        const transformedApplications: UniversityApplication[] = applicantApplications.map(
          (item, index) => transformApplicationListItemToUniversityApplication(item, index)
        );

        // Update total row count for pagination
        setTotalRowCount(response.data.totalElements || 0);

        // Update applicant state with applications
        setApplicant((prevApplicant) =>
          prevApplicant
            ? {
                ...prevApplicant,
                applications: transformedApplications,
              }
            : null
        );
      } else {
        // If no applications found, set empty array
        setApplicant((prevApplicant) =>
          prevApplicant
            ? {
                ...prevApplicant,
                applications: [],
              }
            : null
        );
      }
    } catch (error) {
      // Reset ref on error so it can retry
      fetchedApplicationsForApplicantId.current = null;
      const { message } = handleApiError(error, "Failed to fetch applications");
      dispatch(addToast({ type: "error", message }));
      
      // Set empty array on error
      setApplicant((prevApplicant) =>
        prevApplicant
          ? {
              ...prevApplicant,
              applications: [],
            }
          : null
      );
    } finally {
      if (showLoaderFlag) {
        setLoading(false);
        dispatch(hideLoader());
      }
    }
  }, [applicantId, user?.agencyId, dispatch, paginationModel.page, paginationModel.pageSize, sortModel]);

  // Fetch applicant data
  useEffect(() => {
    const fetchApplicantDetail = async () => {
      if (!applicantId || !user?.agencyId) return;

      // Skip if already fetched for this applicantId
      if (fetchedForApplicantId.current === applicantId) return;
      
      // Mark as fetching for this applicantId
      fetchedForApplicantId.current = applicantId;
      // Reset applications fetch flag when applicantId changes
      hasFetchedApplicationsOnMountRef.current = false;
      fetchedApplicationsForApplicantId.current = null;

      setLoading(true);
      dispatch(showLoader());

      try {
        // Fetch complete details from API
        const response = await applicantService.getCompleteDetails({
          agencyId: user.agencyId,
          applicantId: applicantId,
        });

        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        if (response.status === "success" && response.data) {
          // Transform API data to component format
          const transformedData = transformCompleteDetails(response.data, applicantId);
          
          // Merge with existing applicant data (applications will be fetched separately)
          setApplicant((prev) => ({
            ...prev,
            ...transformedData,
            applications: prev?.applications || [],
          } as ApplicantDetail));

          // Notes are now read-only, stored in applicant state
        } else {
          // Reset ref on error so it can retry
          fetchedForApplicantId.current = null;
          throw new Error(response.message || "Failed to fetch applicant details");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return; // Ignore abort errors
        }
        // Reset ref on error so it can retry
        fetchedForApplicantId.current = null;
        const { message } = handleApiError(error, "Failed to fetch applicant details");
        dispatch(addToast({ type: "error", message }));
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          dispatch(hideLoader());
        }
      }
    };

    if (applicantId) {
      fetchApplicantDetail();
      // Fetch applications only once when applicantId changes (not on pagination change)
      if (!hasFetchedApplicationsOnMountRef.current) {
        hasFetchedApplicationsOnMountRef.current = true;
        fetchApplicantApplications(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId, user?.agencyId, dispatch]);

  // Refetch applications when pagination changes (but not on initial mount or applicantId change)
  useEffect(() => {
    if (applicantId && user?.agencyId && hasFetchedApplicationsOnMountRef.current) {
      // Check if pagination actually changed
      const paginationChanged = 
        lastPaginationRef.current.page !== paginationModel.page || 
        lastPaginationRef.current.pageSize !== paginationModel.pageSize;
      
      if (paginationChanged) {
        // Reset the ref to allow refetch when pagination changes
        fetchedApplicationsForApplicantId.current = null;
        lastPaginationRef.current = { page: paginationModel.page, pageSize: paginationModel.pageSize };
        fetchApplicantApplications(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, applicantId, user?.agencyId]);

  // Get applications for table (no need for useMemo - just direct access)
  const filteredApplications = applicant?.applications || [];

  // Helper function to get file type from file name or MIME type
  const getFileType = (fileName?: string, fileType?: string): string => {
    if (fileType) {
      const fileTypeLower = fileType.toLowerCase();
      if (fileTypeLower.includes("pdf")) return "pdf";
      if (fileTypeLower.startsWith("image/")) return "image";
      if (fileTypeLower.includes("text")) return "text";
      if (fileTypeLower.includes("csv")) return "csv";
      if (fileTypeLower.includes("excel") || fileTypeLower.includes("spreadsheet")) return "excel";
      if (fileTypeLower.includes("word") || fileTypeLower.includes("document")) return "word";
    }
    
    if (fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      if (["pdf"].includes(ext)) return "pdf";
      if (["txt"].includes(ext)) return "text";
      if (["csv"].includes(ext)) return "csv";
      if (["xls", "xlsx"].includes(ext)) return "excel";
      if (["doc", "docx"].includes(ext)) return "word";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    }
    
    return "other";
  };

  // Handle document view
  const handleDocumentView = useCallback((doc: DocumentItem | ApplicationSpecificDocumentItem) => {
    if (doc.fileUrl) {
      const detectedType = getFileType(doc.fileName, doc.fileType);
      setViewerFile({
        url: doc.fileUrl,
        name: doc.fileName || doc.name,
        type: detectedType,
      });
      setViewerOpen(true);
    }
  }, []);

  // Handle document download
  const handleDocumentDownload = useCallback((doc: DocumentItem | ApplicationSpecificDocumentItem) => {
    if (doc.fileUrl && doc.fileName) {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Handle back navigation - navigate to dashboard
  const handleBack = useCallback(() => {
    navigate(ROUTES.DASHBOARD);
  }, [navigate]);

  // Handle edit applicant - navigate to create applicant flow with applicantId
  const handleEdit = useCallback(() => {
    navigate(`${ROUTES.CREATE_APPLICANT}?applicantId=${applicantId}`);
  }, [navigate, applicantId]);

  // Handle apply button click
  const handleApplyClick = useCallback((app: UniversityApplication) => {
    setApplicationToApply(app);
    setIsApplyConfirmationOpen(true);
  }, []);

  // Handle pagination model change
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  // Handle update application status - open popup for specific application
  const handleUpdateApplicationStatus = useCallback((application: UniversityApplication) => {
    setSelectedApplication(application);
    // Map the application status to the constant value format
    // Try to find exact match first, then try case-insensitive match
    const statusValue = applicationStatusOptions.find(
      (opt) => opt.label === application.status || 
               opt.label.toLowerCase() === application.status.toLowerCase()
    )?.value || toSlug(application.status);
    setNewApplicationStatus(statusValue);
    setApplicationNotes("");
    setNotifyStudent(true);
    setIsApplicationStatusPopupOpen(true);
  }, []);

  // Handle confirm application status change
  const handleConfirmApplicationStatusChange = useCallback(async () => {
    if (!selectedApplication || !applicant || !applicantId || !newApplicationStatus) return;

    setIsChangingApplicationStatus(true);
    dispatch(showLoader());

    try {
      // Call Update Application Status API
      const response = await applicantService.updateApplicationStatus({
        applicantId: parseInt(applicantId),
        applicationPrefId: parseInt(selectedApplication.id), // id is preferenceId
        applicationStatus: newApplicationStatus,
        notes: applicationNotes || "",
        isMailSendToStudent: notifyStudent,
      });

      if (response.status === "success") {
        // Show success toast
        dispatch(
          addToast({
            type: "success",
            message: response.message || t("applicantDetailView.statusUpdateSuccess", "Application status updated successfully"),
          })
        );

        // Refetch applications to get updated data
        fetchedApplicationsForApplicantId.current = null; // Reset to allow refetch
        await fetchApplicantApplications(false); // Don't show loader as we're already showing it

        // Batch popup state cleanup
        setIsApplicationStatusPopupOpen(false);
        setSelectedApplication(null);
        setNewApplicationStatus("");
        setApplicationNotes("");
        setNotifyStudent(true);
      } else {
        throw new Error(response.message || "Failed to update application status");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to update application status");
      dispatch(addToast({ type: "error", message }));
    } finally {
      setIsChangingApplicationStatus(false);
      dispatch(hideLoader());
    }
  }, [selectedApplication, applicant, applicantId, newApplicationStatus, applicationNotes, notifyStudent, dispatch, t, fetchApplicantApplications]);

  // Handle cancel application status change
  const handleCancelApplicationStatusChange = useCallback(() => {
    setIsApplicationStatusPopupOpen(false);
    setSelectedApplication(null);
    setNewApplicationStatus("");
    setApplicationNotes("");
    setNotifyStudent(true);
  }, []);

  // Handle confirm apply - update status to Application Submitted
  const handleConfirmApply = useCallback(async () => {
    if (!applicationToApply || !applicantId) return;

    setIsApplying(true);
    dispatch(showLoader());

    try {
      // Call Apply API
      const response = await applicantService.applyApplication({
        applicantId: parseInt(applicantId),
        applicationPrefId: parseInt(applicationToApply.id), // id is preferenceId
      });

      if (response.status === "success" && response.data) {
        // Show success toast
        dispatch(
          addToast({
            type: "success",
            message: response.message || t("applicantDetailView.applySuccess", "Application applied successfully"),
          })
        );

        // Refetch applications to get updated data
        fetchedApplicationsForApplicantId.current = null; // Reset to allow refetch
        await fetchApplicantApplications(false); // Don't show loader as we're already showing it

        // Batch popup state cleanup
        setIsApplyConfirmationOpen(false);
        setApplicationToApply(null);
      } else {
        throw new Error(response.message || "Failed to apply application");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to apply application");
      dispatch(addToast({ type: "error", message }));
    } finally {
      setIsApplying(false);
      dispatch(hideLoader());
    }
  }, [applicationToApply, applicantId, dispatch, t, fetchApplicantApplications]);

  // Handle cancel apply
  const handleCancelApply = useCallback(() => {
    setIsApplyConfirmationOpen(false);
    setApplicationToApply(null);
  }, []);

  // Handle status toggle - open confirmation popup
  const handleStatusToggle = useCallback(() => {
    if (applicant) {
      setIsStatusPopupOpen(true);
    }
  }, [applicant]);

  // Handle confirm status change
  const handleConfirmStatusChange = useCallback(async () => {
    if (!applicant || !applicantId) return;

    setIsChangingStatus(true);

    try {
      // Call API to update applicant status
      const newStatusValue = applicant.status === "Active" ? "INACTIVE" : "ACTIVE";
      const response = await userService.updateApplicantStatus(
        { applicantId: parseInt(applicantId) },
        {
          applicantId: parseInt(applicantId),
          applicationPrefId: 0, // Not required for status toggle
          applicationStatus: newStatusValue,
          notes: `Status changed to ${newStatusValue}`,
          isMailSendToStudent: false,
        }
      );

      if (response.status === "success") {
        // Update local state based on API response
        const newStatus = response.data.status === "ACTIVE" ? "Active" : "Inactive";
        setApplicant((prevApplicant) =>
          prevApplicant
            ? { ...prevApplicant, status: newStatus as "Active" | "Inactive" }
            : null
        );

        dispatch(addToast({
          type: "success",
          message: t("applicantDetailView.statusUpdateSuccess", "Applicant status updated successfully"),
        }));
      }

      setIsStatusPopupOpen(false);
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(addToast({
        type: "error",
        message: typeof errorMessage === "string" ? errorMessage : t("applicantDetailView.statusUpdateError", "Failed to update applicant status"),
      }));
    } finally {
      setIsChangingStatus(false);
    }
  }, [applicant, applicantId, dispatch, t]);

  // Handle cancel status change
  const handleCancelStatusChange = useCallback(() => {
    setIsStatusPopupOpen(false);
  }, []);

  // Handle application status change
  const handleApplicationStatusChange = useCallback((status: string) => {
    setNewApplicationStatus(status);
  }, []);

  // Handle application notes change
  const handleApplicationNotesChange = useCallback((notes: string) => {
    setApplicationNotes(notes);
  }, []);

  // Handle notify student change
  const handleNotifyStudentChange = useCallback((notify: boolean) => {
    setNotifyStudent(notify);
  }, []);

  // Handle view status history - optimized with React 18 patterns
  const handleViewStatusHistory = useCallback(async (application: UniversityApplication) => {
    if (!applicantId) return;

    setSelectedApplicationForHistory(application);
    setIsStatusHistoryPopupOpen(true);
    setIsLoadingStatusHistory(true);
    
    // Clear previous data - non-urgent, can use transition
    startTransition(() => {
      setStatusHistoryData(null);
    });

    try {
      // Call Status History API
      const response = await applicantService.getStatusHistory({
        applicantId: parseInt(applicantId),
        applicationPrefId: parseInt(application.id), // application.id is preferenceId
      });

      if (response.status === "success" && response.data && response.data.length > 0) {
        // Get the first item from the data array
        const apiData = response.data[0];
        
        // Pre-compute all data transformations and create single state object
        const mappedHistory: ApplicationStatusHistory[] = apiData.historyStatusListList.map((item) => ({
          id: item.historyId.toString(),
          statusName: item.applicationStatus,
          notes: item.notes || "",
          time: item.createdAt,
          createdBy: item.createdBy || "",
        }));

        // Single state update with all data - more efficient
        setStatusHistoryData({
          history: mappedHistory,
          universityName: apiData.universityName || "",
          applicantName: apiData.applicantName || "",
        });
        setIsLoadingStatusHistory(false);
      } else {
        throw new Error(response.message || "Failed to fetch status history");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch status history");
      dispatch(addToast({ type: "error", message }));
      
      // Update error state synchronously
      setStatusHistoryData(null);
      setIsLoadingStatusHistory(false);
    }
  }, [applicantId, dispatch]);

  // Handle close status history popup - batch state updates
  const handleCloseStatusHistory = useCallback(() => {
    // React 18+ automatically batches these state updates
    setIsStatusHistoryPopupOpen(false);
    setSelectedApplicationForHistory(null);
    setStatusHistoryData(null);
    setIsLoadingStatusHistory(false);
  }, []);

  // Merge applicant data with mock data for applications and documents
  const displayApplicant: ApplicantDetail = {
    id: applicant?.id || applicantId || "",
    applicantId: applicant?.applicantId || applicantId || "",
    applicantName: applicant?.applicantName || "",
    applicantStage: applicant?.applicantStage || "",
    enrollmentType: applicant?.enrollmentType || "",
    applications: applicant?.applications || mockApplicantDetail.applications,
    notes: applicant?.notes || "",
    status: applicant?.status || "Active",
    personalDetails: applicant?.personalDetails,
    educationalDetails: applicant?.educationalDetails,
    workExperience: applicant?.workExperience,
    achievements: applicant?.achievements,
    documents: applicant?.documents || mockApplicantDetail.documents,
  };

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Applicant Header */}
        <ApplicantHeader
          applicant={displayApplicant}
          onBack={handleBack}
          onEdit={handleEdit}
          onStatusToggle={handleStatusToggle}
        />

        {/* University Application Summary */}
        <UniversityApplicationTable
          applications={filteredApplications}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          rowCount={totalRowCount}
          onUpdateStatus={handleUpdateApplicationStatus}
          onApply={handleApplyClick}
          onViewStatusHistory={handleViewStatusHistory}
        />

        {/* Card Sections */}
        <ApplicantCards 
          applicant={displayApplicant}
          onDocumentView={handleDocumentView}
          onDocumentDownload={handleDocumentDownload}
        />

        {/* Document Viewer Modal */}
        <UploadDocView
          isOpen={viewerOpen}
          file={viewerFile}
          onClose={() => {
            setViewerOpen(false);
            setViewerFile(null);
          }}
        />

        {/* Applicant Status Change Confirmation Popup */}
        <StatusChangePopup
          isOpen={isStatusPopupOpen}
          item={displayApplicant}
          isChanging={isChangingStatus}
          onClose={handleCancelStatusChange}
          onConfirm={handleConfirmStatusChange}
          nameKey="applicantName"
        />

        {/* Application Status Change Popup */}
        <ApplicationStatusPopup
          isOpen={isApplicationStatusPopupOpen}
          application={selectedApplication}
          newStatus={newApplicationStatus}
          notes={applicationNotes}
          notifyStudent={notifyStudent}
          isChanging={isChangingApplicationStatus}
          onClose={handleCancelApplicationStatusChange}
          onConfirm={handleConfirmApplicationStatusChange}
          onStatusChange={handleApplicationStatusChange}
          onNotesChange={handleApplicationNotesChange}
          onNotifyStudentChange={handleNotifyStudentChange}
        />

        {/* Apply Confirmation Popup */}
        <ConfirmationPopup
          isOpen={isApplyConfirmationOpen}
          title={t("applicantDetailView.confirmApply", "Confirm Application")}
          isLoading={isApplying}
          onClose={handleCancelApply}
          onConfirm={handleConfirmApply}
        >
          {applicationToApply && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {t(
                  "applicantDetailView.confirmApplyMessage",
                  "Are you sure you want to apply for {{university}}? This will set the status to 'Lead' and set the applied date to today.",
                  {
                    university: applicationToApply.university,
                  }
                )}
              </p>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium" style={{ color: COLORS.textDark }}>
                    {t("applicantDetailView.university", "University")}:{" "}
                  </span>
                  <span style={{ color: COLORS.textMuted }}>
                    {applicationToApply.university}
                  </span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: COLORS.textDark }}>
                    {t("applicantDetailView.course", "Course")}:{" "}
                  </span>
                  <span style={{ color: COLORS.textMuted }}>
                    {applicationToApply.course}
                  </span>
                </div>
              </div>
            </div>
          )}
        </ConfirmationPopup>

        {/* Application Status History Popup */}
        <ApplicationStatusHistoryPopup
          isOpen={isStatusHistoryPopupOpen}
          applicationId={selectedApplicationForHistory?.id || null}
          statusHistoryData={statusHistoryData}
          isLoading={isLoadingStatusHistory}
          onClose={handleCloseStatusHistory}
        />
      </div>
    </Layout>
  );
};

export default ApplicantDetailView;

