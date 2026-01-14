import { useMemo, useCallback, useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { DataTable, StatusChangePopup, SearchBar, Select, Button } from "../../components";
import { COLORS, ROUTES, typography, enrollmentTypes, statusFilterOptions } from "../../constants";
import { Eye, ToggleStatus } from "../../assets";
import { formatDateValue } from "../../utils/dateUtils";
import { getEnrollmentTypeLabel, cleanContactNumber } from "../../utils/commonUtils";
import { userService } from "../../services";
import type { ApplicantOverviewItem } from "../../services";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import {
  setApplicants,
  setPage,
  setPageSize,
  setSearch,
  setStatusFilter,
  setEnrollmentTypeFilter,
  clearFilters,
  updateApplicantStatus,
} from "../../redux/slices/dashboard/dashboardSlice";
import type { ApplicantOverviewRow } from "../../redux/slices/dashboard/dashboardSlice";
import { handleApiError } from "../../utils";

// Transform API data to table format
const transformApiData = (items: ApplicantOverviewItem[]): ApplicantOverviewRow[] => {
  return items.map((item) => {
    // Parse applicantName to extract name and contact number
    // Format: "Rahul Sharma (+91 9876543210)"
    const nameMatch = item.applicantName.match(/^(.+?)\s*\(([^)]+)\)$/);
    const name = nameMatch ? nameMatch[1].trim() : item.applicantName;
    const rawContactNo = nameMatch ? nameMatch[2].trim() : "";
    const contactNo = cleanContactNumber(rawContactNo);

    return {
      id: item.applicantId,
      applicantId: item.applicantId,
      applicantName: name,
      contactNo: contactNo,
      email: item.email,
      notes: item.notes || "",
      status: item.status === "ACTIVE" ? "Active" : "Inactive",
      enrollmentType: item.enrollmentType,
      createdAt: item.createdAt,
    };
  });
};

