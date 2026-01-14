import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Layout, Input, Button, Popup, DataTable } from "../../components";
import type { GridColDef } from "../../components";
import { COLORS } from "../../constants";
import { Eye } from "../../assets";
import { useLoggedInUserInfo } from "../../hooks";
import { formatDateTime } from "../../utils/dateUtils";

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
    onSubmit: (values, { resetForm }) => {
      const newQuery: Query = {
        id: Date.now().toString(),
        submittedBy: loggedInUser?.displayName || "User",
        submittedByEmail: loggedInUser?.email || "",
        submittedTo: "", // Will be set by backend or can be removed
        subject: values.subject,
        content: values.content,
        createdAt: new Date(),
      };
      
      setQueries((prev) => [newQuery, ...prev]);
      resetForm();
      setIsSubmitModalOpen(false);
    },
  });

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
          {formatDateTime(params.row.createdAt)}
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
            {/* Header Info Section */}
            <div className="space-y-3 mb-6">
              {/* Submitted By */}
              <div>
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {t("supportFeedback.submittedBy", "Submitted By")}:
                </span>
                <p className="font-semibold" style={{ color: COLORS.textDark }}>
                  {selectedQuery.submittedBy} ({selectedQuery.submittedByEmail})
                </p>
              </div>
            </div>

            {/* Timeline Item */}
            <div className="relative pl-6 border-l-2" style={{ borderColor: COLORS.accent }}>
              {/* Purple Bullet */}
              <div 
                className="absolute -left-[9px] top-0 w-4 h-4 rounded-sm"
                style={{ backgroundColor: COLORS.accent }}
              />
              
              <div className="pb-4">
                {/* Subject as Title */}
                <h3 className="font-semibold text-base mb-2" style={{ color: COLORS.textDark }}>
                  {selectedQuery.subject}
                </h3>
                
                {/* Content */}
                <div className="mb-2">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>
                    {t("supportFeedback.content", "Content")}:
                  </span>
                  <p 
                    className="text-sm mt-1" 
                    style={{ 
                      color: COLORS.textDark, 
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {selectedQuery.content}
                  </p>
                </div>
                
                {/* Date and Creator */}
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {formatDateTime(selectedQuery.createdAt)} • {t("supportFeedback.createdBy", "Created by")} {selectedQuery.submittedBy}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 mt-4 border-t" style={{ borderColor: COLORS.border }}>
              <Button
                type="button"
                variant="cancel"
                rounded
                onClick={handleCloseViewModal}
              >
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
