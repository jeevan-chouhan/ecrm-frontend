import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import {
  Layout,
  Button,
  DataTable,
  Select,
  Popup,
  SearchBar,
  Chip,
} from "../../components";
import type { GridColDef, GridSortModel } from "../../components";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { Eye, Edit, ToggleStatus, ToggleOn } from "../../assets";
import {
  COLORS,
  ROUTES,
  statusFilterOptions,
  UserRole,
} from "../../constants";
import { userService } from "../../services";
import type { UserListItem, UserListDataWithCounts, PaginatedData } from "../../services";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import {
  setError,
  setMembers,
  setSearch,
  setStatusFilter,
  setSort,
  setPage,
  setPageSize,
  updateMemberStatus,
} from "../../redux/slices/manageTeam/manageTeamSlice";
import { handleApiError, formatStatus } from "../../utils";

const ManageTeam = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showCount , SetShowCount] = useState(0);
  // Get user from Redux (decoded from token)
  const { user } = useAppSelector((state) => state.auth);
  
  // Get manageTeam state from Redux
  const { members, pagination, filter, sort } = useAppSelector((state) => state.manageTeam);
  
  // Local state for search input (for debounce) - sync with persisted filter
  const [searchInput, setSearchInput] = useState(() => filter.search);
   // Stats counts from API
  const [statsCounts, setStatsCounts] = useState({
    totalAdmins: 0,
    totalManagers: 0,
    totalCounselors: 0,
  });

  // Local state for status popup
  const [statusPopup, setStatusPopup] = useState<{
    isOpen: boolean;
    member: UserListItem | null;
  }>({ isOpen: false, member: null });

  // Refs
  const userRef = useRef(user);
  const isLoadingRef = useRef(false);
  const isInitialMount = useRef(true);
  
  // Update userRef when user changes
  userRef.current = user;
  
  // Sync search input with persisted filter on initial mount only
  useEffect(() => {
    if (isInitialMount.current && filter.search) {
      setSearchInput(filter.search);
    }
    isInitialMount.current = false;
  }, [filter.search]);

  /**
   * Fetch team members from API
   */
  const fetchTeamMembers = useCallback(async () => {
    const currentUser = userRef.current;
    
    // Don't fetch if user is not loaded yet or already loading
    if (!currentUser || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    dispatch(showLoader());

    try {
      const response = await userService.getUserList({
        agencyId: currentUser.agencyId ?? null,
        assignedManagerId: currentUser.role === UserRole.MANAGER ? currentUser.userId : null,
        search: filter.search || null,
        status: filter.status || null,
        page: pagination.page,
        size: pagination.size,
        sortBy: sort.sortBy,
        asc: sort.sortBy ? sort.asc : null,
      });

      if (response.status === "success" && response.data) {
        // Check for new response structure with nested page and counts
        if ('page' in response.data && 'counts' in response.data) {
          const dataWithCounts = response.data as UserListDataWithCounts;
          // Set members from page.content
          dispatch(setMembers(dataWithCounts.page));
          SetShowCount(dataWithCounts.page.totalElements);
          // Set stats from counts
          setStatsCounts({
            totalAdmins: dataWithCounts.counts.totalAdmins || 0,
            totalManagers: dataWithCounts.counts.totalManagers || 0,
            totalCounselors: dataWithCounts.counts.totalCounselor || 0,
          });
        } else if ('totalElements' in response.data) {
          // Old response structure with direct PaginatedData
          const paginatedData = response.data as PaginatedData<UserListItem>;
          dispatch(setMembers(paginatedData));
          SetShowCount(paginatedData.totalElements);
        } else {
          // Array response
          dispatch(setMembers(response.data));
        }
      } else {
        dispatch(setError(response.message || "Failed to fetch team members"));
        dispatch(addToast({ type: "error", message: response.message || "Failed to fetch team members" }));
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch team members");
      dispatch(setError(message));
      dispatch(addToast({ type: "error", message }));
    } finally {
      isLoadingRef.current = false;
      dispatch(hideLoader());
    }
  }, [dispatch, filter.search, filter.status, pagination.page, pagination.size, sort.sortBy, sort.asc]);

  // Initial fetch when user is loaded
  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user, fetchTeamMembers]);

  // Handle search with debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filter.search !== searchInput) {
        dispatch(setSearch(searchInput));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filter.search, dispatch]);

  // Memoized handlers
  const handleStatusFilterChange = useCallback((value: string) => {
    dispatch(setStatusFilter(value));
  }, [dispatch]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    dispatch(setSearch(""));
  }, [dispatch]);

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    if (model.length > 0) {
      const { field, sort: sortOrder } = model[0];
      dispatch(setSort({ sortBy: field, asc: sortOrder === "asc" }));
    } else {
      dispatch(setSort({ sortBy: "", asc: true }));
    }
  }, [dispatch]);

  const handleView = useCallback((member: UserListItem) => {
    navigate(`${ROUTES.MANAGE_TEAM}/${member.id}`, { state: { memberData: member } });
  }, [navigate]);

  const handleEdit = useCallback((member: UserListItem) => {
    navigate(`/manage-team/edit/${member.id}`, { state: { memberData: member } });
  }, [navigate]);

  const handleStatusToggle = useCallback((member: UserListItem) => {
    setStatusPopup({ isOpen: true, member });
  }, []);

  const handleAddMember = useCallback(() => {
    navigate(ROUTES.MANAGE_TEAM_ADD);
  }, [navigate]);

  const handleStatusCancel = useCallback(() => {
    setStatusPopup({ isOpen: false, member: null });
  }, []);

  const handleStatusConfirm = useCallback(async () => {
    if (!statusPopup.member) return;
    
    dispatch(showLoader());
    try {
      const response = await userService.updateStatus(statusPopup.member.id);
      if (response.status === "success" && response.data) {
        const newStatus = response.data.status;
        dispatch(updateMemberStatus({ id: statusPopup.member.id, status: newStatus }));
        dispatch(addToast({ type: "success", message: t("manageTeam.statusUpdated", `Status changed to ${formatStatus(newStatus)}`) }));
      }
    } catch (error: unknown) {
      const { message } = handleApiError(error);
      dispatch(addToast({ type: "error", message }));
    } finally {
      dispatch(hideLoader());
      setStatusPopup({ isOpen: false, member: null });
    }
  }, [statusPopup.member, dispatch, t]);

  // Memoized values
  const sortModel: GridSortModel = useMemo(() => 
    sort.sortBy ? [{ field: sort.sortBy, sort: sort.asc ? "asc" : "desc" }] : []
  , [sort.sortBy, sort.asc]);

  // Pagination model for DataTable
  const paginationModel: GridPaginationModel = useMemo(() => ({
    page: pagination.page,
    pageSize: pagination.size,
  }), [pagination.page, pagination.size]);

  // Handle pagination change
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    if (model.page !== pagination.page) {
      dispatch(setPage(model.page));
    }
    if (model.pageSize !== pagination.size) {
      dispatch(setPageSize(model.pageSize));
    }
  }, [dispatch, pagination.page, pagination.size]);

  const statusChangeMessage = useMemo(() => {
    if (!statusPopup.member) return "";
    const isActive = statusPopup.member.status?.toUpperCase() === "ACTIVE";
    return `Are you sure you want to change the status of ${statusPopup.member.name} from ${isActive ? "Active" : "Inactive"} to ${isActive ? "Inactive" : "Active"}?`;
  }, [statusPopup.member]);

  // Memoized DataTable columns
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "name",
      headerName: t("manageTeam.name", "Name"),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <span style={{ color: COLORS.textDark, fontWeight: 500 }}>
          {params.row.name}
        </span>
      ),
    },
    {
      field: "role",
      headerName: t("manageTeam.role", "Role"),
      flex: 0.7,
      minWidth: 100,
    },
    {
      field: "email",
      headerName: t("manageTeam.email", "Email"),
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: "contactNumber",
      headerName: t("manageTeam.contactNo", "Contact No"),
      flex: 0.9,
      minWidth: 150,
      renderCell: (params) => (
        <span style={{ color: COLORS.textDark }}>
          {params.row.countryCode || ""} {params.row.contactNumber || ""}
        </span>
      ),
    },
    {
      field: "status",
      headerName: t("manageTeam.status", "Status"),
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => {
        const status = params.value?.toUpperCase();
        return (
          <Chip
            label={formatStatus(params.value)}
            variant={status === "ACTIVE" ? "success" : status === "INACTIVE" ? "error" : "default"}
            size="sm"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: t("manageTeam.action", "Action"),
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => {
        const isActive = params.row.status?.toUpperCase() === "ACTIVE";
        return (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye className="h-5 w-5" style={{ color: COLORS.accent }} />}
              onClick={(e) => { e.stopPropagation(); handleView(params.row); }}
              title={t("common.view", "View")}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit className="h-5 w-5" style={{ color: COLORS.accent }} />}
              onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}
              title={t("common.edit", "Edit")}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={isActive 
                ? <ToggleOn className="h-5 w-5" style={{ color: COLORS.error }} />
                : <ToggleStatus className="h-5 w-5" style={{ color: COLORS.success }} />
              }
              onClick={(e) => { e.stopPropagation(); handleStatusToggle(params.row); }}
              title={isActive ? t("common.inactive", "Inactive") : t("common.active", "Active")}
            />
          </div>
        );
      },
    },
  ], [t, handleView, handleEdit, handleStatusToggle]);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]">
        {/* Header with Search, Status Filter and Add Member Button */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-6">
          {/* Title with Count */}
          <div className="flex items-center gap-2 shrink-0">
            <h1
              className="text-2xl font-semibold"
              style={{ color: COLORS.textDark }}
            >
              {t("manageTeam.title", "Manage Team")}
            </h1>
            <span
              className="text-lg font-medium"
              style={{ color: COLORS.textMuted }}
            >
              ({showCount})
            </span>
          </div>

          {/* Search, Filter and Add Member */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end">
            {/* Search Bar */}
            <Tooltip title={t("manageTeam.searchTooltip", "Search by Name, Email or Contact Number")} arrow>
              <div className="w-full sm:w-72 md:w-80">
                <SearchBar
                  value={searchInput}
                  onChange={(value) => setSearchInput(value)}
                  onClear={handleClearSearch}
                  placeholder={t("manageTeam.searchPlaceholder", "Search By Name, Email Or Contact...")}
                  debounceMs={0}
                  fullWidth
                />
              </div>
            </Tooltip>

            {/* Status Filter Dropdown */}
            <div className="w-full sm:w-40 md:w-48">
              <Select
                label={t("manageTeam.statusLabel", "Status")}
                options={statusFilterOptions}
                value={filter.status}
                onChange={handleStatusFilterChange}
                placeholder={t("manageTeam.status", "Status")}
                fullWidth
              />
            </div>

            {/* Add Member Button */}
            <div className="w-full sm:w-auto">
              <Button
                variant="accent"
                rounded
                // leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleAddMember}
                className="w-full sm:w-auto whitespace-nowrap"
              >
                {t("manageTeam.addMember", "Add Member")}
              </Button>
            </div>
            
          </div>

          
        </div>

         {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Admins Card */}
          <div
            className="bg-white rounded-lg shadow-sm p-6"
            style={{
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: COLORS.textMuted }}
            >
              {t("manageTeam.totalAdmins", "Total Admins")}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {statsCounts.totalAdmins}
            </p>
          </div>

          {/* Managers Card */}
          <div
            className="bg-white rounded-lg shadow-sm p-6"
            style={{
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: COLORS.textMuted }}
            >
              {t("manageTeam.totalManagers", "Total Managers")}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {statsCounts.totalManagers}
            </p>
          </div>

          {/* Counselors Card */}
          <div
            className="bg-white rounded-lg shadow-sm p-6"
            style={{
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: COLORS.textMuted }}
            >
              {t("manageTeam.totalCounselors", "Total Counselors")}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {statsCounts.totalCounselors}
            </p>
          </div>
        </div>

        {/* Team Members Table */}
        <DataTable
          rows={members}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={pagination.totalElements}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
        />
      </div>


      

      {/* Status Change Confirmation Popup */}
      <Popup
        isOpen={statusPopup.isOpen}
        onClose={handleStatusCancel}
        title={t("manageTeam.confirmStatusChange", "Confirm Status Change")}
        size="sm"
        showCloseButton={true}
      >
        <div>
          <p className="text-base mb-8" style={{ color: COLORS.textDark }}>
            {statusChangeMessage}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="cancel" rounded onClick={handleStatusCancel}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="accent" rounded onClick={handleStatusConfirm}>
              {t("common.confirm", "Confirm")}
            </Button>
          </div>
        </div>
      </Popup>

    </Layout>
  );
};

export default ManageTeam;
