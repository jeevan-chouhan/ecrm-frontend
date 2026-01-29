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
  rowCount: number;
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
  rowCount,
  onUpdateStatus,
  onApply,
  onViewStatusHistory,
}: UniversityApplicationTableProps) => {
  const { t } = useTranslation();

  // Memoize renderCell functions to prevent recreation
  const renderCourseCell = useCallback((params: GridRenderCellParams) => {
    const course = params.value || "";
    const displayValue = course.length > 20 ? `${course.substring(0, 20)}...` : course;
    return (
      <Tooltip title={course || "-"} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: COLORS.textDark }}>
          {displayValue}
        </span>
      </Tooltip>
    );
  }, []);

  const renderCountryCell = useCallback((params: GridRenderCellParams) => {
    const country = params.value || "-";
    return (
      <Tooltip title={country} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: params.value === "-" ? COLORS.textMuted : COLORS.textDark }}>
          {country}
        </span>
      </Tooltip>
    );
  }, []);

  const renderCounselorCell = useCallback((params: GridRenderCellParams) => {
    const counselor = params.value || "-";
    return (
      <Tooltip title={counselor} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: params.value === "-" ? COLORS.textMuted : COLORS.textDark }}>
          {counselor}
        </span>
      </Tooltip>
    );
  }, []);

  const renderAgencyPartnerCell = useCallback((params: GridRenderCellParams) => {
    const agencyPartner = params.value || "-";
    return (
      <Tooltip title={agencyPartner} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: params.value && params.value !== "-" ? COLORS.textDark : COLORS.textMuted }}>
          {agencyPartner}
        </span>
      </Tooltip>
    );
  }, []);

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
  }, [onApply]);

  const renderDateCell = useCallback((params: GridRenderCellParams) => {
    const dateValue = params.value || "-";
    return (
      <Tooltip title={dateValue} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: params.value ? COLORS.textDark : COLORS.textMuted }}>
          {dateValue}
        </span>
      </Tooltip>
    );
  }, []);

  // Render No. cell with tooltip
  const renderNoCell = useCallback((params: GridRenderCellParams) => {
    const no = params.value?.toString() || "-";
    return (
      <Tooltip title={no} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: COLORS.textDark }}>
          {no}
        </span>
      </Tooltip>
    );
  }, []);

  // Render University cell with tooltip
  const renderUniversityCell = useCallback((params: GridRenderCellParams) => {
    const university = params.value || "-";
    return (
      <Tooltip title={university} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: params.value ? COLORS.textDark : COLORS.textMuted }}>
          {university}
        </span>
      </Tooltip>
    );
  }, []);

  // Render Intake cell with tooltip
  const renderIntakeCell = useCallback((params: GridRenderCellParams) => {
    const intake = params.value || "-";
    return (
      <Tooltip title={intake} arrow placement="top">
        <span className="truncate block cursor-default" style={{ color: params.value ? COLORS.textDark : COLORS.textMuted }}>
          {intake}
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
      renderCell: renderNoCell,
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
      renderCell: renderUniversityCell,
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
      renderCell: renderIntakeCell,
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
  ], [t, onApply, onUpdateStatus, renderNoCell, renderCourseCell, renderCountryCell, renderUniversityCell, renderIntakeCell, renderCounselorCell, renderAgencyPartnerCell, renderStageCell, renderStatusCell, renderDateCell, renderActionsCell]);

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
        rowCount={rowCount}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
      />
    </div>
  );
};

export default memo(UniversityApplicationTable);

