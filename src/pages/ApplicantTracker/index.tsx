import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import {
  Layout,
  Button,
  SearchBar,
  DataTable,
  Popup,
  Select,
  Checkbox,
  ConfirmationPopup,
} from "../../components";
import { COLORS, ROUTES, applicantStatusOptions, typography, mockApplicants, type Applicant } from "../../constants";
import { Plus, Calendar, Edit } from "../../assets";
import { formatDateValue,toSlug, normalizeDateToStartOfDay, normalizeDateToEndOfDay } from "../../utils";
import ApplicantTrackerFilters from "./ApplicantTrackerFilters";
import ApplicationStatusHistoryPopup from "./ApplicantDetail/ApplicationStatusHistoryPopup";
import type { ApplicationStatusHistory } from "./ApplicantDetail/types";

const ApplicantTracker = () => {
  const { t } = useTranslation();

  // Applicants state - will be updated from API
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Temporary filter states (for UI selection)
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedApplicantStages, setSelectedApplicantStages] = useState<string[]>([]);
  const [selectedIntake, setSelectedIntake] = useState("");
  const [selectedAgencyPartner, setSelectedAgencyPartner] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState<Date | null>(null);
  const [appliedToDate, setAppliedToDate] = useState<Date | null>(null);
  const [lastUpdatedFromDate, setLastUpdatedFromDate] = useState<Date | null>(null);
  const [lastUpdatedToDate, setLastUpdatedToDate] = useState<Date | null>(null);

  // Applied filter states (used for API calls and filtering)
  const [appliedAdmin, setAppliedAdmin] = useState("");
  const [appliedManager, setAppliedManager] = useState("");
  const [appliedCounselor, setAppliedCounselor] = useState("");
  const [appliedUniversity, setAppliedUniversity] = useState("");
  const [appliedCourse, setAppliedCourse] = useState("");
  const [appliedApplicantStages, setAppliedApplicantStages] = useState<string[]>([]);
  const [appliedIntake, setAppliedIntake] = useState("");
  const [appliedAgencyPartner, setAppliedAgencyPartner] = useState("");
  const [appliedAppliedFromDate, setAppliedAppliedFromDate] = useState<Date | null>(null);
  const [appliedAppliedToDate, setAppliedAppliedToDate] = useState<Date | null>(null);
  const [appliedLastUpdatedFromDate, setAppliedLastUpdatedFromDate] = useState<Date | null>(null);
  const [appliedLastUpdatedToDate, setAppliedLastUpdatedToDate] = useState<Date | null>(null);

  // Pagination state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Total count will be calculated from filteredApplicants
  // TODO: Replace with actual API call - this should come from API response

  // Application status change popup state (reusing from University Application Summary)
  const [isApplicationStatusPopupOpen, setIsApplicationStatusPopupOpen] = useState(false);
  const [isChangingApplicationStatus, setIsChangingApplicationStatus] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [newApplicationStatus, setNewApplicationStatus] = useState("");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [notifyStudent, setNotifyStudent] = useState(true);

  // Status history popup state (reusing from University Application Summary)
  const [isStatusHistoryPopupOpen, setIsStatusHistoryPopupOpen] = useState(false);
  const [selectedApplicantForHistory, setSelectedApplicantForHistory] = useState<Applicant | null>(null);
  const [statusHistory, setStatusHistory] = useState<ApplicationStatusHistory[]>([]);

  // Apply functionality state
  const [isApplyConfirmationOpen, setIsApplyConfirmationOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicantToApply, setApplicantToApply] = useState<Applicant | null>(null);

  // Memoize normalized dates to prevent recreation on every filter
  const normalizedAppliedFromDate = useMemo(
    () => normalizeDateToStartOfDay(appliedAppliedFromDate),
    [appliedAppliedFromDate]
  );

  const normalizedAppliedToDate = useMemo(
    () => normalizeDateToEndOfDay(appliedAppliedToDate),
    [appliedAppliedToDate]
  );

  const normalizedLastUpdatedFromDate = useMemo(
    () => normalizeDateToStartOfDay(appliedLastUpdatedFromDate),
    [appliedLastUpdatedFromDate]
  );

  const normalizedLastUpdatedToDate = useMemo(
    () => normalizeDateToEndOfDay(appliedLastUpdatedToDate),
    [appliedLastUpdatedToDate]
  );

  // Memoize search query lowercase transformation
  const searchLower = useMemo(() => searchQuery.toLowerCase(), [searchQuery]);

  // Filter applicants based on search and applied filters
  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      // Search filter
      if (searchQuery) {
        const matchesSearch =
          applicant.applicantId.toLowerCase().includes(searchLower) ||
          applicant.applicantName.toLowerCase().includes(searchLower) ||
          applicant.contactNo.toLowerCase().includes(searchLower) ||
          applicant.course.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Admin filter
      if (appliedAdmin && applicant.adminId !== appliedAdmin) return false;

      // Manager filter
      if (appliedManager && applicant.managerId !== appliedManager) return false;

      // Counselor filter
      if (appliedCounselor && applicant.counselorId !== appliedCounselor) return false;

      // University filter
      if (appliedUniversity && applicant.university !== appliedUniversity) return false;

      // Course filter
      if (appliedCourse) {
        // Map course values from mock data to course option values
        // Mock data has "Master - Computers", "Bachelor - Engineering", "Master - Business"
        // Course options have "computer-science", "engineering", "business-administration", etc.
        const courseMapping: Record<string, string> = {
          "Master - Computers": "computer-science",
          "Bachelor - Engineering": "engineering",
          "Master - Business": "business-administration",
        };
        const mappedCourse = courseMapping[applicant.course] || applicant.course.toLowerCase().replace(/\s+/g, "-").replace(/-/g, "-");
        if (mappedCourse !== appliedCourse) return false;
      }

      // Applicant Stage filter
      if (appliedApplicantStages.length > 0) {
        const applicantStageKey = toSlug(applicant.applicantStage);
        if (!appliedApplicantStages.includes(applicantStageKey)) {
          return false;
        }
      }

      // Intake filter
      if (appliedIntake && applicant.intake !== appliedIntake) return false;

      // Agency Partner filter
      if (appliedAgencyPartner && applicant.agencyPartner !== appliedAgencyPartner) {
        return false;
      }

      // Applied Date filters - filter by appliedDate
      if (normalizedAppliedFromDate || normalizedAppliedToDate) {
        if (!applicant.appliedDate) return false;
        
        // Normalize applicant date to start of day for comparison
        const applicantDate = new Date(applicant.appliedDate);
        applicantDate.setHours(0, 0, 0, 0);
        
        if (normalizedAppliedFromDate && applicantDate < normalizedAppliedFromDate) return false;
        if (normalizedAppliedToDate && applicantDate > normalizedAppliedToDate) return false;
      }

      // Last Updated Date filters - filter by lastUpdatedDate
      if (normalizedLastUpdatedFromDate || normalizedLastUpdatedToDate) {
        if (!applicant.lastUpdatedDate) return false;
        
        // Normalize applicant date to start of day for comparison
        const applicantDate = new Date(applicant.lastUpdatedDate);
        applicantDate.setHours(0, 0, 0, 0);
        
        if (normalizedLastUpdatedFromDate && applicantDate < normalizedLastUpdatedFromDate) return false;
        if (normalizedLastUpdatedToDate && applicantDate > normalizedLastUpdatedToDate) return false;
      }

      return true;
    });
  }, [
    searchQuery,
    searchLower,
    normalizedAppliedFromDate,
    normalizedAppliedToDate,
    normalizedLastUpdatedFromDate,
    normalizedLastUpdatedToDate,
    appliedAdmin,
    appliedManager,
    appliedCounselor,
    appliedUniversity,
    appliedCourse,
    appliedApplicantStages,
    appliedIntake,
    appliedAgencyPartner,
    applicants,
  ]);

  // Total count - calculated from filtered applicants
  // TODO: In real implementation, totalCount should come from API response
  const totalCount = useMemo(() => filteredApplicants.length, [filteredApplicants.length]);

  // Handle apply filters - triggers API call
  const handleApplyFilters = useCallback(() => {
    // Apply the selected filters
    setAppliedAdmin(selectedAdmin);
    setAppliedManager(selectedManager);
    setAppliedCounselor(selectedCounselor);
    setAppliedUniversity(selectedUniversity);
    setAppliedCourse(selectedCourse);
    setAppliedApplicantStages(selectedApplicantStages);
    setAppliedIntake(selectedIntake);
    setAppliedAgencyPartner(selectedAgencyPartner);
    setAppliedAppliedFromDate(appliedFromDate);
    setAppliedAppliedToDate(appliedToDate);
    setAppliedLastUpdatedFromDate(lastUpdatedFromDate);
    setAppliedLastUpdatedToDate(lastUpdatedToDate);
    
    // Reset pagination to first page
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });

    // TODO: Make API call here with applied filters
    // Example:
    // fetchApplicants({
    //   admin: appliedAdmin,
    //   manager: appliedManager,
    //   counselor: appliedCounselor,
    //   applicantStages: appliedApplicantStages,
    //   intake: appliedIntake,
    //   agencyPartner: appliedAgencyPartner,
    //   appliedFromDate: appliedAppliedFromDate,
    //   appliedToDate: appliedAppliedToDate,
    //   lastUpdatedFromDate: appliedLastUpdatedFromDate,
    //   lastUpdatedToDate: appliedLastUpdatedToDate,
    //   page: 0,
    //   pageSize: paginationModel.pageSize,
    // }).then(response => {
    //   setTotalCount(response.totalCount);
    //   // Update applicants data
    // });
  }, [selectedAdmin, selectedManager, selectedCounselor, selectedUniversity, selectedCourse, selectedApplicantStages, selectedIntake, selectedAgencyPartner, appliedFromDate, appliedToDate, lastUpdatedFromDate, lastUpdatedToDate, paginationModel.pageSize]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    // Clear selected filters
    setSelectedAdmin("");
    setSelectedManager("");
    setSelectedCounselor("");
    setSelectedUniversity("");
    setSelectedCourse("");
    setSelectedApplicantStages([]);
    setSelectedIntake("");
    setSelectedAgencyPartner("");
    setAppliedFromDate(null);
    setAppliedToDate(null);
    setLastUpdatedFromDate(null);
    setLastUpdatedToDate(null);

    // Clear applied filters
    setAppliedAdmin("");
    setAppliedManager("");
    setAppliedCounselor("");
    setAppliedUniversity("");
    setAppliedCourse("");
    setAppliedApplicantStages([]);
    setAppliedIntake("");
    setAppliedAgencyPartner("");
    setAppliedAppliedFromDate(null);
    setAppliedAppliedToDate(null);
    setAppliedLastUpdatedFromDate(null);
    setAppliedLastUpdatedToDate(null);

    // Reset pagination
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });

    // TODO: Make API call to fetch all applicants
    // fetchApplicants({ page: 0, pageSize: paginationModel.pageSize })
    //   .then(response => {
    //     setTotalCount(response.totalCount);
    //   });
  }, [paginationModel.pageSize]);

  // Handle search with debounce (SearchBar handles this internally)
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPaginationModel((prev) => ({ page: 0, pageSize: prev.pageSize }));
  }, []);


  // Handle update status (reusing from University Application Summary)
  const handleUpdateStatus = useCallback((applicant: Applicant) => {
    setSelectedApplicant(applicant);
    // Map the applicant status to the constant value format
    const statusValue = applicantStatusOptions.find(
      (opt) => opt.label === applicant.status || 
               opt.label.toLowerCase() === applicant.status?.toLowerCase()
    )?.value || applicant.status?.toLowerCase() || "active";
    setNewApplicationStatus(statusValue);
    setApplicationNotes("");
    setNotifyStudent(true);
    setIsApplicationStatusPopupOpen(true);
  }, []);

  // Handle confirm application status change (reusing from University Application Summary)
  const handleConfirmApplicationStatusChange = useCallback(async () => {
    if (!selectedApplicant || !newApplicationStatus) return;

    setIsChangingApplicationStatus(true);

    try {
      // TODO: Replace with actual API call
      // const response = await updateApplicantStatus(selectedApplicant.id, {
      //   status: newApplicationStatus,
      //   notes: applicationNotes,
      //   notifyStudent,
      // });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the label for the status value
      const statusLabel = applicantStatusOptions.find(
        (opt) => opt.value === newApplicationStatus
      )?.label || newApplicationStatus;

      // Update the applicant in the state
      setApplicants((prevApplicants) =>
        prevApplicants.map((app) =>
          app.id === selectedApplicant.id
            ? { 
                ...app, 
                status: statusLabel as "Active" | "Inactive",
                lastUpdatedDate: new Date(),
              }
            : app
        )
      );

      setIsApplicationStatusPopupOpen(false);
      setSelectedApplicant(null);
      setNewApplicationStatus("");
      setApplicationNotes("");
      setNotifyStudent(true);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error changing applicant status:", error);
      }
      // TODO: Show error toast notification
    } finally {
      setIsChangingApplicationStatus(false);
    }
  }, [selectedApplicant, newApplicationStatus, applicationNotes, notifyStudent]);

  // Handle cancel application status change
  const handleCancelApplicationStatusChange = useCallback(() => {
    setIsApplicationStatusPopupOpen(false);
    setSelectedApplicant(null);
    setNewApplicationStatus("");
    setApplicationNotes("");
    setNotifyStudent(true);
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

  // Handle view status history (reusing from University Application Summary)
  const handleViewStatusHistory = useCallback(async (applicant: Applicant) => {
    setSelectedApplicantForHistory(applicant);
    setIsStatusHistoryPopupOpen(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/applicants/${applicant.id}/status-history`);
      // if (!response.ok) throw new Error("Failed to fetch status history");
      // const data = await response.json();
      // setStatusHistory(data.history || []);

      // Mock status history data for now
      const mockHistory: ApplicationStatusHistory[] = [
        {
          id: "1",
          statusName: applicant.status || "Active",
          notes: `Status changed to ${applicant.status || "Active"}`,
          time: applicant.lastUpdatedDate ? new Date(applicant.lastUpdatedDate).toISOString() : new Date().toISOString(),
        },
        {
          id: "2",
          statusName: applicant.status === "Active" ? "Inactive" : "Active",
          notes: `Previous status: ${applicant.status === "Active" ? "Inactive" : "Active"}`,
          time: applicant.createdAt ? new Date(applicant.createdAt).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStatusHistory(mockHistory);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching status history:", error);
      }
      setStatusHistory([]);
    }
  }, []);

  // Handle close status history
  const handleCloseStatusHistory = useCallback(() => {
    setIsStatusHistoryPopupOpen(false);
    setSelectedApplicantForHistory(null);
    setStatusHistory([]);
  }, []);

  // Handle apply click
  const handleApplyClick = useCallback((applicant: Applicant) => {
    setApplicantToApply(applicant);
    setIsApplyConfirmationOpen(true);
  }, []);

  // Handle confirm apply - update status to Application Submitted
  const handleConfirmApply = useCallback(async () => {
    if (!applicantToApply) return;

    setIsApplying(true);

    try {
      const currentDate = new Date();
      const newStatus = "Application Submitted";

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/applicants/${applicantToApply.id}/apply`, {
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

      // Update the applicant in the state
      setApplicants((prevApplicants) =>
        prevApplicants.map((app) =>
          app.id === applicantToApply.id
            ? {
                ...app,
                applicantStatus: newStatus,
                applicantStage: "Application Submitted",
                appliedDate: currentDate,
                lastUpdatedDate: currentDate,
              }
            : app
        )
      );

      setIsApplyConfirmationOpen(false);
      setApplicantToApply(null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error applying for application:", error);
      }
      // TODO: Show error toast notification
    } finally {
      setIsApplying(false);
    }
  }, [applicantToApply]);

  // Handle cancel apply
  const handleCancelApply = useCallback(() => {
    setIsApplyConfirmationOpen(false);
    setApplicantToApply(null);
  }, []);

  // Memoize renderCell functions to prevent recreation
  const renderApplicantNameCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
        {params.row.applicantName}
      </span>
      <span className="text-xs" style={{ color: COLORS.textMuted }}>
        {params.row.contactNo}
      </span>
    </div>
  ), []);

  const renderAppliedDateCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <span className="text-sm" style={{ color: COLORS.textDark }}>
      {params.row.appliedDate ? formatDateValue(params.row.appliedDate) : "-"}
    </span>
  ), []);

  const renderLastUpdatedDateCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <span className="text-sm" style={{ color: COLORS.textDark }}>
      {params.row.lastUpdatedDate ? formatDateValue(params.row.lastUpdatedDate) : "-"}
    </span>
  ), []);

  const renderIntakeYearCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    if (!params.row.intake) return "-";
    // Format intake like "jan-2026" to "Jan 2026" or just "2026"
    const intakeParts = params.row.intake.split("-");
    if (intakeParts.length === 2) {
      const month = intakeParts[0].charAt(0).toUpperCase() + intakeParts[0].slice(1);
      const year = intakeParts[1];
      return `${month} ${year}`;
    }
    return params.row.intake;
  }, []);

  // Render status cell similar to University Application Summary
  const renderStatusCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const status = params.value?.toLowerCase() || "";
    const isOfferReceived = status === "offer received";
    const isApply = status === "apply";
    
    if (isApply) {
      return (
        <Button
          variant="ghost"
          size="sm"
          rounded
          onClick={(e) => {
            e.stopPropagation();
            handleApplyClick(params.row);
          }}
          style={{
            backgroundColor: `${COLORS.textMuted}20`,
            color: COLORS.textMuted,
            cursor: "pointer",
          }}
        >
          {params.value}
        </Button>
      );
    }
    
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: isOfferReceived 
            ? `${COLORS.success}20` 
            : `${COLORS.accent}20`,
          color: isOfferReceived 
            ? COLORS.success 
            : COLORS.accent,
        }}
      >
        {params.value}
      </span>
    );
  }, []);

  // Render stage cell similar to status cell
  const renderStageCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const stage = params.value?.toLowerCase() || "";
    const isOfferReceived = stage === "offer received";
    
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: isOfferReceived 
            ? `${COLORS.success}20` 
            : `${COLORS.accent}20`,
          color: isOfferReceived 
            ? COLORS.success 
            : COLORS.accent,
        }}
      >
        {params.value}
      </span>
    );
  }, []);

  const renderActionsCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <div className="flex items-center gap-2">
      <Tooltip title={t("applicantDetailView.applicationStatusHistory", "Application Status History")} arrow>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewStatusHistory(params.row);
          }}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{ color: COLORS.accent }}
          aria-label={t("applicantDetailView.applicationStatusHistory", "Application Status History")}
        >
          <Calendar className="w-5 h-5" />
        </button>
      </Tooltip>
      <Tooltip title={t("applicantDetailView.updateApplicationStatus", "Update Application Status")} arrow>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateStatus(params.row);
          }}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{ color: COLORS.accent }}
          aria-label={t("applicantDetailView.updateApplicationStatus", "Update Application Status")}
        >
          <Edit className="w-5 h-5" />
        </button>
      </Tooltip>
    </div>
  ), [t, handleViewStatusHistory, handleUpdateStatus]);

  // Table columns - memoized to prevent recreation
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "applicantId",
      headerName: t("applicantTracker.applicantId", "Applicant Id"),
      flex: 0.8,
      minWidth: 100,
      sortable: true,
    },
    {
      field: "applicantName",
      headerName: t("applicantTracker.applicantName", "Applicant Name"),
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      renderCell: renderApplicantNameCell,
    },
    {
      field: "university",
      headerName: t("applicantTracker.university", "University"),
      flex: 1.3,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "course",
      headerName: t("applicantTracker.course", "Course"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "applicantStage",
      headerName: t("applicantTracker.applicationStage", "Application Stage"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderStageCell,
    },
    {
      field: "applicantStatus",
      headerName: t("applicantTracker.applicationStatus", "Application Status"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderStatusCell,
    },
    {
      field: "intakeYear",
      headerName: t("applicantTracker.intakeYear", "Intake Year"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderIntakeYearCell,
    },
    {
      field: "appliedDate",
      headerName: t("applicantTracker.appliedDate", "Applied Date"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderAppliedDateCell,
    },
    {
      field: "lastUpdatedDate",
      headerName: t("applicantTracker.lastUpdatedDate", "Last Updated Date"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderLastUpdatedDateCell,
    },
    {
      field: "actions",
      headerName: t("applicantTracker.action", "Action"),
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: renderActionsCell,
    },
  ], [t, renderApplicantNameCell, renderAppliedDateCell, renderLastUpdatedDateCell, renderIntakeYearCell, renderStageCell, renderStatusCell, renderActionsCell, handleApplyClick]);

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("applicantTracker.title", "Applicant Tracker")} ({totalCount})
          </h1>
          <div className="flex items-center gap-4">
            <div className="w-full md:w-72">
              <SearchBar
                onSearch={handleSearch}
                placeholder={t("applicantTracker.searchPlaceholder", "Search Applications...")}
                tooltip={t("applicantTracker.searchPlaceholder", "Search Applications...")}
              />
            </div>
            <Link to={ROUTES.CREATE_APPLICANT}>
              <Button variant="accent" leftIcon={<Plus className="w-5 h-5" />} rounded>
                {t("applicantTracker.addApplicant", "Add Applicant")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Row */}
        <ApplicantTrackerFilters
          selectedAdmin={selectedAdmin}
          selectedManager={selectedManager}
          selectedCounselor={selectedCounselor}
          selectedUniversity={selectedUniversity}
          selectedCourse={selectedCourse}
          selectedApplicantStages={selectedApplicantStages}
          selectedIntake={selectedIntake}
          selectedAgencyPartner={selectedAgencyPartner}
          appliedFromDate={appliedFromDate}
          appliedToDate={appliedToDate}
          lastUpdatedFromDate={lastUpdatedFromDate}
          lastUpdatedToDate={lastUpdatedToDate}
          onAdminChange={setSelectedAdmin}
          onManagerChange={setSelectedManager}
          onCounselorChange={setSelectedCounselor}
          onUniversityChange={setSelectedUniversity}
          onCourseChange={setSelectedCourse}
          onApplicantStagesChange={setSelectedApplicantStages}
          onIntakeChange={setSelectedIntake}
          onAgencyPartnerChange={setSelectedAgencyPartner}
          onAppliedFromDateChange={setAppliedFromDate}
          onAppliedToDateChange={setAppliedToDate}
          onLastUpdatedFromDateChange={setLastUpdatedFromDate}
          onLastUpdatedToDateChange={setLastUpdatedToDate}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />

        {/* DataTable */}
        <DataTable
          rows={filteredApplicants}
          columns={columns}
          pageSize={paginationModel.pageSize}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="client"
          sortingMode="client"
        />

        {/* Application Status Change Popup (reusing from University Application Summary) */}
        <Popup
          isOpen={isApplicationStatusPopupOpen}
          onClose={handleCancelApplicationStatusChange}
          title={t("applicantDetailView.updateApplicationStatus", "Update Application Status")}
          size="md"
          closeOnOverlayClick={!isChangingApplicationStatus}
          closeOnEscape={!isChangingApplicationStatus}
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="cancel"
                size="sm"
                onClick={handleCancelApplicationStatusChange}
                disabled={isChangingApplicationStatus}
                rounded
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleConfirmApplicationStatusChange}
                isLoading={isChangingApplicationStatus}
                rounded
              >
                {t("applicantDetailView.updateStatus", "Update Status")}
              </Button>
            </div>
          }
        >
          <div className="py-2">
            {selectedApplicant && (
              <div className="space-y-4">
                {/* Current Status Dropdown */}
                <div>
                  <Select
                    label={t("applicantDetailView.currentStatus", "Current Status")}
                    options={applicantStatusOptions}
                    value={newApplicationStatus}
                    onChange={handleApplicationStatusChange}
                    placeholder={t("applicantDetailView.selectStatus", "Select Status")}
                    fullWidth
                    searchable
                    searchPlaceholder={t("applicantDetailView.searchStatus", "Search Status...")}
                  />
                </div>

                {/* Notes Textarea */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: COLORS.textDark }}
                  >
                    {t("applicantTracker.notes", "Notes")}
                  </label>
                  <textarea
                    value={applicationNotes}
                    onChange={(e) => handleApplicationNotesChange(e.target.value)}
                    placeholder={t("applicantDetailView.addNotesPlaceholder", "Add any additional notes or comments")}
                    className="w-full px-4 py-3 rounded-lg resize-none"
                    rows={4}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.textDark,
                      backgroundColor: COLORS.surface,
                      fontSize: typography.fontSize.small,
                    }}
                  />
                </div>

                {/* Notify Student Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={notifyStudent}
                    onChange={handleNotifyStudentChange}
                  />
                  <label
                    className="text-sm cursor-pointer"
                    style={{ color: COLORS.textDark }}
                    onClick={() => handleNotifyStudentChange(!notifyStudent)}
                  >
                    {t("applicantDetailView.sendEmailNotification", "Send email notification to student")}
                  </label>
                </div>
              </div>
            )}
          </div>
        </Popup>

        {/* Application Status History Popup (reusing from University Application Summary) */}
        <ApplicationStatusHistoryPopup
          isOpen={isStatusHistoryPopupOpen}
          applicationId={selectedApplicantForHistory?.id || null}
          universityName={selectedApplicantForHistory?.applicantName || ""}
          statusHistory={statusHistory}
          onClose={handleCloseStatusHistory}
        />

        {/* Apply Confirmation Popup */}
        <ConfirmationPopup
          isOpen={isApplyConfirmationOpen}
          title={t("applicantDetailView.confirmApply", "Confirm Application")}
          isLoading={isApplying}
          onClose={handleCancelApply}
          onConfirm={handleConfirmApply}
        >
          {applicantToApply && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {t(
                  "applicantDetailView.confirmApplyMessage",
                  "Are you sure you want to apply for {{university}}? This will set the status to 'Application Submitted' and set the applied date to today.",
                  {
                    university: applicantToApply.university || applicantToApply.applicantName,
                  }
                )}
              </p>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium" style={{ color: COLORS.textDark }}>
                    {t("applicantTracker.applicantName", "Applicant Name")}:{" "}
                  </span>
                  <span style={{ color: COLORS.textMuted }}>
                    {applicantToApply.applicantName}
                  </span>
                </div>
                {applicantToApply.university && (
                  <div>
                    <span className="font-medium" style={{ color: COLORS.textDark }}>
                      {t("applicantTracker.university", "University")}:{" "}
                    </span>
                    <span style={{ color: COLORS.textMuted }}>
                      {applicantToApply.university}
                    </span>
                  </div>
                )}
                {applicantToApply.course && (
                  <div>
                    <span className="font-medium" style={{ color: COLORS.textDark }}>
                      {t("applicantTracker.course", "Course")}:{" "}
                    </span>
                    <span style={{ color: COLORS.textMuted }}>
                      {applicantToApply.course}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </ConfirmationPopup>
      </div>
    </Layout>
  );
};

export default ApplicantTracker;
