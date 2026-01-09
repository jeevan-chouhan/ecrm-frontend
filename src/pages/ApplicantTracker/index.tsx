import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
import { COLORS, applicationStatusOptions, typography, type Applicant } from "../../constants";
import { Calendar, Edit } from "../../assets";
import { formatDateValue, handleApiError } from "../../utils";
import ApplicantTrackerFilters from "./ApplicantTrackerFilters";
import ApplicationStatusHistoryPopup from "./ApplicantDetail/ApplicationStatusHistoryPopup";
import type { ApplicationStatusHistory } from "./ApplicantDetail/types";
import { applicantService, userService } from "../../services";
import type { ApplicationListItem, AdminItem, ManagerItem, CounselorItem, UniversityItem } from "../../services";
import type { SelectOption } from "../../components";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";

const ApplicantTracker = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Get user from Redux (decoded from token)
  const { user } = useAppSelector((state) => state.auth);

  // Applicants state - will be updated from API
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Total count from API
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state - must be declared before fetchApplications
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Applied filter states (used for API calls and filtering) - must be declared before fetchApplications
  const [appliedAdmin, setAppliedAdmin] = useState("");
  const [appliedManager, setAppliedManager] = useState("");
  const [appliedCounselor, setAppliedCounselor] = useState("");

  // Filter options from API
  const [adminOptions, setAdminOptions] = useState<SelectOption[]>([]);
  const [managerOptions, setManagerOptions] = useState<SelectOption[]>([]);
  const [counselorOptions, setCounselorOptions] = useState<SelectOption[]>([]);
  const [universityOptions, setUniversityOptions] = useState<SelectOption[]>([]);
  

  // Loading state
  const isLoadingRef = useRef(false);
  const userRef = useRef(user);
  const hasFetchedFilterOptionsRef = useRef(false);
  const isLoadingFilterOptionsRef = useRef(false);
  
  // Update userRef when user changes
  userRef.current = user;

  /**
   * Map API response to Applicant type
   */
  const mapApplicationListItemToApplicant = useCallback((item: ApplicationListItem): Applicant => {
    return {
      id: item.preferenceId.toString(),
      applicantId: item.applicantId.toString(),
      applicantName: item.applicantName,
      contactNo: item.contactNumber,
      university: item.universityName,
      course: item.course,
      applicantStage: item.applicantStage,
      applicantStatus: item.applicantStatus,
      appliedDate: item.appliedDate ? new Date(item.appliedDate) : undefined,
      lastUpdatedDate: item.updatedAt ? new Date(item.updatedAt) : undefined,
      intake: item.desiredIntake,
    };
  }, []);

  /**
   * Fetch applications from API
   */
  const fetchApplications = useCallback(async () => {
    const currentUser = userRef.current;
    
    // Don't fetch if user is not loaded yet or already loading
    if (!currentUser || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    dispatch(showLoader());

    try {
      // Get applied filter values (convert to numbers if needed) - these are optional filters
      const assignedAdminIdValue = appliedAdmin ? parseInt(appliedAdmin) : null;
      const assignedManagerIdValue = appliedManager ? parseInt(appliedManager) : null;
      const assignedCounselorIdValue = appliedCounselor ? parseInt(appliedCounselor) : null;

      const response = await applicantService.getApplicationsList({
        agencyId: currentUser.agencyId ?? null,
        assignedAdminId: assignedAdminIdValue,
        assignedManagerId: assignedManagerIdValue,
        assignedCounselorId: assignedCounselorIdValue,
        search: searchQuery || null,
        page: paginationModel.page,
        size: paginationModel.pageSize,
        sortBy: null, // TODO: Add sorting support
        asc: null,
      });

      if (response.status === "success" && response.data) {
        // Map API response to Applicant type
        const mappedApplicants = response.data.content.map(mapApplicationListItemToApplicant);
        setApplicants(mappedApplicants);
        setTotalCount(response.data.totalElements);
      } else {
        dispatch(addToast({ 
          type: "error", 
          message: response.message || "Failed to fetch applications" 
        }));
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch applications");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isLoadingRef.current = false;
      dispatch(hideLoader());
    }
  }, [
    dispatch, 
    searchQuery, 
    paginationModel.page, 
    paginationModel.pageSize, 
    mapApplicationListItemToApplicant,
    appliedAdmin,
    appliedManager,
    appliedCounselor,
  ]);

  // Debounced search effect
  useEffect(() => {
    if (!user) return;
    
    const timer = setTimeout(() => {
      fetchApplications();
    }, 500);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  /**
   * Fetch filter options (admins, managers, counselors, universities) from API
   */
  const fetchFilterOptions = useCallback(async () => {
    if (!user?.agencyId) {
      return;
    }

    // Use ref to prevent multiple simultaneous calls
    if (isLoadingFilterOptionsRef.current) {
      return;
    }

    isLoadingFilterOptionsRef.current = true;
    try {
      
      // Fetch filter options independently so one failure doesn't break the other
      // Use userService.getAdmins() to match the working implementation in AddMember form
      const [adminsResult, universitiesResult] = await Promise.allSettled([
        userService.getAdmins(user.agencyId),
        applicantService.getUniversities(user.agencyId),
      ]);

      // Process admins response
      if (adminsResult.status === 'fulfilled') {
        const adminsResponse = adminsResult.value;
        
        // Handle response formats: [...] or { data: [...] } (matching AddMember form implementation)
        let admins: AdminItem[] = [];
        if (Array.isArray(adminsResponse)) {
          admins = adminsResponse;
        } else if ((adminsResponse as any)?.data) {
          admins = (adminsResponse as any).data;
        }
        
        // Convert to SelectOption format (matching AddMember form implementation)
        const adminOptionsData = admins.map((admin: AdminItem) => ({
          value: admin.id.toString(),
          label: admin.name,
        }));
        
        setAdminOptions(adminOptionsData);
      } else {
        dispatch(addToast({ type: "error", message: "Failed to fetch admins" }));
      }

      // Process universities response
      if (universitiesResult.status === 'fulfilled') {
        const universitiesResponse = universitiesResult.value;
        
        // Handle response formats: [...] or { data: [...] }
        let universities: UniversityItem[] = [];
        if (Array.isArray(universitiesResponse)) {
          universities = universitiesResponse;
        } else if ((universitiesResponse as any)?.data) {
          universities = (universitiesResponse as any).data;
        }
        
        // Convert to SelectOption format
        const universityOptionsData = universities.map((university: UniversityItem) => ({
          value: university.id.toString(),
          label: university.name,
        }));
        
        setUniversityOptions(universityOptionsData);
      } else {
        dispatch(addToast({ type: "error", message: "Failed to fetch universities" }));
      }

      // Counselors will be fetched when manager is selected
      // Keep empty array initially
      setCounselorOptions([]);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch filter options");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isLoadingFilterOptionsRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch filter options when user is loaded (only once)
  useEffect(() => {
    // Only fetch if we have agencyId and haven't fetched yet
    if (user?.agencyId && !hasFetchedFilterOptionsRef.current) {
      hasFetchedFilterOptionsRef.current = true;
      fetchFilterOptions();
    }
    
    // Reset the ref if agencyId changes (user switches agency)
    return () => {
      if (!user?.agencyId) {
        hasFetchedFilterOptionsRef.current = false;
      }
    };
  }, [user?.agencyId, fetchFilterOptions]);

  // Temporary filter states (for UI selection)
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedApplicantStages, setSelectedApplicantStages] = useState<string[]>([]);
  const [selectedIntake, setSelectedIntake] = useState("");
  const [selectedAgencyPartner, setSelectedAgencyPartner] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState<Date | null>(null);
  const [appliedToDate, setAppliedToDate] = useState<Date | null>(null);
  const [lastUpdatedFromDate, setLastUpdatedFromDate] = useState<Date | null>(null);
  const [lastUpdatedToDate, setLastUpdatedToDate] = useState<Date | null>(null);

  // Applied filter states (used for API calls and filtering) - additional filters
  // These are kept for future API integration when backend supports these filters
  const [_appliedUniversity, setAppliedUniversity] = useState("");
  const [_appliedApplicantStages, setAppliedApplicantStages] = useState<string[]>([]);
  const [_appliedIntake, setAppliedIntake] = useState("");
  const [_appliedAgencyPartner, setAppliedAgencyPartner] = useState("");
  const [_appliedAppliedFromDate, setAppliedAppliedFromDate] = useState<Date | null>(null);
  const [_appliedAppliedToDate, setAppliedAppliedToDate] = useState<Date | null>(null);
  const [_appliedLastUpdatedFromDate, setAppliedLastUpdatedFromDate] = useState<Date | null>(null);
  const [_appliedLastUpdatedToDate, setAppliedLastUpdatedToDate] = useState<Date | null>(null);

  // Total count comes from API response

  // Fetch managers when admin is selected
  const fetchManagers = useCallback(async (adminId: string | null) => {
    if (!user?.agencyId || !adminId) {
      // Clear managers if no admin selected
      setManagerOptions([]);
      return;
    }

    try {
      const managersResponse = await applicantService.getManagers(
        user.agencyId,
        adminId
      );

      // Convert managers to SelectOption format
      // API returns array directly: [{id, name, email}, ...]
      const managers = Array.isArray(managersResponse) ? managersResponse : [];
      setManagerOptions(
        managers.map((manager: ManagerItem) => ({
          value: manager.id.toString(),
          label: manager.name,
        }))
      );
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch managers");
      dispatch(addToast({ type: "error", message }));
      setManagerOptions([]);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch counselors when manager is selected
  const fetchCounselors = useCallback(async (managerId: string | null) => {
    if (!user?.agencyId || !managerId) {
      // Clear counselors if no manager selected
      setCounselorOptions([]);
      return;
    }

    try {
      const counselorsResponse = await applicantService.getCounselors(
        user.agencyId,
        managerId
      );

      // Convert counselors to SelectOption format
      // API returns array directly: [{id, name, email}, ...]
      const counselors = Array.isArray(counselorsResponse) ? counselorsResponse : [];
      setCounselorOptions(
        counselors.map((counselor: CounselorItem) => ({
          value: counselor.id.toString(),
          label: counselor.name,
        }))
      );
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch counselors");
      dispatch(addToast({ type: "error", message }));
      setCounselorOptions([]);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch managers when admin is selected
  useEffect(() => {
    if (user?.agencyId && selectedAdmin) {
      // Reset manager and counselor when admin changes
      setSelectedManager("");
      setSelectedCounselor("");
      setCounselorOptions([]);
      fetchManagers(selectedAdmin);
    } else {
      // Clear managers when admin is cleared
      setManagerOptions([]);
      // Also clear selected manager and counselor when admin is cleared
      setSelectedManager("");
      setSelectedCounselor("");
      setCounselorOptions([]);
    }
  }, [selectedAdmin, user?.agencyId, fetchManagers]);

  // Fetch counselors when manager is selected
  useEffect(() => {
    if (user?.agencyId && selectedManager) {
      // Reset counselor when manager changes
      setSelectedCounselor("");
      fetchCounselors(selectedManager);
    } else {
      // Clear counselors when manager is cleared
      setCounselorOptions([]);
      // Also clear selected counselor when manager is cleared
      setSelectedCounselor("");
    }
  }, [selectedManager, user?.agencyId, fetchCounselors]);

  // Initial fetch when user is loaded or when dependencies change
  useEffect(() => {
    if (user) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, paginationModel.page, paginationModel.pageSize, appliedAdmin, appliedManager, appliedCounselor]);

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

  // Normalized dates - kept for future API integration when backend supports date filters
  // These will be computed when needed for API calls

  // Filter applicants - API handles filtering, so we use applicants directly
  // Note: Additional filters (admin, manager, counselor, etc.) can be added to API call when backend supports them

  // Handle apply filters - triggers API call
  const handleApplyFilters = useCallback(() => {
    // Apply the selected filters
    setAppliedAdmin(selectedAdmin);
    setAppliedManager(selectedManager);
    setAppliedCounselor(selectedCounselor);
    setAppliedUniversity(selectedUniversity);
    setAppliedApplicantStages(selectedApplicantStages);
    setAppliedIntake(selectedIntake);
    setAppliedAgencyPartner(selectedAgencyPartner);
    setAppliedAppliedFromDate(appliedFromDate);
    setAppliedAppliedToDate(appliedToDate);
    setAppliedLastUpdatedFromDate(lastUpdatedFromDate);
    setAppliedLastUpdatedToDate(lastUpdatedToDate);
    
    // Reset pagination to first page
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });

    // Trigger API call with applied filters
    // Note: Additional filters can be added to fetchApplications when backend supports them
    fetchApplications();
  }, [selectedAdmin, selectedManager, selectedCounselor, selectedUniversity, selectedApplicantStages, selectedIntake, selectedAgencyPartner, appliedFromDate, appliedToDate, lastUpdatedFromDate, lastUpdatedToDate, paginationModel.pageSize, fetchApplications]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    // Clear selected filters
    setSelectedAdmin("");
    setSelectedManager("");
    setSelectedCounselor("");
    setSelectedUniversity("");
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
    setAppliedApplicantStages([]);
    setAppliedIntake("");
    setAppliedAgencyPartner("");
    setAppliedAppliedFromDate(null);
    setAppliedAppliedToDate(null);
    setAppliedLastUpdatedFromDate(null);
    setAppliedLastUpdatedToDate(null);

    // Reset pagination
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });

    // Trigger API call to fetch all applicants
    fetchApplications();
  }, [paginationModel.pageSize, fetchApplications]);

  // Handle search with debounce (SearchBar handles this internally)
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPaginationModel((prev) => ({ page: 0, pageSize: prev.pageSize }));
  }, []);

  // Handle pagination change
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);


  // Handle update status (reusing from University Application Summary)
  const handleUpdateStatus = useCallback((applicant: Applicant) => {
    setSelectedApplicant(applicant);
    // Map the applicant status to the constant value format
    const statusValue = applicationStatusOptions.find(
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
      const statusLabel = applicationStatusOptions.find(
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
          statusName: (applicant.status === "Active") ? "Inactive" : "Active",
          notes: `Previous status: ${(applicant.status === "Active") ? "Inactive" : "Active"}`,
          time: applicant.createdAt ? new Date(applicant.createdAt).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStatusHistory(mockHistory);
    } catch (error) {
      if (import.meta.env.DEV) {
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
      headerName: t("applicantTracker.applicantId", "ID"),
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
    <Layout userName={user?.name || "Admin"} userRole={user?.role || "User"}>
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
          </div>
        </div>

        {/* Filters Row */}
        <ApplicantTrackerFilters
          adminOptions={adminOptions}
          managerOptions={managerOptions}
          counselorOptions={counselorOptions}
          universityOptions={universityOptions}
          selectedAdmin={selectedAdmin}
          selectedManager={selectedManager}
          selectedCounselor={selectedCounselor}
          selectedUniversity={selectedUniversity}
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
          rows={applicants}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={totalCount}
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
                    options={applicationStatusOptions}
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
