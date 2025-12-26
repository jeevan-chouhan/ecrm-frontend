import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import { Layout, SearchBar, DataTable, Button } from "../../components";
import { Eye } from "../../assets";
import { COLORS } from "../../constants";

// Mock applicants data
interface Applicant {
  id: number;
  applicantId: string;
  name: string;
  passportNo: string;
  enrollmentType: string;
  status: "Active" | "Inactive" | "Pending";
}

const mockApplicants: Applicant[] = [
  {
    id: 1,
    applicantId: "S324",
    name: "Jane Doe",
    passportNo: "PO3625264",
    enrollmentType: "Walk-in",
    status: "Active",
  },
  {
    id: 2,
    applicantId: "S342",
    name: "Rayn",
    passportNo: "PO937437",
    enrollmentType: "Agency Partner - IDP",
    status: "Active",
  },
  {
    id: 3,
    applicantId: "S356",
    name: "John Smith",
    passportNo: "PO4521789",
    enrollmentType: "Walk-in",
    status: "Active",
  },
  {
    id: 4,
    applicantId: "S378",
    name: "Emily Brown",
    passportNo: "PO8734521",
    enrollmentType: "Agency Partner - IDP",
    status: "Pending",
  },
  {
    id: 5,
    applicantId: "S390",
    name: "Michael Johnson",
    passportNo: "PO1234567",
    enrollmentType: "Walk-in",
    status: "Active",
  },
  {
    id: 6,
    applicantId: "S401",
    name: "Sarah Williams",
    passportNo: "PO7654321",
    enrollmentType: "Agency Partner - IDP",
    status: "Active",
  },
  {
    id: 7,
    applicantId: "S412",
    name: "David Lee",
    passportNo: "PO9876543",
    enrollmentType: "Walk-in",
    status: "Inactive",
  },
  {
    id: 8,
    applicantId: "S423",
    name: "Jennifer Garcia",
    passportNo: "PO5432198",
    enrollmentType: "Agency Partner - IDP",
    status: "Active",
  },
  {
    id: 9,
    applicantId: "S434",
    name: "Robert Martinez",
    passportNo: "PO6789012",
    enrollmentType: "Walk-in",
    status: "Pending",
  },
  {
    id: 10,
    applicantId: "S445",
    name: "Lisa Anderson",
    passportNo: "PO3456789",
    enrollmentType: "Agency Partner - IDP",
    status: "Active",
  },
];

const DocumentVault = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter applicants based on search
  const filteredApplicants = mockApplicants.filter(
    (applicant) =>
      applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.applicantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.passportNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDocuments = (applicantId: string) => {
    navigate(`/document-vault/${applicantId}`);
  };

  const columns: GridColDef[] = [
    {
      field: "applicantId",
      headerName: t("documentVault.applicantId", "APPLICANT ID"),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "name",
      headerName: t("documentVault.applicantName", "APPLICANT NAME"),
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <span className="font-medium" style={{ color: COLORS.textDark }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "passportNo",
      headerName: t("documentVault.passportNo", "PASSPORT NO."),
      flex: 1,
      minWidth: 130,
    },
    {
      field: "enrollmentType",
      headerName: t("documentVault.enrollmentType", "ENROLLMENT TYPE"),
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: "status",
      headerName: t("documentVault.status", "STATUS"),
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <span style={{ color: COLORS.textMuted }}>{params.value}</span>
      ),
    },
    {
      field: "actions",
      headerName: t("documentVault.action", "ACTION"),
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="h-4 w-4" style={{color : COLORS.accent}}/>}
          onClick={() => handleViewDocuments(params.row.applicantId)}
          title={t("documentVault.view", "View")}
          rounded
        />
      ),
    },
  ];

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Header with Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Title with Count */}
          <div className="flex items-center gap-2 shrink-0">
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {t("documentVault.title", "Document Vault")}
            </h1>
            {searchQuery && (
              <span
                className="text-lg font-medium"
                style={{ color: COLORS.textMuted }}
              >
                ({filteredApplicants.length})
              </span>
            )}
          </div>
          <div className="w-full md:w-72">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t("documentVault.searchApplicants", "Search applicants ID, name...")}
            />
          </div>
        </div>

        {/* DataTable with Pagination and Sorting */}
        <div>
          <DataTable
            rows={filteredApplicants}
            columns={columns}
            pageSize={10}
            pageSizeOptions={[5, 10, 25]}
          />
        </div>
      </div>
    </Layout>
  );
};

export default DocumentVault;
