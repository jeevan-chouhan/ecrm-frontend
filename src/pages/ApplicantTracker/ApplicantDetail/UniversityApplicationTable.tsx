import { useMemo, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { DataTable, Button } from "../../../components";
import { COLORS } from "../../../constants";
import { Edit } from "../../../assets";
import type { UniversityApplication } from "./types";

interface UniversityApplicationTableProps {
  applications: UniversityApplication[];
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onUpdateStatus: (application: UniversityApplication) => void;
  onApply: (application: UniversityApplication) => void;
}

const UniversityApplicationTable = ({
  applications,
  loading,
  paginationModel,
  onPaginationModelChange,
  onUpdateStatus,
  onApply,
}: UniversityApplicationTableProps) => {
  const { t } = useTranslation();

  // Memoize renderCell functions to prevent recreation
  const renderCourseCell = useCallback((params: GridRenderCellParams) => (
    <span style={{ color: COLORS.textDark }}>
      {params.value.length > 20 ? `${params.value.substring(0, 20)}...` : params.value}
    </span>
  ), []);

  const renderAgencyPartnerCell = useCallback((params: GridRenderCellParams) => (
    <span style={{ color: params.value === "-" ? COLORS.textMuted : COLORS.textDark }}>
      {params.value}
    </span>
  ), []);

  const renderStatusCell = useCallback((params: GridRenderCellParams<UniversityApplication>) => {
    const status = params.value.toLowerCase();
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
            onApply(params.row);
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
  }, [onApply]);

  const renderDateCell = useCallback((params: GridRenderCellParams) => (
    <span style={{ color: params.value ? COLORS.textDark : COLORS.textMuted }}>
      {params.value || "-"}
    </span>
  ), []);

  const renderActionsCell = useCallback((params: GridRenderCellParams<UniversityApplication>) => (
    <Tooltip title={t("applicantDetailView.updateApplicationStatus", "Update Application Status")} arrow>
      <button
        onClick={() => onUpdateStatus(params.row)}
        className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
        style={{ color: COLORS.accent }}
        aria-label={t("applicantDetailView.updateApplicationStatus", "Update Application Status")}
      >
        <Edit className="w-5 h-5" />
      </button>
    </Tooltip>
  ), [t, onUpdateStatus]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "no",
      headerName: t("applicantDetailView.no", "No."),
      flex: 0.5,
      minWidth: 60,
      sortable: false,
    },
    {
      field: "university",
      headerName: t("applicantDetailView.university", "University"),
      flex: 1.5,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "country",
      headerName: t("applicantDetailView.country", "Country"),
      flex: 1,
      minWidth: 100,
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
      field: "intake",
      headerName: t("applicantDetailView.intake", "Intake"),
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
      field: "status",
      headerName: t("applicantDetailView.status", "Status"),
      flex: 1.2,
      minWidth: 120,
      sortable: true,
      renderCell: renderStatusCell,
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
      headerName: t("applicantDetailView.lastUpdated", "Last Updated"),
      flex: 1.2,
      minWidth: 120,
      sortable: true,
      renderCell: renderDateCell,
    },
    {
      field: "actions",
      headerName: t("applicantTracker.action", "ACTION"),
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: renderActionsCell,
    },
  ], [t, onApply, onUpdateStatus, renderCourseCell, renderAgencyPartnerCell, renderStatusCell, renderDateCell, renderActionsCell]);

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
        paginationMode="client"
        sortingMode="client"
      />
    </div>
  );
};

export default memo(UniversityApplicationTable);

