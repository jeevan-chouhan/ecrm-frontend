import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import {
  Layout,
  SearchBar,
  DataTable,
  Card,
} from "../../components";
import { COLORS, typography } from "../../constants";
import { getApplicationStatusLabel } from "../../utils";
import MarkApplicantPaidPopup from "./MarkApplicantPaidPopup";

// Interface for Master Ledger data
interface MasterLedgerRow {
  id: string;
  studentName: string;
  contactNumber: string;
  subAgent: string;
  university: string;
  applicationStatus: string;
  documentStatus: "visa_uploaded" | "verified" | "visa_not_uploaded";
  commissionPercentage: number;
  action: "locked" | "pay" | "paid";
}

const MasterLedger = () => {
  const { t } = useTranslation();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Sort state
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "studentName", sort: "asc" },
  ]);

  // Popup state
  const [isMarkPaidPopupOpen, setIsMarkPaidPopupOpen] = useState(false);
  const [selectedRowForPayment, setSelectedRowForPayment] = useState<MasterLedgerRow | null>(null);

  // Mock data - Replace with API call
  const mockData: MasterLedgerRow[] = useMemo(
    () => [
      {
        id: "1",
        studentName: "Alice Johnson",
        contactNumber: "+91 918787878787",
        subAgent: "Global Edu",
        university: "University of Toronto",
        applicationStatus: "Offer",
        documentStatus: "visa_not_uploaded",
        commissionPercentage: 25,
        action: "locked",
      },
      {
        id: "2",
        studentName: "Bob Smith",
        contactNumber: "+91 919172586026",
        subAgent: "Study Abroad Inc.",
        university: "McGill University",
        applicationStatus: "Visa Approved",
        documentStatus: "verified",
        commissionPercentage: 20,
        action: "pay",
      },
      {
        id: "3",
        studentName: "Charlie Brown",
        contactNumber: "+91 910000022222",
        subAgent: "EduPathways",
        university: "University of British Columbia",
        applicationStatus: "Applied",
        documentStatus: "visa_not_uploaded",
        commissionPercentage: 30,
        action: "locked",
      },
      {
        id: "4",
        studentName: "Diana Prince",
        contactNumber: "+91 919898989888",
        subAgent: "Global Edu",
        university: "University of Waterloo",
        applicationStatus: "Visa Approved",
        documentStatus: "visa_uploaded",
        commissionPercentage: 25,
        action: "paid",
      },
      {
        id: "5",
        studentName: "Eve Adams",
        contactNumber: "+91 916453853423",
        subAgent: "Study Abroad Inc.",
        university: "Simon Fraser University",
        applicationStatus: "Visa Rejected",
        documentStatus: "visa_not_uploaded",
        commissionPercentage: 20,
        action: "locked",
      },
      {
        id: "6",
        studentName: "Frank Green",
        contactNumber: "+91 916344581231",
        subAgent: "EduPathways",
        university: "Ryerson University",
        applicationStatus: "Visa Approved",
        documentStatus: "verified",
        commissionPercentage: 15,
        action: "pay",
      },
      {
        id: "7",
        studentName: "Grace Hall",
        contactNumber: "+91 918787878787",
        subAgent: "Global Edu",
        university: "Dalhousie University",
        applicationStatus: "Offer",
        documentStatus: "visa_not_uploaded",
        commissionPercentage: 30,
        action: "locked",
      },
    ],
    []
  );

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockData;
    }

    const query = searchQuery.toLowerCase();
    return mockData.filter(
      (row) =>
        row.studentName.toLowerCase().includes(query) ||
        row.contactNumber.toLowerCase().includes(query) ||
        row.subAgent.toLowerCase().includes(query) ||
        row.university.toLowerCase().includes(query)
    );
  }, [mockData, searchQuery]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalLocked = filteredData.filter(
      (row) => row.action === "locked"
    ).length;
    const totalPaid = filteredData.filter(
      (row) => row.action === "paid"
    ).length;
    const pending = filteredData.filter(
      (row) => row.action === "locked" && row.documentStatus === "visa_not_uploaded"
    ).length;

    return {
      totalLocked,
      totalPaid,
      pending,
    };
  }, [filteredData]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
  }, [paginationModel.pageSize]);

  // Handle pagination change
  const handlePaginationChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((model: GridSortModel) => {
    setSortModel(model);
  }, []);

  // Handle action button click
  const handleActionClick = useCallback((row: MasterLedgerRow) => {
    if (row.action === "pay") {
      setSelectedRowForPayment(row);
      setIsMarkPaidPopupOpen(true);
    }
  }, []);

  // Handle close popup
  const handleCloseMarkPaidPopup = useCallback(() => {
    setIsMarkPaidPopupOpen(false);
    setSelectedRowForPayment(null);
  }, []);

  // Handle confirm payment
  const handleConfirmPayment = useCallback(
    (transactionId: string, paymentDate: Date | null, amount: string) => {
      // TODO: Implement API call to mark applicant as paid
      console.log("Mark as paid:", {
        row: selectedRowForPayment,
        transactionId,
        paymentDate,
        amount,
      });
      // After successful API call, update the row action to "paid"
      // This is a placeholder - replace with actual API integration
    },
    [selectedRowForPayment]
  );

  // Define columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "studentName",
        headerName: t("masterLedger.applicantName", "Applicant Name"),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <div
            className="flex flex-col gap-0.5 py-1 cursor-pointer"
            onClick={() => {
              // TODO: Navigate to student detail page
              console.log("Navigate to:", params.row.id);
            }}
          >
            <span
              style={{
                color: COLORS.textDark,
                fontSize: typography.fontSize.small,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {params.value}
            </span>
            <span
              style={{
                color: COLORS.textMuted,
                fontSize: typography.fontSize.caption,
              }}
            >
              {params.row.contactNumber || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "subAgent",
        headerName: t("masterLedger.agencyPartner", "Agency Partner"),
        flex: 1,
        minWidth: 150,
      },
      {
        field: "university",
        headerName: t("masterLedger.university", "University"),
        flex: 1,
        minWidth: 200,
      },
      {
        field: "applicationStatus",
        headerName: t("masterLedger.applicationStatus", "Application Status"),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          const statusLabel = getApplicationStatusLabel(params.value);
          const isOfferReceived = statusLabel.toLowerCase() === "offer received";
          
          return (
            <span
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: isOfferReceived 
                  ? `${COLORS.success}20` 
                  : `${COLORS.accent}20`,
                color: isOfferReceived 
                  ? COLORS.success 
                  : COLORS.accent,
                fontSize: typography.fontSize.caption,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {statusLabel}
            </span>
          );
        },
      },
      {
        field: "documentStatus",
        headerName: t("masterLedger.documentStatus", "Document Status"),
        flex: 1,
        minWidth: 180,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => {
          const status = params.value as "visa_uploaded" | "verified" | "visa_not_uploaded";
          let statusLabel = "";
          let backgroundColor = "";
          let textColor = "";

          switch (status) {
            case "visa_uploaded":
              statusLabel = t("masterLedger.visaUploaded", "Visa Uploaded");
              backgroundColor = `${COLORS.info}20`;
              textColor = COLORS.info;
              break;
            case "verified":
              statusLabel = t("masterLedger.visaVerified", "Visa Verified");
              backgroundColor = `${COLORS.success}20`;
              textColor = COLORS.success;
              break;
            case "visa_not_uploaded":
              statusLabel = t("masterLedger.visaNotUploaded", "Visa Not Uploaded");
              backgroundColor = `${COLORS.error}20`;
              textColor = COLORS.error;
              break;
            default:
              statusLabel = "-";
              backgroundColor = `${COLORS.textMuted}20`;
              textColor = COLORS.textMuted;
          }

          return (
            <span
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor,
                color: textColor,
                fontSize: typography.fontSize.caption,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {statusLabel}
            </span>
          );
        },
      },
      {
        field: "commissionPercentage",
        headerName: t("masterLedger.commissionPercentage", "Commission %"),
        flex: 1,
        minWidth: 130,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <span style={{ color: COLORS.textDark }}>{params.value}%</span>
        ),
      },
      {
        field: "action",
        headerName: t("masterLedger.action", "Action"),
        flex: 1,
        minWidth: 120,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => {
          const action = params.value as "locked" | "pay" | "paid";
          if (action === "locked") {
            return (
              <span
                className="px-3 py-1 rounded-full inline-block"
                style={{
                  backgroundColor: COLORS.borderLight,
                  color: COLORS.textDark,
                  fontSize: typography.fontSize.caption,
                  fontWeight: typography.fontWeight.medium,
                  lineHeight: "1.5",
                }}
              >
                {t("masterLedger.locked", "Locked")}
              </span>
            );
          } else if (action === "pay") {
            return (
              <button
                className="px-3 py-1 rounded-full transition-colors hover:opacity-90 inline-block"
                style={{
                  backgroundColor: COLORS.accent,
                  color: COLORS.textWhite,
                  fontSize: typography.fontSize.caption,
                  fontWeight: typography.fontWeight.medium,
                  border: "none",
                  cursor: "pointer",
                  lineHeight: "1.5",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(params.row);
                }}
              >
                {t("masterLedger.pay", "Pay")}
              </button>
            );
          } else {
            return (
              <span
                className="px-3 py-1 rounded-full inline-block"
                style={{
                  backgroundColor: COLORS.success,
                  color: COLORS.textWhite,
                  fontSize: typography.fontSize.caption,
                  fontWeight: typography.fontWeight.medium,
                  lineHeight: "1.5",
                }}
              >
                {t("masterLedger.paid", "Paid")}
              </span>
            );
          }
        },
      },
    ],
    [t, handleActionClick]
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1
                style={{
                  color: COLORS.textDark,
                  fontSize: typography.fontSize.h1,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {t("masterLedger.title", "Commission Lock Master Ledger")}
              </h1>
              <p
                style={{
                  color: COLORS.textMuted,
                  fontSize: typography.fontSize.body,
                }}
              >
                {t(
                  "masterLedger.description",
                  "Overview Of All Commission Payouts, With A Focus On Locked Statuses Requiring Visa Document Uploads For Release."
                )}
              </p>
            </div>
            <div className="flex-shrink-0 md:w-auto w-full">
              <SearchBar
                placeholder={t(
                  "masterLedger.searchPlaceholder",
                  "Search By Applicant Name, Agency Partner, Or University..."
                )}
                value={searchQuery}
                onChange={handleSearch}
                onSearch={handleSearch}
                tooltip={t(
                  "masterLedger.searchTooltip",
                  "Search By Applicant Name, Agency Partner, Or University..."
                )}
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="lg">
            <div className="space-y-2">
              <p
                style={{
                  color: COLORS.textMuted,
                  fontSize: typography.fontSize.small,
                }}
              >
                {t(
                  "masterLedger.totalLockedCommissionCount",
                  "Total Locked Commission Count"
                )}
              </p>
              <p
                style={{
                  color: COLORS.error,
                  fontSize: typography.fontSize.h1,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {summaryStats.totalLocked}
              </p>
            </div>
          </Card>

          <Card padding="lg">
            <div className="space-y-2">
              <p
                style={{
                  color: COLORS.textMuted,
                  fontSize: typography.fontSize.small,
                }}
              >
                {t(
                  "masterLedger.totalPaidCommissionCount",
                  "Total Paid Commission Count"
                )}
              </p>
              <p
                style={{
                  color: COLORS.success,
                  fontSize: typography.fontSize.h1,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {summaryStats.totalPaid}
              </p>
            </div>
          </Card>

          <Card padding="lg">
            <div className="space-y-2">
              <p
                style={{
                  color: COLORS.textMuted,
                  fontSize: typography.fontSize.small,
                }}
              >
                {t(
                  "masterLedger.pendingCommissionCount",
                  "Pending Commission Count"
                )}
              </p>
              <p
                style={{
                  color: COLORS.textDark,
                  fontSize: typography.fontSize.h1,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {summaryStats.pending}
              </p>
            </div>
          </Card>
        </div>

        {/* Data Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <DataTable
            rows={filteredData}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationChange}
            sortingMode="client"
            sortModel={sortModel}
            onSortModelChange={handleSortChange}
          />
        </div>

        {/* Mark Applicant Paid Popup */}
        <MarkApplicantPaidPopup
          isOpen={isMarkPaidPopupOpen}
          onClose={handleCloseMarkPaidPopup}
          onConfirm={handleConfirmPayment}
          applicantName={selectedRowForPayment?.studentName}
        />
      </div>
    </Layout>
  );
};

export default MasterLedger;

