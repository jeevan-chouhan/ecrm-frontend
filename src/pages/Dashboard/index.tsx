import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Layout,
  Button,
  Select,
  DateRangePicker,
  Card,
  DataTable,
} from "../../components";
import type { DateRange } from "../../components";
import { COLORS, ROUTES } from "../../constants";

// Mock data for filters
const adminOptions = [
  { value: "", label: "Select Admin" },
  { value: "aron", label: "Aron" },
  { value: "ben", label: "Ben" },
];

const managerOptions = [
  { value: "", label: "Select Manager" },
  { value: "ben", label: "Ben" },
  { value: "john", label: "John" },
];

const counselorOptions = [
  { value: "", label: "Select Counselor" },
  { value: "roger", label: "Roger Fredrick" },
  { value: "sam", label: "Sam Roy" },
];

const enrollmentTypeOptions = [
  { value: "", label: "Select Enrollment type" },
  { value: "walk-in", label: "Walk-in" },
  { value: "referred-to-agency", label: "Referred to Agency Partner" },
  { value: "referred-by-agency", label: "Referred by Agency Partner" },
];

// Mock data for table
const teamOverviewData = [
  {
    id: "01",
    manager: "Ben",
    counselor: "Roger Fredrick",
    country: "Australia",
    totalApplicants: 12,
    leads: 9,
    inProgressApplicants: 3,
    enrolledApplicants: 10,
  },
  {
    id: "02",
    manager: "Ben",
    counselor: "Sam Roy",
    country: "Canada",
    totalApplicants: 8,
    leads: 6,
    inProgressApplicants: 2,
    enrolledApplicants: 10,
  },
  {
    id: "03",
    manager: "John",
    counselor: "Alice Smith",
    country: "UK",
    totalApplicants: 15,
    leads: 10,
    inProgressApplicants: 5,
    enrolledApplicants: 8,
  },
  {
    id: "04",
    manager: "John",
    counselor: "Bob Wilson",
    country: "USA",
    totalApplicants: 20,
    leads: 12,
    inProgressApplicants: 4,
    enrolledApplicants: 12,
  },
];

// Table columns
const columns: GridColDef[] = [
  {
    field: "id",
    headerName: "ID",
    width: 70,
    sortable: true,
  },
  {
    field: "manager",
    headerName: "MANAGER",
    flex: 1,
    minWidth: 120,
    sortable: true,
  },
  {
    field: "counselor",
    headerName: "COUNSELOR",
    flex: 1,
    minWidth: 150,
    sortable: true,
  },
  {
    field: "country",
    headerName: "COUNTRY",
    flex: 1,
    minWidth: 120,
    sortable: true,
  },
  {
    field: "totalApplicants",
    headerName: "TOTAL APPLICANTS",
    flex: 1,
    minWidth: 150,
    sortable: true,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "leads",
    headerName: "LEADS",
    flex: 1,
    minWidth: 100,
    sortable: true,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "inProgressApplicants",
    headerName: "IN PROGRESS APPLICANTS",
    flex: 1,
    minWidth: 200,
    sortable: true,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "enrolledApplicants",
    headerName: "ENROLLED APPLICANTS",
    flex: 1,
    minWidth: 180,
    sortable: true,
    align: "center",
    headerAlign: "center",
  },
];

// Stat Card using common Card component
interface StatItemProps {
  label: string;
  value: string | number;
}

