import { useState, useMemo } from "react";
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

  // Filter options with translations
  const adminOptions = useMemo(() => [
    { value: "", label: t("dashboard.selectAdmin", "Select Admin") },
    { value: "aron", label: "Aron" },
    { value: "ben", label: "Ben" },
  ], [t]);

  const managerOptions = useMemo(() => [
    { value: "", label: t("dashboard.selectManager", "Select Manager") },
    { value: "ben", label: "Ben" },
    { value: "john", label: "John" },
  ], [t]);

  const counselorOptions = useMemo(() => [
    { value: "", label: t("dashboard.selectCounselor", "Select Counselor") },
    { value: "roger", label: "Roger Fredrick" },
    { value: "sam", label: "Sam Roy" },
  ], [t]);

  const enrollmentTypeOptions = useMemo(() => [
    { value: "", label: t("dashboard.selectEnrollmentType", "Select Enrollment Type") },
    { value: "walk-in", label: t("enrollmentType.walkIn", "Walk-in") },
    { value: "referred-to-agency", label: t("enrollmentType.referredToAgency", "Referred to Agency Partner") },
    { value: "referred-by-agency", label: t("enrollmentType.referredByAgency", "Referred by Agency Partner") },
  ], [t]);

  // Table columns with translations
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "id",
      headerName: t("dashboard.tableId", "ID"),
      width: 70,
      sortable: true,
    },
    {
      field: "manager",
      headerName: t("dashboard.tableManager", "Manager"),
      flex: 1,
      minWidth: 120,
      sortable: true,
    },
    {
      field: "counselor",
      headerName: t("dashboard.tableCounselor", "Counselor"),
      flex: 1,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "country",
      headerName: t("dashboard.tableCountry", "Country"),
      flex: 1,
      minWidth: 120,
      sortable: true,
    },
    {
      field: "totalApplicants",
      headerName: t("dashboard.tableTotalApplicants", "Total Applicants"),
      flex: 1,
      minWidth: 150,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "leads",
      headerName: t("dashboard.tableLeads", "Leads"),
      flex: 1,
      minWidth: 100,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "inProgressApplicants",
      headerName: t("dashboard.tableInProgressApplicants", "In Progress Applicants"),
      flex: 1,
      minWidth: 200,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "enrolledApplicants",
      headerName: t("dashboard.tableEnrolledApplicants", "Enrolled Applicants"),
      flex: 1,
      minWidth: 180,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
  ], [t]);

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
            {t("dashboard.addApplicant", "Add Applicant")}
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
              label={t("dashboard.adminLabel", "Admin")}
              options={adminOptions}
              value={selectedAdmin}
              onChange={(value) => setSelectedAdmin(value as string)}
              searchable
            />
          </div>

          {/* Manager Select */}
          <div className="w-40">
            <Select
              label={t("dashboard.managerLabel", "Manager")}
              options={managerOptions}
              value={selectedManager}
              onChange={(value) => setSelectedManager(value as string)}
              searchable
            />
          </div>

          {/* Counselor Select */}
          <div className="w-44">
            <Select
              label={t("dashboard.counselorLabel", "Counselor")}
              options={counselorOptions}
              value={selectedCounselor}
              onChange={(value) => setSelectedCounselor(value as string)}
              searchable
            />
          </div>

          {/* Enrollment Type Select */}
          <div className="w-48">
            <Select
              label={t("dashboard.enrollmentTypeLabel", "Enrollment Type")}
              options={enrollmentTypeOptions}
              value={selectedEnrollmentType}
              onChange={(value) => setSelectedEnrollmentType(value as string)}
              searchable
            />
          </div>

          {/* Date Range Picker */}
          <div className="w-56">
            <DateRangePicker
              label={t("dashboard.dateRangeLabel", "Date Range")}
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              placeholder={t("dashboard.selectDateRange", "Select Date Range")}
            />
          </div>

          {/* Filter Buttons - aligned with inputs */}
          <div className="flex items-end gap-3 pt-6">
            <Button variant="accent" size="sm" rounded onClick={handleApplyFilters}>
              {t("dashboard.applyFilter", "Apply")}
            </Button>
            <Button variant="cancel" size="sm" rounded onClick={handleClearFilters}>
              {t("dashboard.clearFilter", "Clear Filter")}
            </Button>
          </div>
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
