import { useState, useMemo, useCallback, useEffect, useRef, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams, GridSortModel } from "@mui/x-data-grid";
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
import { COLORS, applicationStatusOptions, typography, type Applicant, ROUTES, UserRole } from "../../constants";
import { Calendar, Edit, Document } from "../../assets";
import { formatDateTime, handleApiError, getApplicationStatusLabel, getApplicationStageLabel, toTitleCase } from "../../utils";
import ApplicantTrackerFilters from "./ApplicantTrackerFilters";
import ApplicationStatusHistoryPopup from "./ApplicantDetail/ApplicationStatusHistoryPopup";
import type { ApplicationStatusHistory } from "./ApplicantDetail/types";
import { applicantService, userService } from "../../services";
import type { ApplicationListItem, AdminItem, ManagerItem, CounselorItem, UniversityItem, AgencyPartnerNameItem, PaginatedData } from "../../services";
import type { SelectOption } from "../../components";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import {
  setLoading,
  setError,
  setApplicants,
  setPage,
  setPageSize,
  setSort,
  setSearch,
  applyFilters,
  clearFilters,
} from "../../redux/slices/applicantTracker/applicantTrackerSlice";
import { formatDateToYYYYMMDD, formatDateToISODateTime } from "../../utils";

const ApplicantTracker = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Get user from Redux (decoded from token)
  const { user } = useAppSelector((state) => state.auth);

  // Get applicantTracker state from Redux
  const { applicants, isLoading, pagination, filter, sort } = useAppSelector((state) => state.applicantTracker);

  // Determine user role for conditional filtering
  const userRole = user?.role?.toUpperCase() || "";
  const isPrimaryAdmin = user?.isPrimaryAdmin === true || userRole === UserRole.PRIMARY_ADMIN;
  // ADMIN_BILLING should be treated as ADMIN
  const isAdmin = userRole === UserRole.ADMIN || userRole === "ADMIN_BILLING" || isPrimaryAdmin;
  // MANAGER_BILLING should be treated as MANAGER
  const isManager = userRole === UserRole.MANAGER || userRole === "MANAGER_BILLING";

  // Local state for search input (for debounce) - sync with persisted filter
  const [searchQuery, setSearchQuery] = useState(() => filter.search);

  // Sync local searchQuery with Redux filter.search when it changes externally
  useEffect(() => {
    if (filter.search !== searchQuery) {
      setSearchQuery(filter.search);
    }
  }, [filter.search]);

  // Filter options from API
  const [adminOptions, setAdminOptions] = useState<SelectOption[]>([]);
  const [managerOptions, setManagerOptions] = useState<SelectOption[]>([]);
  const [counselorOptions, setCounselorOptions] = useState<SelectOption[]>([]);
  const [universityOptions, setUniversityOptions] = useState<SelectOption[]>([]);
  const [agencyPartnerOptions, setAgencyPartnerOptions] = useState<SelectOption[]>([]);
  

  // Loading state
  const isLoadingRef = useRef(false);
  const userRef = useRef(user);
  const hasFetchedFilterOptionsRef = useRef(false);
  const isLoadingFilterOptionsRef = useRef(false);
  
  // Update userRef when user changes
  userRef.current = user;

  /**
   * Map API response to Applicant type
   * Note: Dates are stored as ISO strings (not Date objects) for Redux serialization
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
      enrollmentType: item.enrollmentType || undefined,
      // Store dates as ISO strings for Redux serialization (formatDateTime can handle strings)
      appliedDate: item.appliedDate || undefined,
      lastUpdatedDate: item.updatedAt || undefined,
      intake: item.desiredIntake,
    };
  }, []);


  /**
   * Fetch applications from API
   */
  const fetchApplications = useCallback(async () => {
    const currentUser = userRef.current;
    
    // Don't fetch if user is not loaded yet or already loading
    if (!currentUser?.agencyId || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    dispatch(setLoading(true));
    dispatch(showLoader());

    try {
      // Get applied filter values (convert to numbers if needed) - these are optional filters
      // For ADMIN role: use logged-in user's ID as default admin ID if not specified
      // For MANAGER role: use logged-in user's ID as default manager ID if not specified
      let assignedAdminIdValue = filter.admin ? parseInt(filter.admin) : null;
      let assignedManagerIdValue = filter.manager ? parseInt(filter.manager) : null;
      let assignedCounselorIdValue = filter.counselor ? parseInt(filter.counselor) : null;

      // Apply role-based defaults
      // Check role from currentUser to ensure we have the latest role info
      const currentUserRole = currentUser?.role?.toUpperCase() || "";
      const currentIsPrimaryAdmin = currentUser?.isPrimaryAdmin === true || currentUserRole === UserRole.PRIMARY_ADMIN;
      // ADMIN_BILLING should be treated as ADMIN
      const currentIsAdmin = currentUserRole === UserRole.ADMIN || currentUserRole === "ADMIN_BILLING" || currentIsPrimaryAdmin;
      // MANAGER_BILLING should be treated as MANAGER
      const currentIsManager = currentUserRole === UserRole.MANAGER || currentUserRole === "MANAGER_BILLING";

      if (currentIsAdmin && !currentIsPrimaryAdmin && !assignedAdminIdValue && currentUser?.userId) {
        // Admin or Admin_Billing logged in: use their ID as admin ID
        assignedAdminIdValue = currentUser.userId;
      }
      if (currentIsManager && !assignedManagerIdValue && currentUser?.userId) {
        // Manager or Manager_Billing logged in: use their ID as manager ID
        assignedManagerIdValue = currentUser.userId;
      }

      // Format dates for API - convert YYYY-MM-DD to ISO DATE_TIME format
      // appliedFrom/appliedTo: set to start of day (00:00:00) and end of day (23:59:59) respectively
      const appliedFromFormatted = formatDateToISODateTime(filter.appliedFromDate, true);
      const appliedToFormatted = formatDateToISODateTime(filter.appliedToDate, false); // End of day for "to" date
      // updatedFrom/updatedTo: convert to ISO DATE_TIME format
      const updatedFromFormatted = formatDateToISODateTime(filter.lastUpdatedFromDate, true);
      const updatedToFormatted = formatDateToISODateTime(filter.lastUpdatedToDate, false); // End of day for "to" date

      // Get applicationStage - backend expects single value
      const applicationStageValue = filter.applicationStage || null;

      // Get universityId, desiredIntake, and agencyPartnerId values
      const universityIdValue = filter.university ? parseInt(filter.university) : null;
      const desiredIntakeValue = filter.intake || null;
      const agencyPartnerIdValue = filter.agencyPartner ? parseInt(filter.agencyPartner) : null;

      // Map sort field - lastUpdatedDate -> updatedAt for API
      const sortByField = sort.sortBy === "lastUpdatedDate" ? "updatedAt" : (sort.sortBy || "updatedAt");

      const response = await applicantService.getApplicationsList({
        agencyId: currentUser.agencyId ?? null,
        applicantId: null, // Not filtering by applicant in tracker view
        assignedAdminId: assignedAdminIdValue,
        assignedManagerId: assignedManagerIdValue,
        assignedCounselorId: assignedCounselorIdValue,
        applicationStatus: filter.applicationStatus || null,
        applicationStage: applicationStageValue,
        universityId: universityIdValue,
        desiredIntake: desiredIntakeValue,
        agencyPartnerId: agencyPartnerIdValue,
        appliedFrom: appliedFromFormatted,
        appliedTo: appliedToFormatted,
        updatedFrom: updatedFromFormatted,
        updatedTo: updatedToFormatted,
        search: filter.search || null,
        page: pagination.page,
        size: pagination.size,
        sortBy: sortByField,
        asc: sort.asc,
      });

      if (response.status === "success" && response.data) {
        // Map API response to Applicant type
        const mappedApplicants = response.data.content.map(mapApplicationListItemToApplicant);
        
        // Create PaginatedData structure for Redux
        const paginatedData: PaginatedData<Applicant> = {
          content: mappedApplicants,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          first: response.data.first,
          last: response.data.last,
          size: response.data.size || pagination.size,
          number: response.data.page || pagination.page,
          numberOfElements: response.data.numberOfElements || mappedApplicants.length,
          empty: mappedApplicants.length === 0,
        };
        
        dispatch(setApplicants(paginatedData));
      } else {
        throw new Error(response.message || "Failed to fetch applications");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch applications");
      dispatch(addToast({ type: "error", message }));
      dispatch(setError(message));
      dispatch(setApplicants([]));
    } finally {
      isLoadingRef.current = false;
      dispatch(setLoading(false));
      dispatch(hideLoader());
    }
  }, [dispatch, filter.admin, filter.manager, filter.counselor, filter.applicationStatus, filter.applicationStage, filter.university, filter.intake, filter.agencyPartner, filter.appliedFromDate, filter.appliedToDate, filter.lastUpdatedFromDate, filter.lastUpdatedToDate, filter.search, pagination.page, pagination.size, sort.sortBy, sort.asc, mapApplicationListItemToApplicant]);

  // Initial fetch when user is loaded or filters/pagination/sort change
  useEffect(() => {
    if (user?.agencyId) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.agencyId, filter.admin, filter.manager, filter.counselor, filter.applicationStatus, filter.applicationStage, filter.university, filter.intake, filter.agencyPartner, filter.appliedFromDate, filter.appliedToDate, filter.lastUpdatedFromDate, filter.lastUpdatedToDate, filter.search, pagination.page, pagination.size, sort.sortBy, sort.asc]);

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
      const currentUserRole = user?.role?.toUpperCase() || "";
      const currentIsPrimaryAdmin = user?.isPrimaryAdmin === true || currentUserRole === UserRole.PRIMARY_ADMIN;
      // ADMIN_BILLING should be treated as ADMIN
      const currentIsAdmin = currentUserRole === UserRole.ADMIN || currentUserRole === "ADMIN_BILLING" || currentIsPrimaryAdmin;
      // MANAGER_BILLING should be treated as MANAGER
      const currentIsManager = currentUserRole === UserRole.MANAGER || currentUserRole === "MANAGER_BILLING";

      // Only fetch admins if user is PRIMARY_ADMIN
      const fetchPromises: Promise<any>[] = [
        applicantService.getUniversities(user.agencyId),
        applicantService.getAgencyPartnerNames(user.agencyId),
      ];

      if (currentIsPrimaryAdmin) {
        fetchPromises.push(userService.getAdmins(user.agencyId));
      }

      const results = await Promise.allSettled(fetchPromises);

      // Process admins response (only if PRIMARY_ADMIN)
      if (currentIsPrimaryAdmin) {
        const adminsResult = results[2]; // Third promise is admins
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
      } else {
        setAdminOptions([]);
      }

      // Process universities response
      const universitiesResult = results[0];
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

      // Process agency partners response
      const agencyPartnersResult = results[1];
      if (agencyPartnersResult.status === 'fulfilled') {
        const agencyPartnersResponse = agencyPartnersResult.value;
        
        // API returns array directly: [{id, name}, ...]
        let agencyPartners: AgencyPartnerNameItem[] = [];
        if (Array.isArray(agencyPartnersResponse)) {
          agencyPartners = agencyPartnersResponse;
        }
        
        // Convert to SelectOption format
        const agencyPartnerOptionsData = agencyPartners.map((partner: AgencyPartnerNameItem) => ({
          value: partner.id.toString(),
          label: partner.name,
        }));
        
        setAgencyPartnerOptions(agencyPartnerOptionsData);
      } else {
        dispatch(addToast({ type: "error", message: "Failed to fetch agency partners" }));
      }

      // For ADMIN role: automatically fetch managers using logged-in admin's ID
      if (currentIsAdmin && !currentIsPrimaryAdmin && user?.userId) {
        try {
          const managersResponse = await applicantService.getManagers(
            user.agencyId,
            user.userId.toString()
          );
          const managers = Array.isArray(managersResponse) ? managersResponse : [];
          setManagerOptions(
            managers.map((manager: ManagerItem) => ({
              value: manager.id.toString(),
              label: manager.name,
            }))
          );
        } catch (error: any) {
          // Silently fail - managers will be empty
          setManagerOptions([]);
        }
      }

      // For MANAGER role: automatically fetch counselors using logged-in manager's ID
      if (currentIsManager && user?.userId) {
        try {
          const counselorsResponse = await applicantService.getCounselors(
            user.agencyId,
            user.userId.toString()
          );
          const counselors = Array.isArray(counselorsResponse) ? counselorsResponse : [];
          setCounselorOptions(
            counselors.map((counselor: CounselorItem) => ({
              value: counselor.id.toString(),
              label: counselor.name,
            }))
          );
        } catch (error: any) {
          // Silently fail - counselors will be empty
          setCounselorOptions([]);
        }
      }

      // For other roles, keep empty arrays
      if (!currentIsAdmin && !currentIsManager) {
        setManagerOptions([]);
        setCounselorOptions([]);
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch filter options");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isLoadingFilterOptionsRef.current = false;
    }
  }, [user?.agencyId, user?.role, user?.isPrimaryAdmin, user?.userId, dispatch]);

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

  // Temporary filter states (for UI selection before Apply button)
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

  // Initialize selected filters from Redux state on mount
  const isInitialMount = useRef(true);
  const isInitializingFromRedux = useRef(false);


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

  // Fetch managers when admin is selected (only for PRIMARY_ADMIN)
  useEffect(() => {
    // Skip during initial mount/initialization from Redux
    if (isInitialMount.current || isInitializingFromRedux.current) {
      return;
    }
    
    // Only fetch managers when admin is selected if user is PRIMARY_ADMIN
    if (!isPrimaryAdmin) {
      return;
    }
    
    if (user?.agencyId && selectedAdmin) {
      // Reset manager and counselor when admin changes
      setSelectedManager("");
      setSelectedCounselor("");
      setCounselorOptions([]);
      fetchManagers(selectedAdmin);
    } else if (!selectedAdmin) {
      // Clear managers when admin is cleared
      setManagerOptions([]);
      // Also clear selected manager and counselor when admin is cleared
      setSelectedManager("");
      setSelectedCounselor("");
      setCounselorOptions([]);
    }
  }, [selectedAdmin, user?.agencyId, isPrimaryAdmin, fetchManagers]);

  // Fetch counselors when manager is selected (for PRIMARY_ADMIN and ADMIN)
  useEffect(() => {
    // Skip during initial mount/initialization from Redux
    if (isInitialMount.current || isInitializingFromRedux.current) {
      return;
    }
    
    // Don't fetch counselors when manager is selected if user is MANAGER (they're already fetched)
    if (isManager) {
      return;
    }
    
    if (user?.agencyId && selectedManager) {
      // Reset counselor when manager changes
      setSelectedCounselor("");
      fetchCounselors(selectedManager);
    } else if (!selectedManager) {
      // Clear counselors when manager is cleared
      setCounselorOptions([]);
      // Also clear selected counselor when manager is cleared
      setSelectedCounselor("");
    }
  }, [selectedManager, user?.agencyId, isManager, fetchCounselors]);

  // Initialize selected filters from Redux state on mount (after fetchManagers and fetchCounselors are defined)
  useEffect(() => {
    if (isInitialMount.current && user?.agencyId) {
      isInitializingFromRedux.current = true;
      
      // Restore non-dependent filter values first
      if (filter.university) setSelectedUniversity(filter.university);
      if (filter.applicationStage) setSelectedApplicantStages([filter.applicationStage]);
      if (filter.intake) setSelectedIntake(filter.intake);
      if (filter.agencyPartner) setSelectedAgencyPartner(filter.agencyPartner);
      if (filter.appliedFromDate) setAppliedFromDate(new Date(filter.appliedFromDate));
      if (filter.appliedToDate) setAppliedToDate(new Date(filter.appliedToDate));
      if (filter.lastUpdatedFromDate) setLastUpdatedFromDate(new Date(filter.lastUpdatedFromDate));
      if (filter.lastUpdatedToDate) setLastUpdatedToDate(new Date(filter.lastUpdatedToDate));
      
      // Fetch dependent options (managers and counselors) first, then set selected values
      const fetchInitialOptions = async () => {
        // For PRIMARY_ADMIN: restore admin/manager/counselor if persisted
        if (isPrimaryAdmin) {
          if (filter.admin) {
            await fetchManagers(filter.admin);
            if (filter.manager) {
              await fetchCounselors(filter.manager);
            }
          }
          if (filter.admin) setSelectedAdmin(filter.admin);
          if (filter.manager) setSelectedManager(filter.manager);
          if (filter.counselor) setSelectedCounselor(filter.counselor);
        }
        // For ADMIN: managers should already be fetched in fetchFilterOptions, restore manager/counselor if persisted
        else if (isAdmin && !isPrimaryAdmin) {
          // Managers are already fetched in fetchFilterOptions with admin's ID
          if (filter.manager) {
            await fetchCounselors(filter.manager);
          }
          // Don't set admin - it's hidden and handled by default in API call
          if (filter.manager) setSelectedManager(filter.manager);
          if (filter.counselor) setSelectedCounselor(filter.counselor);
        }
        // For MANAGER: counselors should already be fetched in fetchFilterOptions, restore counselor if persisted
        else if (isManager) {
          // Counselors are already fetched in fetchFilterOptions with manager's ID
          // Don't set admin/manager - they're hidden and handled by default in API call
          if (filter.counselor) setSelectedCounselor(filter.counselor);
        }
        
        // Mark initialization as complete
        isInitializingFromRedux.current = false;
        isInitialMount.current = false;
      };
      
      fetchInitialOptions();
    } else if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [filter, user?.agencyId, isPrimaryAdmin, isAdmin, isManager, fetchManagers, fetchCounselors]);

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
  const [statusHistoryData, setStatusHistoryData] = useState<{
    history: ApplicationStatusHistory[];
    universityName: string;
    applicantName: string;
  } | null>(null);
  const [isLoadingStatusHistory, setIsLoadingStatusHistory] = useState(false);

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
    dispatch(applyFilters({
      search: filter.search, // Keep existing search
      admin: selectedAdmin,
      manager: selectedManager,
      counselor: selectedCounselor,
      applicationStatus: "", // Note: applicationStatus filter is not in UI yet
      applicationStage: selectedApplicantStages.length > 0 ? selectedApplicantStages[0] : "", // Backend expects single value
      university: selectedUniversity,
      intake: selectedIntake,
      agencyPartner: selectedAgencyPartner,
      appliedFromDate: formatDateToYYYYMMDD(appliedFromDate),
      appliedToDate: formatDateToYYYYMMDD(appliedToDate),
      lastUpdatedFromDate: formatDateToYYYYMMDD(lastUpdatedFromDate),
      lastUpdatedToDate: formatDateToYYYYMMDD(lastUpdatedToDate),
    }));
  }, [selectedAdmin, selectedManager, selectedCounselor, selectedApplicantStages, selectedUniversity, selectedIntake, selectedAgencyPartner, appliedFromDate, appliedToDate, lastUpdatedFromDate, lastUpdatedToDate, filter.search, dispatch]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    // Clear selected filters (local state)
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

    // Clear applied filters in Redux
    dispatch(clearFilters());
  }, [dispatch]);

  // Handle search - updates local state which triggers debounced Redux update
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Debounced search effect - updates Redux after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filter.search !== searchQuery) {
        dispatch(setSearch(searchQuery));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filter.search, dispatch]);

  // Handle pagination change
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    if (model.page !== pagination.page) {
      dispatch(setPage(model.page));
    }
    if (model.pageSize !== pagination.size) {
      dispatch(setPageSize(model.pageSize));
    }
  }, [dispatch, pagination.page, pagination.size]);

  // Handle sort model change
  const handleSortModelChange = useCallback((model: GridSortModel) => {
    if (model.length > 0) {
      const { field, sort: sortOrder } = model[0];
      // Map lastUpdatedDate to updatedAt for API
      const sortByField = field === "lastUpdatedDate" ? "updatedAt" : field;
      dispatch(setSort({ sortBy: sortByField, asc: sortOrder === "asc" }));
    } else {
      dispatch(setSort({ sortBy: "updatedAt", asc: false }));
    }
  }, [dispatch]);

  // Pagination model for DataTable (synced with Redux)
  const paginationModel: GridPaginationModel = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.size,
    }),
    [pagination.page, pagination.size]
  );

  // Sort model for DataTable (synced with Redux)
  const sortModel: GridSortModel = useMemo(() => {
    if (!sort.sortBy) return [];
    // Map updatedAt back to lastUpdatedDate for UI
    const field = sort.sortBy === "updatedAt" ? "lastUpdatedDate" : sort.sortBy;
    return [{ field, sort: sort.asc ? "asc" : "desc" }];
  }, [sort.sortBy, sort.asc]);


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
    dispatch(showLoader());

    try {
      // Call Update Application Status API
      const response = await applicantService.updateApplicationStatus({
        applicantId: parseInt(selectedApplicant.applicantId),
        applicationPrefId: parseInt(selectedApplicant.id), // id is preferenceId
        applicationStatus: newApplicationStatus,
        notes: applicationNotes || "",
        isMailSendToStudent: notifyStudent,
      });

      if (response.status === "success") {
        // Show success toast
        dispatch(
          addToast({
            type: "success",
            message: response.message || "Application status updated successfully",
          })
        );

        // Refetch applications to get updated data
        await fetchApplications();

        // Batch popup state cleanup
        setIsApplicationStatusPopupOpen(false);
        setSelectedApplicant(null);
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
  }, [selectedApplicant, newApplicationStatus, applicationNotes, notifyStudent, fetchApplications, dispatch]);

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

  // Handle view status history - optimized with React 18 patterns
  const handleViewStatusHistory = useCallback(async (applicant: Applicant) => {
    // Open popup immediately - urgent update
    setSelectedApplicantForHistory(applicant);
    setIsStatusHistoryPopupOpen(true);
    setIsLoadingStatusHistory(true);
    
    // Clear previous data - non-urgent, can use transition
    startTransition(() => {
      setStatusHistoryData(null);
    });

    try {
      // Call Status History API
      const response = await applicantService.getStatusHistory({
        applicantId: parseInt(applicant.applicantId),
        applicationPrefId: parseInt(applicant.id), // id is preferenceId
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
  }, [dispatch]);

  // Handle close status history - batch state updates
  const handleCloseStatusHistory = useCallback(() => {
    // React 18+ automatically batches these state updates
    setIsStatusHistoryPopupOpen(false);
    setSelectedApplicantForHistory(null);
    setStatusHistoryData(null);
    setIsLoadingStatusHistory(false);
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
    dispatch(showLoader());

    try {
      // Call Apply API
      const response = await applicantService.applyApplication({
        applicantId: parseInt(applicantToApply.applicantId),
        applicationPrefId: parseInt(applicantToApply.id), // id is preferenceId
      });

      if (response.status === "success" && response.data) {
        // Show success toast
        dispatch(
          addToast({
            type: "success",
            message: response.message || "Application applied successfully",
          })
        );

        // Refetch applications to get updated data
        await fetchApplications();

        // Batch popup state cleanup
        setIsApplyConfirmationOpen(false);
        setApplicantToApply(null);
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
  }, [applicantToApply, fetchApplications, dispatch]);

  // Handle cancel apply
  const handleCancelApply = useCallback(() => {
    setIsApplyConfirmationOpen(false);
    setApplicantToApply(null);
  }, []);

  // Handle view documents - navigate to application tracker documents page
  const handleViewDocuments = useCallback((applicant: Applicant) => {
    navigate(ROUTES.APPLICANT_TRACKER_DOCUMENTS.replace(":applicantId", applicant.applicantId), {
      state: {
        applicantName: applicant.applicantName,
        contactNo: applicant.contactNo,
        applicationPrefId: applicant.id, // id is preferenceId (applicationPrefId)
      },
    });
  }, [navigate]);

  // Memoize renderCell functions to prevent recreation
  const renderApplicantNameCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    if (!params.row.applicantName) {
      return (
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          -
        </span>
      );
    }
    const nameText = params.row.applicantName || "-";
    const contactText = params.row.contactNo || "-";
    const fullText = `${nameText}${contactText !== "-" ? ` (${contactText})` : ""}`;
    
    return (
      <Tooltip title={fullText} arrow placement="top">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm truncate" style={{ color: COLORS.textDark }}>
            {nameText}
          </span>
          <span className="text-xs truncate" style={{ color: COLORS.textMuted }}>
            {contactText}
          </span>
        </div>
      </Tooltip>
    );
  }, []);

  const renderAppliedDateCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const dateValue = params.row.appliedDate ? formatDateTime(params.row.appliedDate) : "-";
    return (
      <Tooltip title={dateValue} arrow placement="top">
        <span className="text-sm" style={{ color: params.row.appliedDate ? COLORS.textDark : COLORS.textMuted }}>
          {dateValue}
        </span>
      </Tooltip>
    );
  }, []);

  const renderLastUpdatedDateCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const dateValue = params.row.lastUpdatedDate ? formatDateTime(params.row.lastUpdatedDate) : "-";
    return (
      <Tooltip title={dateValue} arrow placement="top">
        <span className="text-sm" style={{ color: params.row.lastUpdatedDate ? COLORS.textDark : COLORS.textMuted }}>
          {dateValue}
        </span>
      </Tooltip>
    );
  }, []);

  const renderIntakeYearCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    if (!params.row.intake) {
      return (
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          -
        </span>
      );
    }
    // Format intake like "jan-2026" to "Jan 2026" or just "2026"
    const intakeParts = params.row.intake.split("-");
    let displayValue: string;
    if (intakeParts.length === 2) {
      const month = intakeParts[0].charAt(0).toUpperCase() + intakeParts[0].slice(1);
      const year = intakeParts[1];
      displayValue = `${month} ${year}`;
    } else {
      displayValue = params.row.intake;
    }
    
    return (
      <Tooltip title={displayValue} arrow placement="top">
        <span className="text-sm truncate cursor-default" style={{ color: COLORS.textDark }}>
          {displayValue}
        </span>
      </Tooltip>
    );
  }, []);

  const renderUniversityCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const university = params.value || "-";
    return (
      <Tooltip title={university} arrow placement="top">
        <span className="text-sm truncate cursor-default" style={{ color: params.value ? COLORS.textDark : COLORS.textMuted }}>
          {university}
        </span>
      </Tooltip>
    );
  }, []);

  const renderCourseCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const course = params.value || "-";
    return (
      <Tooltip title={course} arrow placement="top">
        <span className="text-sm truncate cursor-default" style={{ color: params.value ? COLORS.textDark : COLORS.textMuted }}>
          {course}
        </span>
      </Tooltip>
    );
  }, []);

  // Render status cell similar to University Application Summary
  const renderStatusCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const status = params.value?.toLowerCase() || "";
    const statusLabel = getApplicationStatusLabel(params.value);
    const isOfferReceived = statusLabel.toLowerCase() === "offer received";
    const isApply = !params.value || status === "" || status === "apply";
    
    if (isApply) {
      return (
        <Button
          variant="accent"
          size="sm"
          rounded
          onClick={(e) => {
            e.stopPropagation();
            handleApplyClick(params.row);
          }}
        >
          Apply
        </Button>
      );
    }
    
    return (
      <Tooltip title={statusLabel} arrow placement="top">
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
          {statusLabel}
        </span>
      </Tooltip>
    );
  }, [handleApplyClick]);

  // Render stage cell similar to status cell
  const renderStageCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    if (!params.value) {
      return (
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          -
        </span>
      );
    }
    const stageLabel = getApplicationStageLabel(params.value);
    const isOfferReceived = stageLabel.toLowerCase() === "offer received";
    
    return (
      <Tooltip title={stageLabel} arrow placement="top">
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
          {stageLabel}
        </span>
      </Tooltip>
    );
  }, []);

  const renderActionsCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <div className="flex items-center gap-2">
      <Tooltip title={t("documentVault.title", "Document Vault")} arrow>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDocuments(params.row);
          }}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{ color: COLORS.accent }}
          aria-label={t("documentVault.title", "Document Vault")}
        >
          <Document className="w-5 h-5" />
        </button>
      </Tooltip>
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
  ), [t, handleViewDocuments, handleViewStatusHistory, handleUpdateStatus]);

  // Render Enrollment Type cell with tooltip and title case
  const renderEnrollmentTypeCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    const enrollmentType = params.row.enrollmentType || "-";
    const displayValue = enrollmentType !== "-" ? toTitleCase(enrollmentType.replace(/_/g, " ")) : "-";
    return (
      <Tooltip title={displayValue} arrow placement="top">
        <span
          className="truncate block cursor-default"
          style={{
            color: enrollmentType !== "-" ? COLORS.textDark : COLORS.textMuted,
            fontSize: typography.fontSize.small,
          }}
        >
          {displayValue}
        </span>
      </Tooltip>
    );
  }, []);

  // Table columns - memoized to prevent recreation
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "enrollmentType",
      headerName: t("applicantTracker.enrollmentType", "Enrolment Type"),
      flex: 1.2,
      minWidth: 140,
      sortable: true,
      renderCell: renderEnrollmentTypeCell,
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
      renderCell: renderUniversityCell,
    },
    {
      field: "course",
      headerName: t("applicantTracker.course", "Course"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderCourseCell,
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
  ], [t, renderEnrollmentTypeCell, renderApplicantNameCell, renderUniversityCell, renderCourseCell, renderAppliedDateCell, renderLastUpdatedDateCell, renderIntakeYearCell, renderStageCell, renderStatusCell, renderActionsCell]);

  return (
    <Layout>
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
            {t("applicantTracker.title", "Applicant Tracker")} ({pagination.totalElements})
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
          agencyPartnerOptions={agencyPartnerOptions}
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
          userRole={user?.role}
          isPrimaryAdmin={isPrimaryAdmin}
        />

        {/* DataTable */}
        <DataTable
          rows={applicants}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={pagination.totalElements}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
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
          statusHistoryData={statusHistoryData}
          isLoading={isLoadingStatusHistory}
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
                  "Are you sure you want to apply for {{university}}? This will set the status to 'Lead' and set the applied date to today.",
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
