import { useState, useMemo, useEffect, useCallback, startTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { Layout, Button, StatusChangePopup, ConfirmationPopup } from "../../../components";
import { COLORS, ROUTES, applicationStatusOptions } from "../../../constants";
import { ArrowLeft } from "../../../assets";
import { formatDate, toSlug, handleApiError } from "../../../utils";
import type { ApplicantDetail, UniversityApplication, ApplicationStatusHistory } from "./types";
import { mockApplicantDetail } from "../../../constants";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import ApplicantHeader from "./ApplicantHeader";
import UniversityApplicationTable from "./UniversityApplicationTable";
import ApplicantCards from "./ApplicantCards";
import NotesSection from "./NotesSection";
import ApplicationStatusPopup from "./ApplicationStatusPopup";
import ApplicationStatusHistoryPopup from "./ApplicationStatusHistoryPopup";

const ApplicantDetailView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { applicantId } = useParams<{ applicantId: string }>();

  // State
  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [notes, setNotes] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");
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

  // Fetch applicant data
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchApplicantDetail = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/applicants/${applicantId}`, {
        //   signal: abortController.signal,
        // });
        // if (!response.ok) throw new Error("Failed to fetch applicant");
        // const data = await response.json();
        
        // Mock data for now
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Check if component is still mounted before updating state
        if (!isMounted || abortController.signal.aborted) return;
        
        setApplicant(mockApplicantDetail);
        // Set notes from fetched data (will come from API in production)
        const fetchedNotes = mockApplicantDetail.notes || "";
        setNotes(fetchedNotes);
        setOriginalNotes(fetchedNotes); // Store original notes for comparison
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return; // Ignore abort errors
        }
        if (import.meta.env.DEV) {
          console.error("Error fetching applicant detail:", error);
        }
        // TODO: Show error toast notification
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (applicantId) {
      fetchApplicantDetail();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [applicantId]);

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
    if (!applicant) return;

    setIsChangingStatus(true);
    const newStatus = applicant.status === "Active" ? "Inactive" : "Active";

    try {
      // TODO: Replace with actual API call
      // const response = await updateApplicantStatus(applicant.id, newStatus);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the applicant in the state
      setApplicant((prevApplicant) =>
        prevApplicant
          ? { ...prevApplicant, status: newStatus as "Active" | "Inactive" }
          : null
      );

      // TODO: After API call, refetch the applicant detail to get updated data
      // await fetchApplicantDetail();

      setIsStatusPopupOpen(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error changing status:", error);
      }
      // TODO: Show error toast notification
    } finally {
      setIsChangingStatus(false);
    }
  }, [applicant]);

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p style={{ color: COLORS.textMuted }}>{t("common.loading", "Loading...")}</p>
        </div>
      </Layout>
    );
  }

  if (!applicant) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p style={{ color: COLORS.textMuted }}>
            {t("applicantDetailView.notFound", "Applicant not found")}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Back Button */}
        <Button
          variant="accent"
          size="sm"
          rounded
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={handleBack}
          className="mb-4"
        />

        {/* Applicant Header */}
        <ApplicantHeader
          applicant={applicant}
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
        <ApplicantCards applicant={applicant} />

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
          item={applicant}
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

