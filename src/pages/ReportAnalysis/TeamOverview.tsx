import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams, GridSortModel } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { DataTable } from "../../components";
import type { SelectOption } from "../../components";
import { COLORS, typography } from "../../constants";
import { toTitleCase } from "../../utils";
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
import type { AdminItem, ManagerItem, CounselorItem, TeamOverviewItemData, TeamOverviewItem } from "../../services";
import { handleApiError } from "../../utils";
import TeamOverviewFilters from "./TeamOverviewFilters";

const TeamOverview = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Get Redux state
  const { teamOverviewData, isLoading, pagination, sort, filter } = useAppSelector(
    (state) => state.teamOverview
  );

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

      // Counselors will be fetched when manager is selected
      setCounselorOptions([]);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch filter options");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isLoadingFilterOptionsRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

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

  // Fetch managers when admin is selected (use selectedAdmin for UI, filter.admin for Redux)
  useEffect(() => {
    const adminToUse = selectedAdmin || filter.admin;
    if (user?.agencyId && adminToUse) {
      fetchManagers(adminToUse);
    } else {
      setManagerOptions([]);
      if (!selectedAdmin) {
        setSelectedManager("");
      }
      setCounselorOptions([]);
      if (!selectedCounselor) {
        setSelectedCounselor("");
      }
    }
  }, [selectedAdmin, filter.admin, user?.agencyId, fetchManagers, selectedCounselor]);

  // Fetch counselors when manager is selected
  useEffect(() => {
    const managerToUse = selectedManager || filter.manager;
    if (user?.agencyId && managerToUse) {
      fetchCounselors(managerToUse);
    } else {
      setCounselorOptions([]);
      if (!selectedManager) {
        setSelectedCounselor("");
      }
    }
  }, [selectedManager, filter.manager, user?.agencyId, fetchCounselors]);

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
    if (!user?.agencyId || !user?.userId) {
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingTeamOverviewRef.current) {
      return;
    }

    isLoadingTeamOverviewRef.current = true;
    dispatch(setLoading(true));
    dispatch(showLoader());

    try {
      // Determine query parameters based on logged-in user role and selected filters
      let assignedAdminId: number | null = null;
      let assignedManagerId: number | null = null;
      let assignedCounselorId: number | null = null;

      // Check if filters are selected (explicitly check for non-empty strings)
      const hasAdminFilter = filter.admin && filter.admin.trim() !== "";
      const hasManagerFilter = filter.manager && filter.manager.trim() !== "";
      const hasCounselorFilter = filter.counselor && filter.counselor.trim() !== "";

      // Always set logged-in user's ID based on their role FIRST (default behavior)
      // This ensures the logged-in user's ID is sent when no filters are selected
      // Handle role comparison case-insensitively and support PRIMARY_ADMIN
      const userRole = (user.role || "").toUpperCase().trim();
      
      // Set logged-in user's ID based on role (this is the default behavior)
      if (userRole === "ADMIN" || userRole === "PRIMARY_ADMIN") {
        assignedAdminId = user.userId;
      } else if (userRole === "MANAGER") {
        assignedManagerId = user.userId;
      } else if (userRole === "COUNSELOR" || userRole === "COUNSELLOR") {
        assignedCounselorId = user.userId;
      }

      // Then apply selected filters (these override the logged-in user's ID if for the same role)
      // or add additional IDs if for different roles
      if (hasAdminFilter) {
        assignedAdminId = parseInt(filter.admin, 10);
      }
      if (hasManagerFilter) {
        assignedManagerId = parseInt(filter.manager, 10);
      }
      if (hasCounselorFilter) {
        assignedCounselorId = parseInt(filter.counselor, 10);
      }

      const response = await userService.getTeamOverview({
        agencyId: user.agencyId,
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
        const mappedData = response.data.content.map(mapApiResponseToTeamOverviewItem);
        
        dispatch(setTeamOverviewData({
          data: mappedData,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          first: response.data.first,
          last: response.data.last,
        }));
      } else {
        throw new Error(response.message || "Failed to fetch team overview");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch team overview");
      dispatch(addToast({ type: "error", message }));
      dispatch(setError(message));
      dispatch(setTeamOverviewData({
        data: [],
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }));
    } finally {
      isLoadingTeamOverviewRef.current = false;
      dispatch(setLoading(false));
      dispatch(hideLoader());
    }
  }, [
    user?.agencyId,
    user?.role,
    user?.userId,
    filter.admin,
    filter.manager,
    filter.counselor,
    filter.enrollmentType,
    filter.fromDate,
    filter.toDate,
    pagination.page,
    pagination.size,
    sort.sortBy,
    sort.asc,
    mapApiResponseToTeamOverviewItem,
    dispatch,
  ]);

  // Fetch team overview data when filters, pagination, or sorting change
  useEffect(() => {
    // Ensure user object is fully loaded (has agencyId, userId, and role) before fetching
    if (user?.agencyId && user?.userId && user?.role) {
      fetchTeamOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.agencyId,
    user?.userId,
    user?.role,
    filter.admin,
    filter.manager,
    filter.counselor,
    filter.enrollmentType,
    filter.fromDate,
    filter.toDate,
    pagination.page,
    pagination.size,
    sort.sortBy,
    sort.asc,
    fetchTeamOverview,
  ]);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    dispatch(applyFilters({
      admin: selectedAdmin,
      manager: selectedManager,
      counselor: selectedCounselor,
      enrollmentType: selectedEnrollmentType,
      fromDate: selectedFromDate?.toISOString() || null,
      toDate: selectedToDate?.toISOString() || null,
    }));
  }, [selectedAdmin, selectedManager, selectedCounselor, selectedEnrollmentType, selectedFromDate, selectedToDate, dispatch]);

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
    return (
      <span className="text-sm" style={{ color: COLORS.textDark }}>
        {toTitleCase(value)}
      </span>
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
      },
      {
        field: "leads",
        headerName: t("reportAnalysis.teamOverview.tableLeads", "Leads"),
        flex: 1,
        minWidth: 100,
        sortable: true,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "inProgressApplicants",
        headerName: t("reportAnalysis.teamOverview.tableInProgressApplications", "In Progress Applications"),
        flex: 1,
        minWidth: 200,
        sortable: true,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "enrolledApplicants",
        headerName: t("reportAnalysis.teamOverview.tableEnrolledApplications", "Enrolled Applications"),
        flex: 1,
        minWidth: 180,
        sortable: true,
        align: "left",
        headerAlign: "left",
      },
      {
        field: "rejectedApplicants",
        headerName: t("reportAnalysis.teamOverview.tableRejectedApplications", "Rejected Applications"),
        flex: 1,
        minWidth: 180,
        sortable: true,
        align: "left",
        headerAlign: "left",
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
  }, [t, renderNameCell, renderRoleCell, renderCommaSeparatedNamesCell, shouldHideReportingAdmins, shouldHideReportingManagers]);

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
        onAdminChange={setSelectedAdmin}
        onManagerChange={setSelectedManager}
        onCounselorChange={setSelectedCounselor}
        onEnrollmentTypeChange={setSelectedEnrollmentType}
        onFromDateChange={setSelectedFromDate}
        onToDateChange={setSelectedToDate}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
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
