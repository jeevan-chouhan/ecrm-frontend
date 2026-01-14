import { useState, useMemo, useEffect, useCallback, startTransition, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { Layout, StatusChangePopup, ConfirmationPopup } from "../../../components";
import { COLORS, ROUTES, applicationStatusOptions, mockApplicantDetail } from "../../../constants";
import { formatDate, toSlug, handleApiError } from "../../../utils";
import type { ApplicantDetail, UniversityApplication, ApplicationStatusHistory, PersonalDetails, EducationalDetails, WorkExperienceItem, AchievementItem } from "./types";
import { applicantService, userService } from "../../../services";
import type { CompleteDetailsData } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import ApplicantHeader from "./ApplicantHeader";
import UniversityApplicationTable from "./UniversityApplicationTable";
import ApplicantCards from "./ApplicantCards";
import NotesSection from "./NotesSection";
import ApplicationStatusPopup from "./ApplicationStatusPopup";
import ApplicationStatusHistoryPopup from "./ApplicationStatusHistoryPopup";

// Transform API data to component format
const transformCompleteDetails = (
  apiData: CompleteDetailsData,
  applicantId: string
): Partial<ApplicantDetail> => {
  const { personalDetails, educationalDetails, workExperiences, achievements } = apiData;

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

  return {
    id: applicantId,
    applicantId: personalDetails.applicantId.toString(),
    applicantName: personalDetails.name,
    applicantStage: "Lead", // Default stage, can be updated from applications
    enrollmentType: personalDetails.enrollmentType || "",
    notes: personalDetails.notes || "",
    status: "Active" as const, // Default, will be updated from status
    personalDetails: transformedPersonalDetails,
    educationalDetails: transformedEducationalDetails,
    workExperience: { experiences: transformedWorkExperiences },
    achievements: { achievements: transformedAchievements },
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
  const [notes, setNotes] = useState(() => applicantDataFromDashboard?.notes || "");
  const [originalNotes, setOriginalNotes] = useState(() => applicantDataFromDashboard?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
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

  // Track which applicantId has been fetched to prevent duplicate calls
  const fetchedForApplicantId = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Set mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch applicant data
  useEffect(() => {
    const fetchApplicantDetail = async () => {
      if (!applicantId || !user?.agencyId) return;

      // Skip if already fetched for this applicantId
      if (fetchedForApplicantId.current === applicantId) return;
      
      // Mark as fetching for this applicantId
      fetchedForApplicantId.current = applicantId;

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
          
          // Merge with existing applicant data (applications, etc.)
          setApplicant((prev) => ({
            ...prev,
            ...transformedData,
            applications: prev?.applications || [],
          } as ApplicantDetail));

          // Set notes from fetched data
          const fetchedNotes = response.data.personalDetails?.notes || "";
          setNotes(fetchedNotes);
          setOriginalNotes(fetchedNotes);
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
    }
  }, [applicantId, user?.agencyId, dispatch]);

  // Get applications for table (no need for useMemo - just direct access)
  const filteredApplications = applicant?.applications || [];

  // Check if notes have changed
  const hasNotesChanged = useMemo(() => {
    return notes !== originalNotes;
  }, [notes, originalNotes]);

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

  // Handle notes change
  const handleNotesChange = useCallback((newNotes: string) => {
    setNotes(newNotes);
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
    if (!selectedApplication || !applicant || !newApplicationStatus) return;

    setIsChangingApplicationStatus(true);

    try {
      // TODO: Replace with actual API call
      // const response = await updateApplicationStatus(selectedApplication.id, {
      //   status: newApplicationStatus,
      //   notes: applicationNotes,
      //   notifyStudent,
      // });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the label for the status value
      const statusLabel = applicationStatusOptions.find(
        (opt) => opt.value === newApplicationStatus
      )?.label || newApplicationStatus;

      // Update the application in the state
      setApplicant((prevApplicant) =>
        prevApplicant
          ? {
              ...prevApplicant,
              applications: prevApplicant.applications.map((app) =>
                app.id === selectedApplication.id
                  ? { 
                      ...app, 
                      status: statusLabel, 
                      lastUpdated: formatDate(new Date())
                    }
                  : app
              ),
            }
          : null
      );

      setIsApplicationStatusPopupOpen(false);
      setSelectedApplication(null);
      setNewApplicationStatus("");
      setApplicationNotes("");
      setNotifyStudent(true);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error changing application status:", error);
      }
      // TODO: Show error toast notification
    } finally {
      setIsChangingApplicationStatus(false);
    }
  }, [selectedApplication, applicant, newApplicationStatus, applicationNotes, notifyStudent]);

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
    if (!applicationToApply || !applicant) return;

    setIsApplying(true);

    try {
      const currentDate = formatDate(new Date());
      const newStatus = "Application Submitted";

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/applications/${applicationToApply.id}/apply`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     status: newStatus,
      //     appliedDate: currentDate,
      //   }),
      // });
      // if (!response.ok) throw new Error("Failed to apply");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the application in the state
      setApplicant((prevApplicant) =>
        prevApplicant
          ? {
              ...prevApplicant,
              applications: prevApplicant.applications.map((app) =>
                app.id === applicationToApply.id
                  ? {
                      ...app,
                      status: newStatus,
                      appliedDate: currentDate,
                      lastUpdated: currentDate,
                    }
                  : app
              ),
            }
          : null
      );

      setIsApplyConfirmationOpen(false);
      setApplicationToApply(null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error applying for application:", error);
      }
      // TODO: Show error toast notification
    } finally {
      setIsApplying(false);
    }
  }, [applicationToApply, applicant]);

  // Handle cancel apply
  const handleCancelApply = useCallback(() => {
    setIsApplyConfirmationOpen(false);
    setApplicationToApply(null);
  }, []);


  // Handle save notes
  const handleSaveNotes = useCallback(async () => {
    if (!applicantId) return;

    setIsSavingNotes(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/applicants/${applicantId}/notes`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ notes }),
      // });
      // if (!response.ok) throw new Error("Failed to save notes");
      // const data = await response.json();
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Update applicant state with new notes
      setApplicant((prevApplicant) =>
        prevApplicant
          ? { ...prevApplicant, notes }
          : null
      );
      
      // Update original notes after successful save
      setOriginalNotes(notes);
      
          // TODO: Show success toast notification
          if (import.meta.env.DEV) {
            console.log("Notes saved successfully:", notes);
          }
    } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error saving notes:", error);
        }
      // TODO: Show error toast notification
    } finally {
      setIsSavingNotes(false);
    }
  }, [applicantId, notes]);

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
      if (import.meta.env.DEV) {
        console.error("Error changing status:", error);
      }
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
          onUpdateStatus={handleUpdateApplicationStatus}
          onApply={handleApplyClick}
          onViewStatusHistory={handleViewStatusHistory}
        />

        {/* Card Sections */}
        <ApplicantCards applicant={displayApplicant} />

        {/* Notes Section */}
        <NotesSection
          notes={notes}
          isSaving={isSavingNotes}
          hasChanges={hasNotesChanged}
          onNotesChange={handleNotesChange}
          onSaveNotes={handleSaveNotes}
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