const StatItem = ({ label, value }: StatItemProps) => (
  <Card padding="md" shadow="sm">
    <p
      className="text-xs md:text-sm font-medium mb-1"
      style={{ color: COLORS.textMuted }}
    >
      {label}
    </p>
    <p
      className="text-xl md:text-2xl font-bold"
      style={{ color: COLORS.textDark }}
    >
      {value}
    </p>
  </Card>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Filter states
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    admin: "",
    manager: "",
    counselor: "",
    enrollmentType: "",
    dateRange: { startDate: null, endDate: null } as DateRange,
  });

  // Stats data
  const stats = {
    adminName: "Arthur",
    totalAdmins: 3,
    managers: 3,
    counselors: 6,
    totalApplicants: 150,
    enrolledApplicants: 50,
    countriesServing: 3,
    universitiesServing: 15,
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      admin: selectedAdmin,
      manager: selectedManager,
      counselor: selectedCounselor,
      enrollmentType: selectedEnrollmentType,
      dateRange: selectedDateRange,
    });
  };

  const handleClearFilters = () => {
    setSelectedAdmin("");
    setSelectedManager("");
    setSelectedCounselor("");
    setSelectedEnrollmentType("");
    setSelectedDateRange({ startDate: null, endDate: null });
    setAppliedFilters({
      admin: "",
      manager: "",
      counselor: "",
      enrollmentType: "",
      dateRange: { startDate: null, endDate: null },
    });
  };

  const handleAddApplicant = () => {
    navigate(ROUTES.CREATE_APPLICANT);
  };

  // Filter table data based on applied filters
  const filteredTableData = teamOverviewData.filter((row) => {
    // Filter by manager
    if (appliedFilters.manager && row.manager.toLowerCase() !== appliedFilters.manager.toLowerCase()) {
      return false;
    }
    // Filter by counselor
    if (appliedFilters.counselor) {
      const counselorLabel = counselorOptions.find(opt => opt.value === appliedFilters.counselor)?.label || "";
      if (row.counselor.toLowerCase() !== counselorLabel.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  return (
    <Layout userName="Admin" userRole="Primary Admin">
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Title Row - Dashboard on left, Add Applicant on right */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("dashboard.title", "Dashboard")}
          </h1>
          <Button variant="accent" size="md" rounded onClick={handleAddApplicant}>
            {t("dashboard.addApplicant", "ADD APPLICANT")}
          </Button>
        </div>

        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatItem
            label={t("dashboard.adminName", "Admin Name")}
            value={stats.adminName}
          />
          <StatItem
            label={t("dashboard.totalAdmins", "Total Admins")}
            value={stats.totalAdmins}
          />
          <StatItem
            label={t("dashboard.managers", "Managers")}
            value={stats.managers}
          />
          <StatItem
            label={t("dashboard.counselors", "Counselors")}
            value={stats.counselors}
          />
        </div>

        {/* Stats Cards - Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatItem
            label={t("dashboard.totalApplicants", "Total Applicants")}
            value={stats.totalApplicants}
          />
          <StatItem
            label={t("dashboard.enrolledApplicants", "Enrolled Applicants")}
            value={stats.enrolledApplicants}
          />
          <StatItem
            label={t("dashboard.countriesServing", "Countries Serving")}
            value={stats.countriesServing}
          />
          <StatItem
            label={t("dashboard.universitiesServing", "Universities Serving")}
            value={stats.universitiesServing}
          />
        </div>

        {/* Team Overview Header */}
        <h2
          className="text-lg font-semibold"
          style={{ color: COLORS.textDark }}
        >
          {t("dashboard.teamOverview", "Team Overview")}
        </h2>

        {/* Filters Row - near Team Overview */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Select */}
          <div className="w-40">
            <Select
              options={adminOptions}
              value={selectedAdmin}
              onChange={(value) => setSelectedAdmin(value as string)}
              searchable
            />
          </div>

          {/* Manager Select */}
          <div className="w-40">
            <Select
              options={managerOptions}
              value={selectedManager}
              onChange={(value) => setSelectedManager(value as string)}
              searchable
            />
          </div>

          {/* Counselor Select */}
          <div className="w-44">
            <Select
              options={counselorOptions}
              value={selectedCounselor}
              onChange={(value) => setSelectedCounselor(value as string)}
              searchable
            />
          </div>

          {/* Enrollment Type Select */}
          <div className="w-48">
            <Select
              options={enrollmentTypeOptions}
              value={selectedEnrollmentType}
              onChange={(value) => setSelectedEnrollmentType(value as string)}
              searchable
            />
          </div>

          {/* Date Range Picker */}
          <div className="w-56">
            <DateRangePicker
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              placeholder={t("dashboard.selectDateRange", "Select Date Range")}
            />
          </div>

          {/* Apply Filter Button */}
          <Button variant="accent" size="sm" rounded onClick={handleApplyFilters}>
            {t("dashboard.applyFilter", "Apply")}
          </Button>

          {/* Clear Filter Button */}
          <Button variant="cancel" size="sm" rounded onClick={handleClearFilters}>
            {t("dashboard.clearFilter", "Clear Filter")}
          </Button>
        </div>

        {/* Team Overview Table */}
        <DataTable
          rows={filteredTableData}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[5, 10, 25]}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
