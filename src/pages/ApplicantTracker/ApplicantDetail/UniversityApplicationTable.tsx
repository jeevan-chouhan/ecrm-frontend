import { useMemo, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams, GridSortModel } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { DataTable, Button } from "../../../components";
import { COLORS } from "../../../constants";
import { Edit, Calendar } from "../../../assets";
import { getApplicationStatusLabel, getApplicationStageLabel } from "../../../utils";
import type { UniversityApplication } from "./types";

interface UniversityApplicationTableProps {
  applications: UniversityApplication[];
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  onUpdateStatus: (application: UniversityApplication) => void;
  onApply: (application: UniversityApplication) => void;
  onViewStatusHistory: (application: UniversityApplication) => void;
}

const UniversityApplicationTable = ({
  applications,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  onUpdateStatus,
  onApply,
  onViewStatusHistory,
}: UniversityApplicationTableProps) => {
  const { t } = useTranslation();

  // Memoize renderCell functions to prevent recreation
  const renderCourseCell = useCallback((params: GridRenderCellParams) => (
    <span style={{ color: COLORS.textDark }}>
      {params.value.length > 20 ? `${params.value.substring(0, 20)}...` : params.value}
    </span>
  ), []);

  const renderCountryCell = useCallback((params: GridRenderCellParams) => (
    <span style={{ color: params.value === "-" ? COLORS.textMuted : COLORS.textDark }}>
      {params.value || "-"}
    </span>
  ), []);

  const renderCounselorCell = useCallback((params: GridRenderCellParams) => (
    <span style={{ color: params.value === "-" ? COLORS.textMuted : COLORS.textDark }}>
      {params.value || "-"}
    </span>
  ), []);

  const renderAgencyPartnerCell = useCallback((params: GridRenderCellParams) => (
    <span style={{ color: params.value && params.value !== "-" ? COLORS.textDark : COLORS.textMuted }}>
      {params.value || "-"}
    </span>
  ), []);

  const renderStageCell = useCallback((params: GridRenderCellParams<UniversityApplication>) => {
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
    );
  }, []);

  const renderStatusCell = useCallback((params: GridRenderCellParams<UniversityApplication>) => {
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
            onApply(params.row);
          }}
        >
          Apply
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
        {statusLabel}
      </span>
    );
  }, [onApply]);

  const renderDateCell = useCallback((params: GridRenderCellParams) => {
    const dateValue = params.value || "-";
    return (
      <Tooltip title={dateValue} arrow placement="top">
        <span style={{ color: params.value ? COLORS.textDark : COLORS.textMuted }}>
          {dateValue}
        </span>
      </Tooltip>
    );
  }, []);

  const renderActionsCell = useCallback((params: GridRenderCellParams<UniversityApplication>) => (
    <div className="flex items-center gap-2">
      <Tooltip title={t("applicantDetailView.applicationStatusHistory", "Application Status History")} arrow>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewStatusHistory(params.row);
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
            onUpdateStatus(params.row);
          }}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{ color: COLORS.accent }}
          aria-label={t("applicantDetailView.updateApplicationStatus", "Update Application Status")}
        >
          <Edit className="w-5 h-5" />
        </button>
      </Tooltip>
    </div>
  ), [t, onUpdateStatus, onViewStatusHistory]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "no",
      headerName: t("applicantDetailView.no", "No."),
      flex: 0.5,
      minWidth: 60,
      sortable: false,
    },
    {
      field: "country",
      headerName: t("applicantDetailView.country", "Country"),
      flex: 1,
      minWidth: 100,
      sortable: true,
      renderCell: renderCountryCell,
    },
    {
      field: "university",
      headerName: t("applicantDetailView.university", "University"),
      flex: 1.5,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "course",
      headerName: t("applicantDetailView.course", "Course"),
      flex: 1.5,
      minWidth: 150,
      sortable: true,
      renderCell: renderCourseCell,
    },
    {
      field: "applicationStage",
      headerName: t("applicantDetailView.applicationStage", "Application Stage"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderStageCell,
    },
    {
      field: "status",
      headerName: t("applicantDetailView.applicationStatus", "Application Status"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderStatusCell,
    },
    {
      field: "intake",
      headerName: t("applicantDetailView.intakeYear", "Intake Year"),
      flex: 1,
      minWidth: 100,
      sortable: true,
    },
    {
      field: "counselor",
      headerName: t("applicantDetailView.counselor", "Counselor"),
      flex: 1,
      minWidth: 100,
      sortable: true,
      renderCell: renderCounselorCell,
    },
    {
      field: "agencyPartner",
      headerName: t("applicantDetailView.agencyPartner", "Agency Partner"),
      flex: 1.2,
      minWidth: 120,
      sortable: true,
      renderCell: renderAgencyPartnerCell,
    },
    {
      field: "appliedDate",
      headerName: t("applicantDetailView.appliedDate", "Applied Date"),
      flex: 1.2,
      minWidth: 120,
      sortable: true,
      renderCell: renderDateCell,
    },
    {
      field: "lastUpdated",
      headerName: t("applicantDetailView.lastUpdatedDate", "Last Updated Date"),
      flex: 1.2,
      minWidth: 120,
      sortable: true,
      renderCell: renderDateCell,
    },
    {
      field: "actions",
      headerName: t("applicantTracker.action", "Action"),
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: renderActionsCell,
    },
  ], [t, onApply, onUpdateStatus, renderCourseCell, renderCountryCell, renderCounselorCell, renderAgencyPartnerCell, renderStageCell, renderStatusCell, renderDateCell, renderActionsCell]);

  return (
    <div className="space-y-4">
      <h2
        className="text-lg md:text-xl font-semibold"
        style={{ color: COLORS.textDark }}
      >
        {t("applicantDetailView.universityApplicationSummary", "University Application Summary")}
      </h2>

      <DataTable
        rows={applications}
        columns={columns}
        loading={loading}
        pageSize={paginationModel.pageSize}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        paginationMode="server"
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
      />
    </div>
  );
};

export default memo(UniversityApplicationTable);

