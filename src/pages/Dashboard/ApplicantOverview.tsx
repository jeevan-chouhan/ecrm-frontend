import { useMemo, useCallback, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { DataTable, StatusChangePopup, SearchBar, Select, Button } from "../../components";
import { COLORS, ROUTES, typography, enrollmentTypes, statusFilterOptions } from "../../constants";
import { Eye, ToggleStatus } from "../../assets";
import { formatDateValue } from "../../utils/dateUtils";
import { getEnrollmentTypeLabel } from "../../utils/commonUtils";
import { mockApplicantOverviewData, type ApplicantOverviewItem } from "../../constants/mockData";

interface ApplicantOverviewProps {
  applicants?: ApplicantOverviewItem[];
  loading?: boolean;
  totalCount?: number; // Total count from API response
}

const ApplicantOverview = ({ 
  applicants = mockApplicantOverviewData, 
  loading = false,
}: ApplicantOverviewProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Search and filter states (selected - what user is choosing)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Applied filter states (what's actually being used for filtering)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedEnrollmentType, setAppliedEnrollmentType] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");

  // Pagination state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Calculate if we need internal scrolling (more than 10 records per page)
  const needsInternalScrolling = paginationModel.pageSize > 10;

  // Filter applicants based on applied search and filters
  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      // Search filter (name and contact number)
      if (appliedSearchQuery) {
        const searchLower = appliedSearchQuery.toLowerCase();
        const matchesSearch =
          applicant.applicantName.toLowerCase().includes(searchLower) ||
          applicant.contactNo.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Enrollment type filter
      if (appliedEnrollmentType && applicant.enrollmentType !== appliedEnrollmentType) {
        return false;
      }

      // Status filter
      if (appliedStatus) {
        const applicantStatusLower = applicant.status.toLowerCase();
        if (applicantStatusLower !== appliedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [applicants, appliedSearchQuery, appliedEnrollmentType, appliedStatus]);

  // Calculate display count - always show filtered count (not total count)
  const displayCount = filteredApplicants.length;

  // Status change popup state
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
  const [selectedApplicantForStatusChange, setSelectedApplicantForStatusChange] = useState<ApplicantOverviewItem | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Handle view applicant
  const handleView = useCallback((applicantId: string) => {
    navigate(ROUTES.APPLICANT_DETAIL.replace(":applicantId", applicantId), {
      state: { from: "dashboard" },
    });
  }, [navigate]);

  // Handle status toggle
  const handleStatusToggle = useCallback((applicant: ApplicantOverviewItem) => {
    setSelectedApplicantForStatusChange(applicant);
    setIsStatusPopupOpen(true);
  }, []);

  // Handle confirm status change
  const handleConfirmStatusChange = useCallback(async () => {
    if (!selectedApplicantForStatusChange) return;

    try {
      setIsChangingStatus(true);
      // const newStatus = selectedApplicantForStatusChange.status === "Active" ? "Inactive" : "Active";

      // TODO: Make API call to update status
      // await updateApplicantStatus(selectedApplicantForStatusChange.id, newStatus);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update local state (will be replaced with API refetch)
      // In production, refetch data from API after status change

      setIsStatusPopupOpen(false);
      setSelectedApplicantForStatusChange(null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error changing status:", error);
      }
    } finally {
      setIsChangingStatus(false);
    }
  }, [selectedApplicantForStatusChange]);

  // Handle cancel status change
  const handleCancelStatusChange = useCallback(() => {
    setIsStatusPopupOpen(false);
    setSelectedApplicantForStatusChange(null);
  }, []);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    setAppliedSearchQuery(searchQuery);
    setAppliedEnrollmentType(selectedEnrollmentType);
    setAppliedStatus(selectedStatus);
    setPaginationModel((prev) => ({ page: 0, pageSize: prev.pageSize }));
  }, [searchQuery, selectedEnrollmentType, selectedStatus]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedEnrollmentType("");
    setSelectedStatus("");
    setAppliedSearchQuery("");
    setAppliedEnrollmentType("");
    setAppliedStatus("");
    setPaginationModel((prev) => ({ page: 0, pageSize: prev.pageSize }));
  }, []);

  // Enrollment type options with placeholder
  const enrollmentTypeOptionsWithPlaceholder = useMemo(() => {
    return [
      { value: "", label: t("dashboard.selectEnrollmentType", "Select Enrollment Type") },
      ...enrollmentTypes,
    ];
  }, [t]);

  // Status options with placeholder
  const statusOptionsWithPlaceholder = useMemo(() => {
    return [
      { value: "", label: t("dashboard.selectStatus", "Select Status") },
      ...statusFilterOptions.filter((opt) => opt.value !== "all"),
    ];
  }, [t]);

  // Memoize renderCell functions to prevent recreation
  const renderApplicantNameCell = useCallback((params: GridRenderCellParams<ApplicantOverviewItem>) => (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
        {params.row.applicantName}
      </span>
      <span className="text-xs" style={{ color: COLORS.textMuted }}>
        {params.row.contactNo}
      </span>
    </div>
  ), []);

  const renderEmailCell = useCallback((params: GridRenderCellParams<ApplicantOverviewItem>) => (
    <span
      style={{
        color: COLORS.textDark,
        fontSize: typography.fontSize.small,
      }}
    >
      {params.row.email}
    </span>
  ), []);

  const renderNotesCell = useCallback((params: GridRenderCellParams<ApplicantOverviewItem>) => (
    <span
      style={{
        color: COLORS.textDark,
        fontSize: typography.fontSize.small,
      }}
      className="truncate block"
      title={params.row.notes}
    >
      {params.row.notes || "-"}
    </span>
  ), []);

  const renderStatusCell = useCallback((params: GridRenderCellParams<ApplicantOverviewItem>) => (
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

  const renderEnrollmentTypeCell = useCallback((params: GridRenderCellParams<ApplicantOverviewItem>) => (
    <span
      style={{
        color: COLORS.textDark,
        fontSize: typography.fontSize.small,
      }}
    >
      {getEnrollmentTypeLabel(params.row.enrollmentType)}
    </span>
  ), []);

  const renderCreatedDateCell = useCallback((params: GridRenderCellParams<ApplicantOverviewItem>) => (
    <span
      style={{
        color: COLORS.textDark,
        fontSize: typography.fontSize.small,
      }}
    >
      {params.row.createdAt ? formatDateValue(params.row.createdAt) : "-"}
    </span>
  ), []);

  const renderActionsCell = useCallback((params: GridRenderCellParams<ApplicantOverviewItem>) => (
    <div className="flex items-center gap-3">
      <Tooltip title={t("dashboard.viewApplicant", "View")} arrow>
        <button
          onClick={() => handleView(params.row.applicantId)}
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
        {t("dashboard.applicantOverview", "Applicant Overview")} ({displayCount})
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-end gap-3">
        <style>{`
          /* Override placeholder colors with opacity for applicant overview filters */
          .applicant-overview-filter-placeholder button > span.block.truncate {
            opacity: 0.7 !important;
          }
        `}</style>
        {/* Search Bar */}
        <div className="w-56 pt-6">
          <SearchBar
            placeholder={t("dashboard.searchApplicants", "Search By Name, Email Or Contact...")}
            value={searchQuery}
            onChange={handleSearch}
            tooltip={t("dashboard.searchApplicants", "Search By Name, Email Or Contact...")}
          />
        </div>

        {/* Enrollment Type Filter */}
        <div className="w-56 applicant-overview-filter-placeholder">
          <Select
            label={t("dashboard.enrollmentTypeLabel", "Type")}
            options={enrollmentTypeOptionsWithPlaceholder}
            value={selectedEnrollmentType}
            onChange={setSelectedEnrollmentType}
            searchable
          />
        </div>

        {/* Status Filter */}
        <div className="w-56 applicant-overview-filter-placeholder">
          <Select
            label={t("dashboard.status", "Status")}
            options={statusOptionsWithPlaceholder}
            value={selectedStatus}
            onChange={setSelectedStatus}
            searchable
          />
        </div>

        {/* Apply and Clear Filter Buttons - aligned with inputs */}
        <div className="flex items-end gap-3 pt-6">
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
        rows={filteredApplicants}
        columns={columns}
        loading={loading}
        pageSize={paginationModel.pageSize}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        paginationMode="client"
        sortingMode="client"
        height={needsInternalScrolling ? 600 : undefined}
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

