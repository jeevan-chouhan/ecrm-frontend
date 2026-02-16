import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Layout, Button, Popup, DataTable } from "../../components";
import type { GridColDef } from "../../components";
import ReplySection from "./ReplySection";
import RaiseQuery from "./RaiseQuery";
import type { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { COLORS } from "../../constants";
import { Reply, Calendar } from "../../assets";
import { useLoggedInUserInfo } from "../../hooks";
import { formatDateTime } from "../../utils/dateUtils";
import { Tooltip } from "@mui/material";
import { supportService } from "../../services";
import type { SupportReplyItem } from "../../services";
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
  const { queries, pagination, sort } = useAppSelector((state) => state.supportFeedback);

  // Local state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  // Replies modal (when clicking reply icon)
  const [replies, setReplies] = useState<SupportReplyItem[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesPage, setRepliesPage] = useState(0);
  const [repliesSize] = useState(10);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [repliesModalOpen, setRepliesModalOpen] = useState(false);
  const [repliesQueryId, setRepliesQueryId] = useState<number | null>(null);
  const [repliesSubject, setRepliesSubject] = useState("");
  const [repliesCreatedAt, setRepliesCreatedAt] = useState("");
  const [repliesDescription, setRepliesDescription] = useState("");
  const [replyInput, setReplyInput] = useState("");

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

  // Open replies modal and fetch replies for the query
  const handleReply = useCallback((row: { queryId: number; subject: string; createdAt?: string; description?: string }) => {
    setRepliesQueryId(row.queryId);
    setRepliesSubject(row.subject);
    setRepliesCreatedAt(row.createdAt ?? "");
    setRepliesDescription(row.description ?? "");
    setReplyInput("");
    setRepliesModalOpen(true);
    setRepliesPage(0);
    setReplies([]);
  }, []);

  // Fetch replies when replies modal is open and queryId is set
  const fetchReplies = useCallback(async () => {
    if (repliesQueryId == null) return;
    setRepliesLoading(true);
    try {
      const response = await supportService.getReplies(repliesQueryId, repliesPage, repliesSize);
      if (response.status === "success" && response.data) {
        setReplies(response.data.content);
        setRepliesTotal(response.data.totalElements);
      } else {
        setReplies([]);
        setRepliesTotal(0);
      }
    } catch (err) {
      setReplies([]);
      setRepliesTotal(0);
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (err as Error)?.message
        ?? t("supportFeedback.repliesLoadFailed", "Failed to load replies");
      dispatch(addToast({ type: "error", message }));
    } finally {
      setRepliesLoading(false);
    }
  }, [repliesQueryId, repliesPage, repliesSize, dispatch, t]);

  useEffect(() => {
    if (repliesModalOpen && repliesQueryId != null) {
      fetchReplies();
    }
  }, [repliesModalOpen, repliesQueryId, repliesPage, fetchReplies]);

  // Close replies modal
  const handleCloseRepliesModal = useCallback(() => {
    setRepliesModalOpen(false);
    setRepliesQueryId(null);
    setRepliesSubject("");
    setRepliesCreatedAt("");
    setRepliesDescription("");
    setReplyInput("");
    setReplies([]);
    setRepliesTotal(0);
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
    description: q.description,
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
          onClick={() => handleReply(params.row)}
          title={t("supportFeedback.viewReplies", "View Replies")}
        >
          <Reply className="w-5 h-5" style={{ color: COLORS.accent }} />
        </Button>
      ),
    },
  ], [t, handleReply]);

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

      <RaiseQuery
        isOpen={isSubmitModalOpen}
        onClose={handleCloseSubmitModal}
        formik={formik}
      />

      {/* Replies Modal (opened when clicking reply icon) - UI matches design: subject + description card, reply list with avatars, reply input */}
      <Popup
        isOpen={repliesModalOpen}
        onClose={handleCloseRepliesModal}
        title={t("supportFeedback.replies", "Replies")}
        size="xl"
      >
        <div className="max-h-[75vh] flex flex-col gap-6">
          {/* Original issue card: Subject, Submitted on date, Description */}
          <div
            className="rounded-lg p-4 border"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
          >
            <h3 className="font-semibold text-base mb-2" style={{ color: COLORS.textDark }}>
              {repliesSubject || "—"}
            </h3>
            {repliesCreatedAt && (
              <div className="flex items-center gap-2 mb-3" style={{ color: COLORS.textMuted }}>
                <Calendar className="w-3 h-3 shrink-0" style={{ color: COLORS.textMuted }} />
                <span className="text-xs">
                  {t("supportFeedback.submittedOn", "Submitted on")} {formatDateTime(repliesCreatedAt)}
                </span>
              </div>
            )}
            {(repliesDescription != null && repliesDescription !== "") ? (
              <p className="text-sm" style={{ color: COLORS.textDark, whiteSpace: "pre-wrap" }}>
                {repliesDescription}
              </p>
            ) : (
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("supportFeedback.noDescription", "No description provided.")}
              </p>
            )}
          </div>

          {/* Reply section: heading, list / empty / loading, and reply input (ReplySection component) */}
          <ReplySection
            title={t("supportFeedback.reply", "Reply")}
            emptyMessage={t("supportFeedback.noReplies", "No replies yet.")}
            isLoading={repliesLoading}
            loadingMessage={t("supportFeedback.loadingReplies", "Loading replies...")}
            value={replyInput}
            onChange={setReplyInput}
            onSubmit={() => {
              // TODO: wire to POST reply API when available
              setReplyInput("");
            }}
            placeholder={t("supportFeedback.typeReplyPlaceholder", "Type your reply here....")}
            submitLabel={t("supportFeedback.replyToResponse", "Reply to Response")}
            rows={4}
          >
            {replies.length > 0 ? (
              <>
                <div className="space-y-4">
                  {replies.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg p-4 border flex gap-3"
                      style={{
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.surface,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold"
                        style={{
                          backgroundColor: item.replyByType === "ADMIN" ? COLORS.accentLight : "#E5E7EB",
                          color: item.replyByType === "ADMIN" ? COLORS.accent : COLORS.textDark,
                        }}
                      >
                        {item.replyByType === "USER"
                          ? t("supportFeedback.you", "You").charAt(0)
                          : t("supportFeedback.admin", "Admin").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
                            {item.replyByType === "USER"
                              ? t("supportFeedback.you", "You")
                              : t("supportFeedback.admin", "Admin")}
                          </span>
                          <Tooltip title={formatDateTime(item.repliedAt)} arrow placement="top">
                            <span className="text-xs" style={{ color: COLORS.textMuted }}>
                              {formatDateTime(item.repliedAt)}
                            </span>
                          </Tooltip>
                        </div>
                        <p className="text-sm mt-1" style={{ color: COLORS.textDark, whiteSpace: "pre-wrap" }}>
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {repliesTotal > repliesSize && (
                  <div className="flex items-center justify-between gap-4 pt-2" style={{ borderColor: COLORS.border }}>
                    <span className="text-sm" style={{ color: COLORS.textMuted }}>
                      {t("supportFeedback.repliesCount", "{{count}} of {{total}} replies", {
                        count: replies.length,
                        total: repliesTotal,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={repliesPage <= 0}
                        onClick={() => setRepliesPage((p) => Math.max(0, p - 1))}
                      >
                        {t("common.previous", "Previous")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={repliesPage >= Math.ceil(repliesTotal / repliesSize) - 1}
                        onClick={() => setRepliesPage((p) => p + 1)}
                      >
                        {t("common.next", "Next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : undefined}
          </ReplySection>
        </div>
      </Popup>
    </Layout>
  );
};

export default SupportFeedback;
