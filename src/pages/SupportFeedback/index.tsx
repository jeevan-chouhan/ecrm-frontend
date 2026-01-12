import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Layout, Input, Button, Popup, DataTable } from "../../components";
import type { GridColDef } from "../../components";
import { COLORS } from "../../constants";
import { Eye } from "../../assets";
import { useLoggedInUserInfo } from "../../hooks";

// Types
interface Query {
  id: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedTo: string;
  subject: string;
  content: string;
  createdAt: Date;
}

interface QueryFormValues {
  submittedTo: string;
  subject: string;
  content: string;
}

const SupportFeedback = () => {
  const { t } = useTranslation();
  const loggedInUser = useLoggedInUserInfo();
  
  // State
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Validation schema
  const validationSchema = useMemo(() => Yup.object({
    submittedTo: Yup.string()
      .email(t("validation.invalidEmail", "Please Enter A Valid Email"))
      .required(t("validation.required", "This Field Is Required")),
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
      submittedTo: "",
      subject: "",
      content: "",
    },
    validationSchema,
    onSubmit: (values, { resetForm }) => {
      const newQuery: Query = {
        id: Date.now().toString(),
        submittedBy: loggedInUser?.displayName || "User",
        submittedByEmail: loggedInUser?.email || "",
        submittedTo: values.submittedTo,
        subject: values.subject,
        content: values.content,
        createdAt: new Date(),
      };
      
      setQueries((prev) => [newQuery, ...prev]);
      resetForm();
      setIsSubmitModalOpen(false);
    },
  });

  // Format date
  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Handle view
  const handleView = useCallback((query: Query) => {
    setSelectedQuery(query);
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

  // DataTable columns
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "submittedBy",
      headerName: t("supportFeedback.submittedBy", "Submitted By"),
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <div>
          <div style={{ color: COLORS.textDark, fontWeight: 500 }}>
            {params.row.submittedBy}
          </div>
          <div className="text-xs" style={{ color: COLORS.textMuted }}>
            {params.row.submittedByEmail}
          </div>
        </div>
      ),
    },
    {
      field: "submittedTo",
      headerName: t("supportFeedback.submittedTo", "Submitted To"),
      flex: 1,
      minWidth: 180,
    },
    {
      field: "subject",
      headerName: t("supportFeedback.subject", "Subject"),
      flex: 1,
      minWidth: 150,
    },
    {
      field: "createdAt",
      headerName: t("supportFeedback.date", "Date"),
      flex: 0.8,
      minWidth: 150,
      renderCell: (params) => (
        <span style={{ color: COLORS.textMuted }}>
          {formatDate(params.row.createdAt)}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: t("supportFeedback.action", "Action"),
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <button
          type="button"
          onClick={() => handleView(params.row)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={t("supportFeedback.viewQuery", "View Query")}
        >
          <Eye className="w-5 h-5" style={{ color: COLORS.accent }} />
        </button>
      ),
    },
  ], [t, formatDate, handleView]);

  return (
    <Layout userName="Admin" userRole="Primary Admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("supportFeedback.title", "Support & Feedback")}
          </h1>
          <button
            type="button"
            onClick={handleOpenSubmitModal}
            className="px-8 py-3 text-sm font-medium rounded-full transition-colors hover:opacity-90"
            style={{
              backgroundColor: COLORS.accent,
              color: COLORS.textWhite,
            }}
          >
            {t("supportFeedback.addQuery", "Add Query")}
          </button>
        </div>

        {/* Sent Queries DataTable */}
        <DataTable
          rows={queries}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          autoHeight
        />
      </div>

      {/* Submit Query Modal */}
      <Popup
        isOpen={isSubmitModalOpen}
        onClose={handleCloseSubmitModal}
        title={t("supportFeedback.addQuery", "Add Query")}
        size="xl"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Submitted By - Read Only */}
            <Input
              label={t("supportFeedback.submittedBy", "Submitted By")}
              value={`${loggedInUser?.displayName || "User"} (${loggedInUser?.email || ""})`}
              disabled
              fullWidth
            />

            {/* Submitted To */}
            <Input
              label={t("supportFeedback.submittedTo", "Submitted To")}
              name="submittedTo"
              type="email"
              placeholder={t("supportFeedback.enterEmail", "Enter email address")}
              value={formik.values.submittedTo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.submittedTo && formik.errors.submittedTo ? formik.errors.submittedTo : undefined}
              fullWidth
            />
          </div>

          {/* Subject - Changed to Input */}
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
              {t("common.save", "Save")}
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
          <div className="space-y-4">
            {/* Submitted By */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
                {t("supportFeedback.submittedBy", "Submitted By")}
              </label>
              <p className="text-sm" style={{ color: COLORS.textDark }}>
                {selectedQuery.submittedBy} ({selectedQuery.submittedByEmail})
              </p>
            </div>

            {/* Submitted To */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
                {t("supportFeedback.submittedTo", "Submitted To")}
              </label>
              <p className="text-sm" style={{ color: COLORS.textDark }}>
                {selectedQuery.submittedTo}
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
                {t("supportFeedback.subject", "Subject")}
              </label>
              <p className="text-sm" style={{ color: COLORS.textDark }}>
                {selectedQuery.subject}
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
                {t("supportFeedback.content", "Content")}
              </label>
              <p 
                className="text-sm" 
                style={{ 
                  color: COLORS.textDark, 
                  whiteSpace: "pre-wrap"
                }}
              >
                {selectedQuery.content}
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textMuted }}>
                {t("supportFeedback.submittedOn", "Submitted On")}
              </label>
              <p className="text-sm" style={{ color: COLORS.textDark }}>
                {formatDate(selectedQuery.createdAt)}
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: COLORS.accent,
                  color: COLORS.textWhite,
                }}
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        )}
      </Popup>
    </Layout>
  );
};

export default SupportFeedback;
