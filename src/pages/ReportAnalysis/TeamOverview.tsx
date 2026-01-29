import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams, GridSortModel } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { DataTable } from "../../components";
import type { SelectOption } from "../../components";
import { COLORS, typography, UserRole } from "../../constants";
import { toTitleCase, formatDateToYYYYMMDD, handleApiError } from "../../utils";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import {
  setLoading,
  setError,
  setTeamOverviewData,
  setPage,
  setPageSize,
  setSort,
  applyFilters,
  clearFilters,
} from "../../redux/slices/teamOverview/teamOverviewSlice";
import { applicantService, userService } from "../../services";
import type { AdminItem, ManagerItem, CounselorItem, TeamOverviewItemData, TeamOverviewItem, PaginatedData } from "../../services";
import TeamOverviewFilters from "./TeamOverviewFilters";

const TeamOverview = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Get Redux state
  const { teamOverviewData, isLoading, pagination, sort, filter } = useAppSelector(
    (state) => state.teamOverview
  );

  // Determine user role for conditional filtering
  const userRole = user?.role?.toUpperCase() || "";
  const isPrimaryAdmin = user?.isPrimaryAdmin === true || userRole === UserRole.PRIMARY_ADMIN;
  // MANAGER_BILLING should be treated as MANAGER
  const isManager = userRole === UserRole.MANAGER || userRole === "MANAGER_BILLING";

  // Filter states (selected - what user is choosing, before Apply button)
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState("");
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(null);
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(null);

  // Filter options states
  const [adminOptions, setAdminOptions] = useState<SelectOption[]>([]);
  const [managerOptions, setManagerOptions] = useState<SelectOption[]>([]);
  const [counselorOptions, setCounselorOptions] = useState<SelectOption[]>([]);

  // Pagination model for DataTable (synced with Redux)
  const paginationModel: GridPaginationModel = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.size,
    }),
    [pagination.page, pagination.size]
  );

  // Refs to prevent multiple simultaneous API calls
  const isLoadingFilterOptionsRef = useRef(false);
  const hasFetchedFilterOptionsRef = useRef(false);
  const isLoadingTeamOverviewRef = useRef(false);
  const userRef = useRef(user);
  const isSettingCounselorRef = useRef(false);
  userRef.current = user;

  /**
   * Fetch filter options (admins, managers, counselors) from API
   */
  const fetchFilterOptions = useCallback(async () => {
    if (!user?.agencyId) {
      return;
    }

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
      if (currentIsPrimaryAdmin) {
        const [adminsResult] = await Promise.allSettled([
          userService.getAdmins(user.agencyId),
        ]);

        // Process admins response
        if (adminsResult.status === 'fulfilled') {
          const adminsResponse = adminsResult.value;
          
          let admins: AdminItem[] = [];
          if (Array.isArray(adminsResponse)) {
            admins = adminsResponse;
          } else if ((adminsResponse as any)?.data) {
            admins = (adminsResponse as any).data;
          }
          
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

  // Initialize selected filters from Redux state on mount
  useEffect(() => {
    if (filter.admin) setSelectedAdmin(filter.admin);
    if (filter.manager) setSelectedManager(filter.manager);
    if (filter.counselor) setSelectedCounselor(filter.counselor);
    if (filter.enrollmentType) setSelectedEnrollmentType(filter.enrollmentType);
    if (filter.fromDate) setSelectedFromDate(new Date(filter.fromDate));
    if (filter.toDate) setSelectedToDate(new Date(filter.toDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Fetch filter options when user is loaded (only once)
  useEffect(() => {
    if (user?.agencyId && !hasFetchedFilterOptionsRef.current) {
      hasFetchedFilterOptionsRef.current = true;
      fetchFilterOptions();
    }
    
    return () => {
      if (!user?.agencyId) {
        hasFetchedFilterOptionsRef.current = false;
      }
    };
  }, [user?.agencyId, fetchFilterOptions]);

  // Fetch managers when admin is selected
  const fetchManagers = useCallback(async (adminId: string | null) => {
    if (!user?.agencyId || !adminId) {
      setManagerOptions([]);
      return;
    }

    try {
      const managersResponse = await applicantService.getManagers(
        user.agencyId,
        adminId
      );

      const managerOptionsData = managersResponse.map((manager: ManagerItem) => ({
        value: manager.id.toString(),
        label: manager.name,
      }));

      setManagerOptions(managerOptionsData);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch managers");
      dispatch(addToast({ type: "error", message }));
      setManagerOptions([]);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch counselors when manager is selected
  const fetchCounselors = useCallback(async (managerId: string | null) => {
    if (!user?.agencyId || !managerId) {
      setCounselorOptions([]);
      return;
    }

    try {
      const counselorsResponse = await applicantService.getCounselors(
        user.agencyId,
        managerId
      );

      const counselorOptionsData = counselorsResponse.map((counselor: CounselorItem) => ({
        value: counselor.id.toString(),
        label: counselor.name,
      }));

      setCounselorOptions(counselorOptionsData);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch counselors");
      dispatch(addToast({ type: "error", message }));
      setCounselorOptions([]);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch managers when admin is selected (only for PRIMARY_ADMIN)
  useEffect(() => {
    // Only fetch managers when admin is selected if user is PRIMARY_ADMIN
    if (!isPrimaryAdmin) {
      return;
    }
    
    const adminToUse = selectedAdmin || filter.admin;
    if (user?.agencyId && adminToUse) {
      fetchManagers(adminToUse);
    } else {
      setManagerOptions([]);
      // Only clear manager if admin is cleared and counselor is not selected
      if (!selectedAdmin && !selectedCounselor && !isSettingCounselorRef.current) {
        setSelectedManager("");
      }
      setCounselorOptions([]);
      // Only clear counselor if admin is cleared and counselor is not explicitly selected
      if (!selectedAdmin && !selectedCounselor && !isSettingCounselorRef.current) {
        setSelectedCounselor("");
      }
    }
  }, [selectedAdmin, filter.admin, user?.agencyId, isPrimaryAdmin, fetchManagers, selectedCounselor]);

  // Fetch counselors when manager is selected (for PRIMARY_ADMIN and ADMIN)
  useEffect(() => {
    // Don't fetch counselors when manager is selected if user is MANAGER (they're already fetched)
    if (isManager) {
      return;
    }
    
    const managerToUse = selectedManager || filter.manager;
    if (user?.agencyId && managerToUse) {
      fetchCounselors(managerToUse);
    } else {
      setCounselorOptions([]);
      // Only clear counselor if manager is cleared and counselor is not explicitly selected
      if (!selectedManager && !selectedCounselor && !isSettingCounselorRef.current) {
        setSelectedCounselor("");
      }
    }
  }, [selectedManager, filter.manager, user?.agencyId, isManager, fetchCounselors, selectedCounselor]);


  /**
   * Map API response to TeamOverviewItem
   */
  const mapApiResponseToTeamOverviewItem = useCallback((item: TeamOverviewItemData): TeamOverviewItem => {
    return {
      id: item.userId.toString(),
      name: item.userName,
      role: item.role,
      reportingAdmins: item.adminList.join(", "),
      reportingManagers: item.managerList.join(", "),
      reportingCounselors: item.counselorList.join(", "),
      country: item.countryList.join(", "),
      totalApplicants: item.totalApplications,
      leads: item.leads,
      inProgressApplicants: item.inProgressApplications,
      enrolledApplicants: item.enrolledApplications,
      rejectedApplicants: item.rejectedApplications,
    };
  }, []);

  /**
   * Fetch team overview data from API
   */
  const fetchTeamOverview = useCallback(async () => {
    const currentUser = userRef.current;
    
    // Don't fetch if user is not loaded yet or already loading
    if (!currentUser?.agencyId || !currentUser?.userId || isLoadingTeamOverviewRef.current) {
      return;
    }

    isLoadingTeamOverviewRef.current = true;
    dispatch(setLoading(true));
    dispatch(showLoader());

    try {
      // Determine query parameters based on priority: counselor > manager > admin
      let assignedAdminId: number | null = null;
      let assignedManagerId: number | null = null;
      let assignedCounselorId: number | null = null;

      // Check if filters are selected (explicitly check for non-empty strings)
      const hasAdminFilter = filter.admin && filter.admin.trim() !== "";
      const hasManagerFilter = filter.manager && filter.manager.trim() !== "";
      const hasCounselorFilter = filter.counselor && filter.counselor.trim() !== "";

      // Priority-based logic:
      // 1. If counselor is selected → send only assignedCounselorId
      // 2. If admin & manager are selected → send only assignedManagerId
      // 3. If only admin is selected → send only assignedAdminId
      // 4. If no filters are selected, use logged-in user's role as default
      if (hasCounselorFilter) {
        // Priority 1: Counselor selected - send only assignedCounselorId
        assignedCounselorId = parseInt(filter.counselor, 10);
      } else if (hasAdminFilter && hasManagerFilter) {
        // Priority 2: Both admin and manager selected - send only assignedManagerId
        assignedManagerId = parseInt(filter.manager, 10);
      } else if (hasManagerFilter) {
        // Manager only selected - send assignedManagerId
        assignedManagerId = parseInt(filter.manager, 10);
      } else if (hasAdminFilter) {
        // Priority 3: Only admin selected - send only assignedAdminId
        assignedAdminId = parseInt(filter.admin, 10);
      } else {
        // No filters selected - use logged-in user's role as default
        const currentUserRole = (currentUser.role || "").toUpperCase().trim();
        const currentIsPrimaryAdmin = currentUser.isPrimaryAdmin === true || currentUserRole === UserRole.PRIMARY_ADMIN;
        // ADMIN_BILLING should be treated as ADMIN
        const currentIsAdmin = currentUserRole === UserRole.ADMIN || currentUserRole === "ADMIN_BILLING" || currentIsPrimaryAdmin;
        // MANAGER_BILLING should be treated as MANAGER
        const currentIsManager = currentUserRole === UserRole.MANAGER || currentUserRole === "MANAGER_BILLING";
        
        if (currentIsAdmin && !currentIsPrimaryAdmin) {
          assignedAdminId = currentUser.userId;
        } else if (currentIsManager) {
          assignedManagerId = currentUser.userId;
        } else if (currentUserRole === "COUNSELOR" || currentUserRole === "COUNSELLOR") {
          assignedCounselorId = currentUser.userId;
        }
      }

      const response = await userService.getTeamOverview({
        agencyId: currentUser.agencyId,
        search: null,
        role: null,
        page: pagination.page,
        size: pagination.size,
        sortBy: sort.sortBy || "name",
        asc: sort.asc,
        assignedAdminId: assignedAdminId ?? null,
        assignedManagerId: assignedManagerId ?? null,
        assignedCounselorId: assignedCounselorId ?? null,
        enrollmentType: filter.enrollmentType || null,
        fromDate: filter.fromDate || null,
        toDate: filter.toDate || null,
      });

      if (response.status === "success" && response.data) {
        // Map API response to TeamOverviewItem format
        const mappedData = response.data.content.map(mapApiResponseToTeamOverviewItem);
        
        // Create PaginatedData structure for Redux
        const paginatedData: PaginatedData<TeamOverviewItem> = {
          content: mappedData,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          first: response.data.first,
          last: response.data.last,
          size: response.data.size || pagination.size,
          number: response.data.page || pagination.page,
          numberOfElements: response.data.numberOfElements || mappedData.length,
          empty: mappedData.length === 0,
        };
        
        dispatch(setTeamOverviewData(paginatedData));
      } else {
        throw new Error(response.message || "Failed to fetch team overview");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch team overview");
      dispatch(addToast({ type: "error", message }));
      dispatch(setError(message));
      dispatch(setTeamOverviewData([]));
    } finally {
      isLoadingTeamOverviewRef.current = false;
      dispatch(setLoading(false));
      dispatch(hideLoader());
    }
  }, [dispatch, filter.admin, filter.manager, filter.counselor, filter.enrollmentType, filter.fromDate, filter.toDate, pagination.page, pagination.size, sort.sortBy, sort.asc, mapApiResponseToTeamOverviewItem]);

  // Initial fetch when user is loaded or filters/pagination/sort change
  useEffect(() => {
    if (user?.agencyId && user?.userId) {
      fetchTeamOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.agencyId, user?.userId, filter.admin, filter.manager, filter.counselor, filter.enrollmentType, filter.fromDate, filter.toDate, pagination.page, pagination.size, sort.sortBy, sort.asc]);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    dispatch(applyFilters({
      admin: selectedAdmin,
      manager: selectedManager,
      counselor: selectedCounselor,
      enrollmentType: selectedEnrollmentType,
      fromDate: formatDateToYYYYMMDD(selectedFromDate),
      toDate: formatDateToYYYYMMDD(selectedToDate),
    }));
  }, [selectedAdmin, selectedManager, selectedCounselor, selectedEnrollmentType, selectedFromDate, selectedToDate, dispatch]);

  // Handle admin change - clear manager and counselor when admin changes
  const handleAdminChange = useCallback((value: string) => {
    setSelectedAdmin(value);
    // Clear dependent filters when admin changes
    if (value) {
      setSelectedManager("");
      setSelectedCounselor("");
    }
  }, []);

  // Handle manager change - clear counselor when manager changes
  const handleManagerChange = useCallback((value: string) => {
    setSelectedManager(value);
    // Clear dependent filter when manager changes
    if (value) {
      setSelectedCounselor("");
    }
  }, []);

  // Handle counselor change - don't clear admin/manager, but they won't be sent to API (priority logic)
  const handleCounselorChange = useCallback((value: string) => {
    setSelectedCounselor(value);
    // Note: We don't clear admin/manager here - they can remain selected in UI
    // but only counselor will be sent to API due to priority logic
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedAdmin("");
    setSelectedManager("");
    setSelectedCounselor("");
    setSelectedEnrollmentType("");
    setSelectedFromDate(null);
    setSelectedToDate(null);
    dispatch(clearFilters());
  }, [dispatch]);

  // Memoize pagination change handler
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    dispatch(setPage(model.page));
    dispatch(setPageSize(model.pageSize));
  }, [dispatch]);

  // Memoize sort change handler
  const handleSortModelChange = useCallback((model: GridSortModel) => {
    if (model.length > 0) {
      const sortModel = model[0];
      dispatch(setSort({
        sortBy: sortModel.field,
        asc: sortModel.sort === "asc",
      }));
    } else {
      // Reset to default if no sort
      dispatch(setSort({ sortBy: "name", asc: true }));
    }
  }, [dispatch]);

  // Memoize sortModel array for DataGrid
  const dataGridSortModel = useMemo<GridSortModel>(() => [
    {
      field: sort.sortBy || "name",
      sort: sort.asc ? "asc" : "desc",
    },
  ], [sort.sortBy, sort.asc]);

  // Memoize header style
  const headerStyle = useMemo(() => ({
    color: COLORS.textDark,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
  }), []);

  // Render cell for comma-separated names with tooltip
  const renderCommaSeparatedNamesCell = useCallback((
    params: GridRenderCellParams<TeamOverviewItem>,
    maxLength: number = 30
  ) => {
    const value = params.value || "";
    if (!value) {
      return (
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          -
        </span>
      );
    }

    // Apply titlecase to each name
    const names = value.split(",").map((name: string) => toTitleCase(name.trim())).join(", ");
    const displayValue = names.length > maxLength ? `${names.substring(0, maxLength)}...` : names;

    return (
      <Tooltip title={names} arrow placement="top">
        <span
          className="text-sm truncate cursor-default"
          style={{ color: COLORS.textDark }}
        >
          {displayValue}
        </span>
      </Tooltip>
    );
  }, []);

  // Render name cell with titlecase and tooltip
  const renderNameCell = useCallback((params: GridRenderCellParams<TeamOverviewItem>) => {
    const value = params.value || "";
    if (!value) {
      return (
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          -
        </span>
      );
    }
    const titleCaseValue = toTitleCase(value);
    return (
      <Tooltip title={titleCaseValue} arrow placement="top">
        <span className="text-sm font-medium truncate cursor-default" style={{ color: COLORS.textDark }}>
          {titleCaseValue}
        </span>
      </Tooltip>
    );
  }, []);

  // Render role cell with titlecase
  const renderRoleCell = useCallback((params: GridRenderCellParams<TeamOverviewItem>) => {
    const value = params.value || "";
    if (!value) {
      return (
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          -
        </span>
      );
    }
    const titleCaseValue = toTitleCase(value);
    return (
      <Tooltip title={titleCaseValue} arrow placement="top">
        <span className="text-sm truncate cursor-default" style={{ color: COLORS.textDark }}>
          {titleCaseValue}
        </span>
      </Tooltip>
    );
  }, []);

  // Render numeric cell with tooltip
  const renderNumericCell = useCallback((params: GridRenderCellParams<TeamOverviewItem>) => {
    const value = params.value?.toString() || "0";
    return (
      <Tooltip title={value} arrow placement="top">
        <span className="text-sm cursor-default" style={{ color: COLORS.textDark }}>
          {value}
        </span>
      </Tooltip>
    );
  }, []);

  // Determine which columns to hide based on logged-in user's role
  const shouldHideReportingAdmins = useMemo(() => {
    if (!user) return false;
    const userRole = (user.role || "").toUpperCase().trim();
    const isPrimaryAdmin = user.isPrimaryAdmin === true || userRole === "PRIMARY_ADMIN";
    // Hide Reporting Admins for ADMIN (but not PRIMARY_ADMIN) and MANAGER
    return (userRole === "ADMIN" && !isPrimaryAdmin) || userRole === "MANAGER" || userRole === "COUNSELOR" || userRole === "COUNSELLOR";
  }, [user]);

  const shouldHideReportingManagers = useMemo(() => {
    if (!user) return false;
    const userRole = (user.role || "").toUpperCase().trim();
    // Hide Reporting Managers for MANAGER and COUNSELOR
    return userRole === "MANAGER" || userRole === "COUNSELOR" || userRole === "COUNSELLOR";
  }, [user]);

  // Table columns with translations
  const columns: GridColDef[] = useMemo(() => {
    const allColumns: GridColDef[] = [
      {
        field: "name",
        headerName: t("reportAnalysis.teamOverview.tableName", "Name"),
        flex: 1,
        minWidth: 150,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: renderNameCell,
      },
      {
        field: "role",
        headerName: t("reportAnalysis.teamOverview.tableRole", "Role"),
        flex: 1,
        minWidth: 120,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: renderRoleCell,
      },
      {
        field: "reportingAdmins",
        headerName: t("reportAnalysis.teamOverview.tableReportingAdmins", "Reporting Admins"),
        flex: 1,
        minWidth: 180,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => renderCommaSeparatedNamesCell(params, 30),
      },
      {
        field: "reportingManagers",
        headerName: t("reportAnalysis.teamOverview.tableReportingManagers", "Reporting Managers"),
        flex: 1,
        minWidth: 180,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => renderCommaSeparatedNamesCell(params, 30),
      },
      {
        field: "reportingCounselors",
        headerName: t("reportAnalysis.teamOverview.tableReportingCounselors", "Reporting Counselors"),
        flex: 1,
        minWidth: 180,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => renderCommaSeparatedNamesCell(params, 30),
      },
      {
        field: "country",
        headerName: t("reportAnalysis.teamOverview.tableCountry", "Country"),
        flex: 1,
        minWidth: 120,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => renderCommaSeparatedNamesCell(params, 30),
      },
      {
        field: "totalApplicants",
        headerName: t("reportAnalysis.teamOverview.tableTotalApplicants", "Total Applications"),
        flex: 1,
        minWidth: 150,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: renderNumericCell,
      },
      {
        field: "leads",
        headerName: t("reportAnalysis.teamOverview.tableLeads", "Leads"),
        flex: 1,
        minWidth: 100,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: renderNumericCell,
      },
      {
        field: "inProgressApplicants",
        headerName: t("reportAnalysis.teamOverview.tableInProgressApplications", "In Progress Applications"),
        flex: 1,
        minWidth: 200,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: renderNumericCell,
      },
      {
        field: "enrolledApplicants",
        headerName: t("reportAnalysis.teamOverview.tableEnrolledApplications", "Enrolled Applications"),
        flex: 1,
        minWidth: 180,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: renderNumericCell,
      },
      {
        field: "rejectedApplicants",
        headerName: t("reportAnalysis.teamOverview.tableRejectedApplications", "Rejected Applications"),
        flex: 1,
        minWidth: 180,
        sortable: true,
        align: "left",
        headerAlign: "left",
        renderCell: renderNumericCell,
      },
    ];

    // Filter out columns based on user role
    return allColumns.filter((column) => {
      if (column.field === "reportingAdmins" && shouldHideReportingAdmins) {
        return false;
      }
      if (column.field === "reportingManagers" && shouldHideReportingManagers) {
        return false;
      }
      return true;
    });
  }, [t, renderNameCell, renderRoleCell, renderCommaSeparatedNamesCell, renderNumericCell, shouldHideReportingAdmins, shouldHideReportingManagers]);

  return (
    <div className="space-y-4">
      <style>{`
        .team-overview-table .MuiDataGrid-cell {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
        }
        .team-overview-table .MuiDataGrid-columnHeader {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
        }
      `}</style>
      {/* Header */}
      <div>
        <h2
          className="text-lg font-semibold"
          style={headerStyle}
        >
          {t("reportAnalysis.teamOverview.title", "Team Overview")} ({pagination.totalElements})
        </h2>
      </div>

      {/* Filters */}
      <TeamOverviewFilters
        adminOptions={adminOptions}
        managerOptions={managerOptions}
        counselorOptions={counselorOptions}
        selectedAdmin={selectedAdmin}
        selectedManager={selectedManager}
        selectedCounselor={selectedCounselor}
        selectedEnrollmentType={selectedEnrollmentType}
        selectedFromDate={selectedFromDate}
        selectedToDate={selectedToDate}
        onAdminChange={handleAdminChange}
        onManagerChange={handleManagerChange}
        onCounselorChange={handleCounselorChange}
        onEnrollmentTypeChange={setSelectedEnrollmentType}
        onFromDateChange={setSelectedFromDate}
        onToDateChange={setSelectedToDate}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        userRole={user?.role}
        isPrimaryAdmin={isPrimaryAdmin}
      />

      {/* Team Overview Table */}
      <DataTable
        rows={teamOverviewData}
        columns={columns}
        loading={isLoading}
        pageSize={paginationModel.pageSize}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        paginationMode="server"
        rowCount={pagination.totalElements}
        sortingMode="server"
        sortModel={dataGridSortModel}
        onSortModelChange={handleSortModelChange}
      />
    </div>
  );
};

export default TeamOverview;
