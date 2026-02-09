import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Layout, Input, Button, Popup, DataTable } from "../../components";
import type { GridColDef } from "../../components";
import type { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { COLORS } from "../../constants";
import { Eye } from "../../assets";
import { useLoggedInUserInfo } from "../../hooks";
import { formatDateTime } from "../../utils/dateUtils";
import { Tooltip } from "@mui/material";
import { supportService } from "../../services";
import type { SupportQueryItem } from "../../services";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import {
  setQueries,
  setLoading,
  setError,
  setPage,
  setPageSize,
  setSort,
} from "../../redux/slices/supportFeedback/supportFeedbackSlice";

interface QueryFormValues {
  subject: string;
  content: string;
}

const SupportFeedback = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const loggedInUser = useLoggedInUserInfo();

  // Redux state
  const { queries, pagination, sort, isLoading } = useAppSelector((state) => state.supportFeedback);

  // Local state
  const [selectedQuery, setSelectedQuery] = useState<SupportQueryItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Prevent duplicate fetch (e.g. from React Strict Mode double-invoking effects)
  const lastFetchKeyRef = useRef<string | null>(null);

  // Validation schema
  const validationSchema = useMemo(() => Yup.object({
    subject: Yup.string()
      .min(3, t("supportFeedback.subjectMinLength", "Subject must be at least 3 characters"))
      .required(t("validation.required", "This Field Is Required")),
    content: Yup.string()
      .min(10, t("supportFeedback.contentMinLength", "Content must be at least 10 characters"))
      .required(t("validation.required", "This Field Is Required")),
  }), [t]);

  // Form
  const formik = useFormik<QueryFormValues>({
    initialValues: {
      subject: "",
      content: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const agencyId = loggedInUser?.agencyId ?? null;
      const userId = loggedInUser?.userId;

      if (agencyId == null || userId == null) {
        dispatch(addToast({
          type: "error",
          message: t("supportFeedback.missingUserContext", "Unable to raise query: user context is missing."),
        }));
        return;
      }

      dispatch(showLoader());
      try {
        const response = await supportService.raiseSupport(agencyId, userId, {
          subject: values.subject,
          content: values.content,
        });

        if (response.status === "success") {
          resetForm();
          setIsSubmitModalOpen(false);
          dispatch(addToast({
            type: "success",
            message: response.message || t("supportFeedback.queryRaisedSuccess", "Query raised successfully."),
          }));
          // Refetch first page so the new query appears
          try {
            const refetch = await supportService.getMyQueries(userId, {
              page: 0,
              size: pagination.size,
              sortBy: sort.sortBy,
              asc: sort.asc,
            });
            if (refetch.status === "success" && refetch.data) dispatch(setQueries(refetch.data));
          } catch {
            // ignore refetch error
          }
        } else {
          dispatch(addToast({
            type: "error",
            message: response.message || t("supportFeedback.queryRaisedFailed", "Failed to raise query."),
          }));
        }
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
          (error as Error)?.message ||
          t("supportFeedback.queryRaisedFailed", "Failed to raise query.");
        dispatch(addToast({ type: "error", message }));
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  // Handle view (row has queryId, subject, createdAt, respondedAt, lastReply, status)
  const handleView = useCallback((row: { queryId: number; subject: string; createdAt: string; respondedAt: string | null; lastReply: string | null; status: string }) => {
    setSelectedQuery({
      queryId: row.queryId,
      subject: row.subject,
      createdAt: row.createdAt,
      lastRespondedAt: row.respondedAt,
      lastReply: row.lastReply,
      status: row.status,
    });
    setIsViewModalOpen(true);
  }, []);

  // Close view modal
  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setSelectedQuery(null);
  }, []);

  // Open submit modal
  const handleOpenSubmitModal = useCallback(() => {
    formik.resetForm();
    setIsSubmitModalOpen(true);
  }, [formik]);

  // Close submit modal
  const handleCloseSubmitModal = useCallback(() => {
    setIsSubmitModalOpen(false);
    formik.resetForm();
  }, [formik]);

  // Fetch my queries from API
  const fetchMyQueries = useCallback(async () => {
    const userId = loggedInUser?.userId;
    if (userId == null) return;

    dispatch(setLoading(true));
    dispatch(showLoader());
    try {
      const response = await supportService.getMyQueries(userId, {
        page: pagination.page,
        size: pagination.size,
        sortBy: sort.sortBy,
        asc: sort.asc,
      });
      if (response.status === "success" && response.data) {
        dispatch(setQueries(response.data));
      } else {
        dispatch(setError(response.message || "Failed to load queries"));
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (err as Error)?.message
        ?? t("supportFeedback.loadFailed", "Failed to load queries");
      dispatch(setError(message));
      dispatch(addToast({ type: "error", message }));
    } finally {
      dispatch(setLoading(false));
      dispatch(hideLoader());
    }
  }, [loggedInUser?.userId, pagination.page, pagination.size, sort.sortBy, sort.asc, dispatch, t]);

  // Fetch on mount and when pagination/sort or userId changes (guard against double call on refresh/Strict Mode)
  useEffect(() => {
    const userId = loggedInUser?.userId;
    if (userId == null) return;

    const fetchKey = `${userId}-${pagination.page}-${pagination.size}-${sort.sortBy}-${sort.asc}`;
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;

    fetchMyQueries();
  }, [loggedInUser?.userId, fetchMyQueries, pagination.page, pagination.size, sort.sortBy, sort.asc]);

  // Pagination and sort handlers
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    if (model.page !== pagination.page) dispatch(setPage(model.page));
    if (model.pageSize !== pagination.size) dispatch(setPageSize(model.pageSize));
  }, [dispatch, pagination.page, pagination.size]);

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    if (model.length > 0) {
      const { field, sort: sortOrder } = model[0];
      dispatch(setSort({ sortBy: field === "createdAt" ? "createdAt" : field, asc: sortOrder === "asc" }));
    } else {
      dispatch(setSort({ sortBy: "createdAt", asc: false }));
    }
  }, [dispatch]);

  const paginationModel: GridPaginationModel = useMemo(() => ({
    page: pagination.page,
    pageSize: pagination.size,
  }), [pagination.page, pagination.size]);

  const sortModel: GridSortModel = useMemo(() => {
    if (!sort.sortBy) return [];
    return [{ field: sort.sortBy, sort: sort.asc ? "asc" : "desc" }];
  }, [sort.sortBy, sort.asc]);

  // Map API rows to DataTable rows (id required for MUI DataGrid)
  const rows = useMemo(() => queries.map((q) => ({
    id: q.queryId,
    queryId: q.queryId,
    subject: q.subject,
    createdAt: q.createdAt,
    respondedAt: q.lastRespondedAt,
    lastReply: q.lastReply,
    status: q.status,
  })), [queries]);

  // DataTable columns
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "subject",
      headerName: t("supportFeedback.subject", "Subject"),
      flex: 1,
      minWidth: 150,
    },
    {
      field: "createdAt",
      headerName: t("supportFeedback.createdDate", "Created Date"),
      flex: 0.8,
      minWidth: 150,
      renderCell: (params) => {
        const dateValue = formatDateTime(params.row.createdAt);
        return (
          <Tooltip title={dateValue} arrow placement="top">
            <span style={{ color: COLORS.textMuted }}>
              {dateValue}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "respondedAt",
      headerName: t("supportFeedback.respondedDate", "Responded Date"),
      flex: 0.8,
      minWidth: 150,
      renderCell: (params) => {
        const dateValue = params.row.respondedAt
          ? formatDateTime(params.row.respondedAt)
          : "—";
        return (
          <Tooltip title={dateValue} arrow placement="top">
            <span style={{ color: COLORS.textMuted }}>
              {dateValue}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "actions",
      headerName: t("supportFeedback.action", "Action"),
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleView(params.row)}
          title={t("supportFeedback.viewQuery", "View Query")}
        >
          <Eye className="w-5 h-5" style={{ color: COLORS.accent }} />
        </Button>
      ),
    },
  ], [t, handleView]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("supportFeedback.title", "Support & Feedback")}
          </h1>
          <Button
            type="button"
            variant="accent"
            rounded
            onClick={handleOpenSubmitModal}
          >
            {t("supportFeedback.raiseQuery", "Raise Query")}
          </Button>
        </div>

        {/* Sent Queries DataTable */}
        <DataTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          autoHeight
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={pagination.totalElements}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
        />
      </div>

      {/* Submit Query Modal */}
      <Popup
        isOpen={isSubmitModalOpen}
        onClose={handleCloseSubmitModal}
        title={t("supportFeedback.raiseQuery", "Raise Query")}
        size="xl"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Subject */}
          <Input
            label={t("supportFeedback.subject", "Subject")}
            name="subject"
            placeholder={t("supportFeedback.enterSubject", "Enter subject")}
            value={formik.values.subject}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.subject && formik.errors.subject ? formik.errors.subject : undefined}
            fullWidth
          />

          {/* Content */}
          <Input
            inputType="textarea"
            label={t("supportFeedback.content", "Content")}
            name="content"
            placeholder={t("supportFeedback.enterContent", "Enter your query details...")}
            value={formik.values.content}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.content && formik.errors.content ? formik.errors.content : undefined}
            rows={4}
            fullWidth
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="cancel"
              rounded
              onClick={handleCloseSubmitModal}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="accent"
              rounded
              disabled={formik.isSubmitting}
            >
              {t("common.submit", "Submit")}
            </Button>
          </div>
        </form>
      </Popup>

      {/* View Query Modal */}
      <Popup
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title={t("supportFeedback.viewQueryDetails", "Query Details")}
        size="xl"
      >
        {selectedQuery && (
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="relative pl-6 border-l-2" style={{ borderColor: COLORS.accent }}>
              <div
                className="absolute -left-[9px] top-0 w-4 h-4 rounded-sm"
                style={{ backgroundColor: COLORS.accent }}
              />
              <div className="pb-4">
                <h3 className="font-semibold text-base mb-2" style={{ color: COLORS.textDark }}>
                  {selectedQuery.subject}
                </h3>
                <div className="space-y-2 text-sm mb-3">
                  <p style={{ color: COLORS.textMuted }}>
                    {t("supportFeedback.createdDate", "Created Date")}:{" "}
                    <Tooltip title={formatDateTime(selectedQuery.createdAt)} arrow placement="top">
                      <span style={{ color: COLORS.textDark }}>{formatDateTime(selectedQuery.createdAt)}</span>
                    </Tooltip>
                  </p>
                  <p style={{ color: COLORS.textMuted }}>
                    {t("supportFeedback.respondedDate", "Responded Date")}:{" "}
                    <span style={{ color: COLORS.textDark }}>
                      {selectedQuery.lastRespondedAt ? formatDateTime(selectedQuery.lastRespondedAt) : "—"}
                    </span>
                  </p>
                  <p style={{ color: COLORS.textMuted }}>
                    {t("supportFeedback.status", "Status")}:{" "}
                    <span style={{ color: COLORS.textDark }}>{selectedQuery.status}</span>
                  </p>
                </div>
                {selectedQuery.lastReply && (
                  <div className="mb-2">
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>
                      {t("supportFeedback.lastReply", "Last Reply")}:
                    </span>
                    <p className="text-sm mt-1" style={{ color: COLORS.textDark, whiteSpace: "pre-wrap" }}>
                      {selectedQuery.lastReply}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t" style={{ borderColor: COLORS.border }}>
              <Button type="button" variant="cancel" rounded onClick={handleCloseViewModal}>
                {t("common.close", "Close")}
              </Button>
            </div>
          </div>
        )}
      </Popup>
    </Layout>
  );
};

export default SupportFeedback;