const ApplicantOverview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Get dashboard state from Redux
  const { applicants, pagination, filter } = useAppSelector((state) => state.dashboard);

  // Local state for input fields (for controlled inputs with debounce)
  const [searchInput, setSearchInput] = useState(() => filter.search);
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState(() => filter.enrollmentType);
  const [selectedStatus, setSelectedStatus] = useState(() => filter.status);

  // Status change popup state
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
  const [selectedApplicantForStatusChange, setSelectedApplicantForStatusChange] = useState<ApplicantOverviewRow | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Refs
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);
  const lastFetchParamsRef = useRef<string>("");

  // Sync local state when Redux filter changes (e.g., from persist)
  useEffect(() => {
    if (isInitialMount.current) {
      setSearchInput(filter.search);
      setSelectedEnrollmentType(filter.enrollmentType);
      setSelectedStatus(filter.status);
      isInitialMount.current = false;
    }
  }, [filter.search, filter.enrollmentType, filter.status]);

  // Fetch applicant overview data
  useEffect(() => {
    if (!user?.agencyId) return;

    // Create a unique key for current fetch params
    const fetchParamsKey = `${user.agencyId}-${filter.search}-${filter.status}-${filter.enrollmentType}-${pagination.page}-${pagination.size}`;
    
    // Skip if same params as last fetch attempt
    if (lastFetchParamsRef.current === fetchParamsKey) return;
    
    // Mark this params as being fetched BEFORE the async call
    lastFetchParamsRef.current = fetchParamsKey;

    const fetchApplicantOverview = async () => {
      try {
        dispatch(showLoader());

        const response = await userService.getApplicantOverview({
          agencyId: user.agencyId,
          assignedAdminId: null,
          assignedManagerId: null,
          search: filter.search || null,
          status: filter.status || null,
          enrollmentType: filter.enrollmentType || null,
          page: pagination.page,
          size: pagination.size,
        });

        if (response.status === "success" && response.data) {
          // Transform API data to table format
          const transformedApplicants = transformApiData(response.data.content);
          
          dispatch(setApplicants({
            applicants: transformedApplicants,
            totalElements: response.data.totalElements,
            totalPages: response.data.totalPages,
            first: response.data.first,
            last: response.data.last,
          }));
        }
      } catch (error) {
        // Reset params ref on error to allow retry
        lastFetchParamsRef.current = "";
        
        const errorMessage = handleApiError(error);
        dispatch(addToast({ type: "error", message: typeof errorMessage === 'string' ? errorMessage : 'An error occurred' }));
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchApplicantOverview();
  }, [user?.agencyId, filter.search, filter.status, filter.enrollmentType, pagination.page, pagination.size, dispatch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Handle view applicant
  const handleView = useCallback((applicant: ApplicantOverviewRow) => {
    navigate(ROUTES.APPLICANT_DETAIL.replace(":applicantId", applicant.applicantId.toString()), {
      state: { 
        from: "dashboard",
        applicantData: {
          applicantId: applicant.applicantId,
          applicantName: applicant.applicantName,
          email: applicant.email,
          contactNo: applicant.contactNo,
          enrollmentType: applicant.enrollmentType,
          status: applicant.status,
          notes: applicant.notes,
        },
      },
    });
  }, [navigate]);

  // Handle status toggle
  const handleStatusToggle = useCallback((applicant: ApplicantOverviewRow) => {
    setSelectedApplicantForStatusChange(applicant);
    setIsStatusPopupOpen(true);
  }, []);

  // Handle confirm status change
  const handleConfirmStatusChange = useCallback(async () => {
    if (!selectedApplicantForStatusChange) return;

    try {
      setIsChangingStatus(true);
      
      // Call API to update applicant status
      const newStatusValue = selectedApplicantForStatusChange.status === "Active" ? "INACTIVE" : "ACTIVE";
      const response = await userService.updateApplicantStatus(
        { applicantId: selectedApplicantForStatusChange.applicantId },
        {
          applicantId: selectedApplicantForStatusChange.applicantId,
          applicationPrefId: 0, // Not required for status toggle
          applicationStatus: newStatusValue,
          notes: `Status changed to ${newStatusValue}`,
          isMailSendToStudent: false,
        }
      );

      if (response.status === "success") {
        // Update local state based on API response
        const newStatus = response.data.status === "ACTIVE" ? "Active" : "Inactive";
        dispatch(updateApplicantStatus({ id: selectedApplicantForStatusChange.id, status: newStatus }));

        dispatch(addToast({
          type: "success",
          message: t("dashboard.statusUpdateSuccess", "Applicant status updated successfully"),
        }));
      }

      setIsStatusPopupOpen(false);
      setSelectedApplicantForStatusChange(null);
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(addToast({
        type: "error",
        message: typeof errorMessage === "string" ? errorMessage : t("dashboard.statusUpdateError", "Failed to update applicant status"),
      }));
      if (import.meta.env.DEV) {
        console.error("Error changing status:", error);
      }
    } finally {
      setIsChangingStatus(false);
    }
  }, [selectedApplicantForStatusChange, dispatch, t]);

  // Handle cancel status change
  const handleCancelStatusChange = useCallback(() => {
    setIsStatusPopupOpen(false);
    setSelectedApplicantForStatusChange(null);
  }, []);

  // Handle search with debounce - auto-trigger API
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    // Clear previous debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Set new debounce timer (500ms delay)
    searchDebounceRef.current = setTimeout(() => {
      dispatch(setSearch(value));
    }, 500);
  }, [dispatch]);

  // Handle apply filters (for enrollment type and status)
  const handleApplyFilters = useCallback(() => {
    dispatch(setSearch(searchInput));
    dispatch(setStatusFilter(selectedStatus));
    dispatch(setEnrollmentTypeFilter(selectedEnrollmentType));
  }, [dispatch, searchInput, selectedStatus, selectedEnrollmentType]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setSelectedEnrollmentType("");
    setSelectedStatus("");
    dispatch(clearFilters());
  }, [dispatch]);

  // Handle pagination change
  const handlePaginationChange = useCallback((model: GridPaginationModel) => {
    if (model.page !== pagination.page) {
      dispatch(setPage(model.page));
    }
    if (model.pageSize !== pagination.size) {
      dispatch(setPageSize(model.pageSize));
    }
  }, [dispatch, pagination.page, pagination.size]);

  // Pagination model for DataTable
  const paginationModel: GridPaginationModel = useMemo(() => ({
    page: pagination.page,
    pageSize: pagination.size,
  }), [pagination.page, pagination.size]);

  // Enrollment type options with placeholder
  const enrollmentTypeOptionsWithPlaceholder = useMemo(() => {
    return [
      { value: "", label: t("dashboard.selectEnrollmentType", "Select Enrollment Type") },
      ...enrollmentTypes,
    ];
  }, [t]);

  // Status options with All as first option
  const statusOptionsWithAll = useMemo(() => {
    return [
      { value: "", label: t("common.all", "All") },
      ...statusFilterOptions.filter((opt) => opt.value !== "all"),
    ];
  }, [t]);

  // Memoize renderCell functions to prevent recreation
  const renderApplicantNameCell = useCallback((params: GridRenderCellParams<ApplicantOverviewRow>) => (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
        {params.row.applicantName}
      </span>
      <span className="text-xs" style={{ color: COLORS.textMuted }}>
        {params.row.contactNo}
      </span>
    </div>
  ), []);

  const renderEmailCell = useCallback((params: GridRenderCellParams<ApplicantOverviewRow>) => (
    <span
      style={{
        color: COLORS.textDark,
        fontSize: typography.fontSize.small,
      }}
    >
      {params.row.email}
    </span>
  ), []);

  const renderNotesCell = useCallback((params: GridRenderCellParams<ApplicantOverviewRow>) => {
    const notes = params.row.notes;
    const hasNotes = notes && notes.trim().length > 0;
    
    return (
      <Tooltip title={hasNotes ? notes : t("dashboard.noNotes", "No notes")} arrow>
        <span
          style={{
            color: hasNotes ? COLORS.textDark : COLORS.textMuted,
            fontSize: typography.fontSize.small,
            fontStyle: hasNotes ? "normal" : "italic",
          }}
          className="truncate block cursor-default"
        >
          {hasNotes ? notes : t("dashboard.noNotes", "No notes")}
        </span>
      </Tooltip>
    );
  }, [t]);

  const renderStatusCell = useCallback((params: GridRenderCellParams<ApplicantOverviewRow>) => (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: params.row.status === "Active" 
          ? `${COLORS.success}20` 
          : `${COLORS.error}20`,
        color: params.row.status === "Active" 
          ? COLORS.success 
          : COLORS.error,
        fontSize: typography.fontSize.caption,
        fontWeight: typography.fontWeight.medium,
      }}
    >
      {params.row.status}
    </span>
  ), []);

  const renderEnrollmentTypeCell = useCallback((params: GridRenderCellParams<ApplicantOverviewRow>) => (
    <span
      style={{
        color: COLORS.textDark,
        fontSize: typography.fontSize.small,
      }}
    >
      {getEnrollmentTypeLabel(params.row.enrollmentType)}
    </span>
  ), []);

  const renderCreatedDateCell = useCallback((params: GridRenderCellParams<ApplicantOverviewRow>) => (
    <span
      style={{
        color: COLORS.textDark,
        fontSize: typography.fontSize.small,
      }}
    >
      {params.row.createdAt ? formatDateValue(params.row.createdAt) : "-"}
    </span>
  ), []);

  const renderActionsCell = useCallback((params: GridRenderCellParams<ApplicantOverviewRow>) => (
    <div className="flex items-center justify-center gap-3 w-full h-full">
      <Tooltip title={t("dashboard.viewApplicant", "View")} arrow>
        <button
          onClick={() => handleView(params.row)}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{ color: COLORS.accent }}
          aria-label={t("dashboard.viewApplicant", "View")}
        >
          <Eye className="w-5 h-5" />
        </button>
      </Tooltip>
      <Tooltip title={t("dashboard.changeStatus", "Change Status")} arrow>
        <button
          onClick={() => handleStatusToggle(params.row)}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{
            color: params.row.status === "Active" ? COLORS.error : COLORS.success,
          }}
          aria-label={
            params.row.status === "Active"
              ? t("dashboard.deactivate", "Deactivate")
              : t("dashboard.activate", "Activate")
          }
        >
          <ToggleStatus className="w-5 h-5" />
        </button>
      </Tooltip>
    </div>
  ), [t, handleView, handleStatusToggle]);

  // Memoize columns to prevent recreation
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "applicantId",
      headerName: t("dashboard.applicantId", "ID"),
      flex: 0.8,
      minWidth: 120,
      sortable: true,
    },
    {
      field: "applicantName",
      headerName: t("dashboard.applicantName", "Name"),
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      renderCell: renderApplicantNameCell,
    },
    {
      field: "email",
      headerName: t("dashboard.email", "Email"),
      flex: 1.5,
      minWidth: 200,
      sortable: true,
      renderCell: renderEmailCell,
    },
    {
      field: "enrollmentType",
      headerName: t("dashboard.enrollmentType", "Enrollment Type"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderEnrollmentTypeCell,
    },
    {
      field: "notes",
      headerName: t("dashboard.notes", "Notes"),
      flex: 1.5,
      minWidth: 200,
      sortable: false,
      renderCell: renderNotesCell,
    },
    {
      field: "status",
      headerName: t("dashboard.status", "Status"),
      flex: 1,
      minWidth: 120,
      sortable: true,
      renderCell: renderStatusCell,
    },
    {
      field: "createdAt",
      headerName: t("dashboard.createdDate", "Created Date"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderCreatedDateCell,
    },
    {
      field: "actions",
      headerName: t("dashboard.action", "Action"),
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: renderActionsCell,
    },
  ], [t, renderApplicantNameCell, renderEmailCell, renderEnrollmentTypeCell, renderNotesCell, renderStatusCell, renderCreatedDateCell, renderActionsCell]);

  return (
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold"
        style={{
          color: COLORS.textDark,
          fontSize: typography.fontSize.h3,
          fontWeight: typography.fontWeight.semibold,
        }}
      >
        {t("dashboard.applicantOverview", "Applicant Overview")} ({pagination.totalElements})
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-3">
        <style>{`
          /* Override placeholder colors with opacity for applicant overview filters */
          .applicant-overview-filter-placeholder button > span.block.truncate {
            opacity: 0.7 !important;
          }
        `}</style>
        {/* Search Bar */}
        <div className="w-full md:w-56 pt-6">
          <SearchBar
            placeholder={t("dashboard.searchApplicants", "Search By Name, Email Or Contact...")}
            value={searchInput}
            onChange={handleSearchChange}
            tooltip={t("dashboard.searchApplicants", "Search By Name, Email Or Contact...")}
          />
        </div>

        {/* Enrollment Type Filter */}
        <div className="w-full md:w-56 applicant-overview-filter-placeholder">
          <Select
            label={t("dashboard.enrollmentTypeLabel", "Type")}
            options={enrollmentTypeOptionsWithPlaceholder}
            value={selectedEnrollmentType}
            onChange={setSelectedEnrollmentType}
            searchable
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-56 applicant-overview-filter-placeholder">
          <Select
            label={t("dashboard.status", "Status")}
            options={statusOptionsWithAll}
            value={selectedStatus}
            onChange={setSelectedStatus}
            searchable
          />
        </div>

        {/* Apply and Clear Filter Buttons - aligned with inputs */}
        <div className="w-full md:w-auto flex items-end gap-3 pt-6">
          <Button
            variant="accent"
            size="sm"
            rounded
            onClick={handleApplyFilters}
          >
            {t("dashboard.applyFilter", "Apply")}
          </Button>
          <Button
            variant="cancel"
            size="sm"
            rounded
            onClick={handleClearFilters}
          >
            {t("dashboard.clearFilter", "Clear Filter")}
          </Button>
        </div>
      </div>

      <DataTable
        rows={applicants}
        columns={columns}
        pageSize={pagination.size}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationChange}
        paginationMode="server"
        rowCount={pagination.totalElements}
        sortingMode="client"
      />

      {/* Status Change Confirmation Popup */}
      <StatusChangePopup
        isOpen={isStatusPopupOpen}
        item={selectedApplicantForStatusChange}
        isChanging={isChangingStatus}
        onClose={handleCancelStatusChange}
        onConfirm={handleConfirmStatusChange}
        nameKey="applicantName"
      />
    </div>
  );
};

export default memo(ApplicantOverview);
