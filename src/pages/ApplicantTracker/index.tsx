import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import {
  Layout,
  Button,
  SearchBar,
  DataTable,
  StatusChangePopup,
} from "../../components";
import { COLORS, ROUTES } from "../../constants";
import { Plus, Eye, ToggleStatus } from "../../assets";
import { formatDateValue } from "../../utils";
import ApplicantTrackerFilters from "./ApplicantTrackerFilters";

// Mock applicant data
interface Applicant {
  id: string;
  applicantId: string;
  applicantName: string;
  contactNo: string;
  course: string;
  applicantStage: string;
  applicantStatus: string;
  passportNo: string;
  enrollmentType: string;
  notes: string;
  status: "Active" | "Inactive";
  createdAt?: Date | string;
  adminId?: string;
  managerId?: string;
  counselorId?: string;
  intake?: string;
  agencyPartner?: string;
}

const mockApplicants: Applicant[] = [
  {
    id: "1",
    applicantId: "S223",
    applicantName: "Jane Doe",
    contactNo: "+91 9877123462",
    course: "Master - Computers",
    applicantStage: "Lead",
    applicantStatus: "Application Incomplete",
    passportNo: "P0122234",
    enrollmentType: "Referred to Agency Partner",
    notes: "talked about university preference",
    status: "Active",
    createdAt: new Date("2024-01-15"),
    adminId: "arthur",
    managerId: "carlos",
    counselorId: "celina",
    intake: "jan-2026",
    agencyPartner: "apply-board",
  },
  {
    id: "2",
    applicantId: "S224",
    applicantName: "John Smith",
    contactNo: "+91 9877123463",
    course: "Bachelor - Engineering",
    applicantStage: "Application In Progress",
    applicantStatus: "Application Complete",
    passportNo: "P0122235",
    enrollmentType: "Walk-in",
    notes: "Interested in US universities",
    status: "Active",
    createdAt: new Date("2024-02-20"),
    adminId: "arthur",
    managerId: "carlos",
    counselorId: "john",
    intake: "apr-2026",
    agencyPartner: "idp",
  },
  {
    id: "3",
    applicantId: "S225",
    applicantName: "Emily Brown",
    contactNo: "+91 9877123464",
    course: "Master - Business",
    applicantStage: "Application Submitted",
    applicantStatus: "Under Review",
    passportNo: "P0122236",
    enrollmentType: "Referred by Agency Partner",
    notes: "Waiting for offer",
    status: "Active",
    createdAt: new Date("2024-03-10"),
    adminId: "john",
    managerId: "sarah",
    counselorId: "sarah",
    intake: "jul-2026",
    agencyPartner: "study-abroad",
  },
  // Add more mock data as needed
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `${i + 4}`,
    applicantId: `S${226 + i}`,
    applicantName: `Applicant ${i + 4}`,
    contactNo: `+91 9877123${String(465 + i).padStart(3, "0")}`,
    course: ["Master - Computers", "Bachelor - Engineering", "Master - Business"][i % 3],
    applicantStage: ["Lead", "Application In Progress", "Application Submitted", "Offer Received"][i % 4],
    applicantStatus: ["Application Incomplete", "Application Complete", "Under Review", "Offer Pending"][i % 4],
    passportNo: `P0122${String(237 + i).padStart(3, "0")}`,
    enrollmentType: ["Walk-in", "Referred to Agency Partner", "Referred by Agency Partner"][i % 3],
    notes: `Notes for applicant ${i + 4}`,
    status: i % 3 === 0 ? "Inactive" : "Active" as "Active" | "Inactive",
    createdAt: new Date(2024, 0, 15 + i * 5), // Spread dates across months
    adminId: ["arthur", "john", "emily"][i % 3],
    managerId: ["carlos", "sarah", "david"][i % 3],
    counselorId: ["celina", "john", "sarah"][i % 3],
    intake: ["jan-2026", "apr-2026", "jul-2026", "oct-2026"][i % 4],
    agencyPartner: ["apply-board", "idp", "study-abroad"][i % 3],
  })),
];

const ApplicantTracker = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Applicants state - will be updated from API
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Temporary filter states (for UI selection)
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedApplicantStages, setSelectedApplicantStages] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedIntake, setSelectedIntake] = useState("");
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState("");
  const [selectedAgencyPartner, setSelectedAgencyPartner] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Applied filter states (used for API calls and filtering)
  const [appliedAdmin, setAppliedAdmin] = useState("");
  const [appliedManager, setAppliedManager] = useState("");
  const [appliedCounselor, setAppliedCounselor] = useState("");
  const [appliedApplicantStages, setAppliedApplicantStages] = useState<string[]>([]);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedIntake, setAppliedIntake] = useState("");
  const [appliedEnrollmentType, setAppliedEnrollmentType] = useState("");
  const [appliedAgencyPartner, setAppliedAgencyPartner] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null);

  // Pagination state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Total count will be calculated from filteredApplicants
  // TODO: Replace with actual API call - this should come from API response

  // Status change confirmation popup state
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
  const [selectedApplicantForStatusChange, setSelectedApplicantForStatusChange] = useState<Applicant | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Memoize enrollment type map to prevent recreation
  const enrollmentTypeMap = useMemo<Record<string, string>>(() => ({
    "walk-in": "Walk-in",
    "referred-to-agency": "Referred to Agency Partner",
    "referred-by-agency": "Referred by Agency Partner",
  }), []);

  // Memoize normalized dates to prevent recreation on every filter
  const normalizedStartDate = useMemo(() => {
    if (!appliedStartDate) return null;
    const date = new Date(appliedStartDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [appliedStartDate]);

  const normalizedEndDate = useMemo(() => {
    if (!appliedEndDate) return null;
    const date = new Date(appliedEndDate);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [appliedEndDate]);

  // Memoize search query lowercase transformation
  const searchLower = useMemo(() => searchQuery.toLowerCase(), [searchQuery]);

  // Filter applicants based on search and applied filters
  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      // Search filter
      if (searchQuery) {
        const matchesSearch =
          applicant.applicantId.toLowerCase().includes(searchLower) ||
          applicant.applicantName.toLowerCase().includes(searchLower) ||
          applicant.contactNo.toLowerCase().includes(searchLower) ||
          applicant.course.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Admin filter
      if (appliedAdmin && applicant.adminId !== appliedAdmin) return false;

      // Manager filter
      if (appliedManager && applicant.managerId !== appliedManager) return false;

      // Counselor filter
      if (appliedCounselor && applicant.counselorId !== appliedCounselor) return false;

      // Applicant Stage filter
      if (appliedApplicantStages.length > 0) {
        const applicantStageKey = applicant.applicantStage.toLowerCase().replace(/\s+/g, "-");
        if (!appliedApplicantStages.includes(applicantStageKey)) {
          return false;
        }
      }

      // Status filter
      if (appliedStatus && applicant.status.toLowerCase() !== appliedStatus) return false;

      // Intake filter
      if (appliedIntake && applicant.intake !== appliedIntake) return false;

      // Enrollment Type filter
      if (appliedEnrollmentType) {
        if (applicant.enrollmentType !== enrollmentTypeMap[appliedEnrollmentType]) return false;
      }

      // Agency Partner filter
      if (appliedAgencyPartner && applicant.agencyPartner !== appliedAgencyPartner) {
        return false;
      }

      // Date filters - filter by createdAt (using memoized normalized dates)
      if (normalizedStartDate || normalizedEndDate) {
        if (!applicant.createdAt) return false;
        
        // Normalize applicant date to start of day for comparison
        const applicantDate = new Date(applicant.createdAt);
        applicantDate.setHours(0, 0, 0, 0);
        
        if (normalizedStartDate && applicantDate < normalizedStartDate) return false;
        if (normalizedEndDate && applicantDate > normalizedEndDate) return false;
      }

      return true;
    });
  }, [
    searchQuery,
    searchLower,
    enrollmentTypeMap,
    normalizedStartDate,
    normalizedEndDate,
    appliedAdmin,
    appliedManager,
    appliedCounselor,
    appliedApplicantStages,
    appliedStatus,
    appliedIntake,
    appliedEnrollmentType,
    appliedAgencyPartner,
    applicants,
  ]);

  // Total count - calculated from filtered applicants
  // TODO: In real implementation, totalCount should come from API response
  const totalCount = useMemo(() => filteredApplicants.length, [filteredApplicants.length]);

  // Handle apply filters - triggers API call
  const handleApplyFilters = useCallback(() => {
    // Apply the selected filters
    setAppliedAdmin(selectedAdmin);
    setAppliedManager(selectedManager);
    setAppliedCounselor(selectedCounselor);
    setAppliedApplicantStages(selectedApplicantStages);
    setAppliedStatus(selectedStatus);
    setAppliedIntake(selectedIntake);
    setAppliedEnrollmentType(selectedEnrollmentType);
    setAppliedAgencyPartner(selectedAgencyPartner);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    
    // Reset pagination to first page
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });

    // TODO: Make API call here with applied filters
    // Example:
    // fetchApplicants({
    //   admin: appliedAdmin,
    //   manager: appliedManager,
    //   counselor: appliedCounselor,
    //   applicantStages: appliedApplicantStages,
    //   status: appliedStatus,
    //   intake: appliedIntake,
    //   enrollmentType: appliedEnrollmentType,
    //   agencyPartner: appliedAgencyPartner,
    //   startDate: appliedStartDate,
    //   endDate: appliedEndDate,
    //   page: 0,
    //   pageSize: paginationModel.pageSize,
    // }).then(response => {
    //   setTotalCount(response.totalCount);
    //   // Update applicants data
    // });
  }, [selectedAdmin, selectedManager, selectedCounselor, selectedApplicantStages, selectedStatus, selectedIntake, selectedEnrollmentType, selectedAgencyPartner, startDate, endDate, paginationModel.pageSize]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    // Clear selected filters
    setSelectedAdmin("");
    setSelectedManager("");
    setSelectedCounselor("");
    setSelectedApplicantStages([]);
    setSelectedStatus("");
    setSelectedIntake("");
    setSelectedEnrollmentType("");
    setSelectedAgencyPartner("");
    setStartDate(null);
    setEndDate(null);

    // Clear applied filters
    setAppliedAdmin("");
    setAppliedManager("");
    setAppliedCounselor("");
    setAppliedApplicantStages([]);
    setAppliedStatus("");
    setAppliedIntake("");
    setAppliedEnrollmentType("");
    setAppliedAgencyPartner("");
    setAppliedStartDate(null);
    setAppliedEndDate(null);

    // Reset pagination
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });

    // TODO: Make API call to fetch all applicants
    // fetchApplicants({ page: 0, pageSize: paginationModel.pageSize })
    //   .then(response => {
    //     setTotalCount(response.totalCount);
    //   });
  }, [paginationModel.pageSize]);

  // Handle search with debounce (SearchBar handles this internally)
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPaginationModel((prev) => ({ page: 0, pageSize: prev.pageSize }));
  }, []);


  // Handle view action
  const handleView = useCallback((applicantId: string) => {
    // Navigate to applicant detail page or open modal
    navigate(`/applicant-tracker/${applicantId}`);
  }, [navigate]);

  // Handle status toggle - open confirmation popup
  const handleStatusToggle = useCallback((applicant: Applicant) => {
    setSelectedApplicantForStatusChange(applicant);
    setIsStatusPopupOpen(true);
  }, []);

  // Handle confirm status change
  const handleConfirmStatusChange = useCallback(async () => {
    if (!selectedApplicantForStatusChange) return;

    setIsChangingStatus(true);
    const newStatus = selectedApplicantForStatusChange.status === "Active" ? "Inactive" : "Active";

    try {
      // TODO: Replace with actual API call
      // Example:
      // const response = await updateApplicantStatus(selectedApplicantForStatusChange.id, newStatus);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the applicant in the state
      setApplicants((prevApplicants) =>
        prevApplicants.map((app) =>
          app.id === selectedApplicantForStatusChange.id
            ? { ...app, status: newStatus as "Active" | "Inactive" }
            : app
        )
      );

      // TODO: After API call, refetch the applicants list to get updated data
      // await fetchApplicants({ ...filters, page: paginationModel.page, pageSize: paginationModel.pageSize })
      //   .then(response => {
      //     setApplicants(response.data);
      //     setTotalCount(response.totalCount);
      //   });

      setIsStatusPopupOpen(false);
      setSelectedApplicantForStatusChange(null);
    } catch (error) {
      // TODO: Show error toast notification
      // Error handling: Log to error tracking service in production
      if (import.meta.env.DEV) {
        console.error("Error changing status:", error);
      }
    } finally {
      setIsChangingStatus(false);
    }
  }, [selectedApplicantForStatusChange]);

  // Handle cancel status change
  const handleCancelStatusChange = useCallback(() => {
    setIsStatusPopupOpen(false);
    setSelectedApplicantForStatusChange(null);
  }, []);

  // Memoize renderCell functions to prevent recreation
  const renderApplicantNameCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <div className="flex flex-col gap-1">
      <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
        {params.row.applicantName}
      </span>
      <span className="text-xs" style={{ color: COLORS.textMuted }}>
        {params.row.contactNo}
      </span>
    </div>
  ), []);

  const renderStatusCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <span
      style={{
        color: params.value === "Active" ? COLORS.success : COLORS.textMuted,
      }}
    >
      {params.value}
    </span>
  ), []);

  const renderCreatedDateCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <span className="text-sm" style={{ color: COLORS.textDark }}>
      {formatDateValue(params.row.createdAt)}
    </span>
  ), []);

  const renderIntakeYearCell = useCallback((params: GridRenderCellParams<Applicant>) => {
    if (!params.row.intake) return "-";
    // Format intake like "jan-2026" to "Jan 2026" or just "2026"
    const intakeParts = params.row.intake.split("-");
    if (intakeParts.length === 2) {
      const month = intakeParts[0].charAt(0).toUpperCase() + intakeParts[0].slice(1);
      const year = intakeParts[1];
      return `${month} ${year}`;
    }
    return params.row.intake;
  }, []);

  const renderActionsCell = useCallback((params: GridRenderCellParams<Applicant>) => (
    <div className="flex items-center gap-3">
      <Tooltip title={t("applicantTracker.view", "View")} arrow>
        <button
          onClick={() => handleView(params.row.applicantId)}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{ color: COLORS.accent }}
          aria-label={t("applicantTracker.view", "View")}
        >
          <Eye className="w-5 h-5" />
        </button>
      </Tooltip>
      <Tooltip title={t("applicantTracker.changeStatus", "Change Status")} arrow>
        <button
          onClick={() => handleStatusToggle(params.row)}
          className="p-1.5 rounded-md transition-colors hover:bg-slate-100"
          style={{
            color: params.row.status === "Active" ? COLORS.error : COLORS.success,
          }}
          aria-label={
            params.row.status === "Active"
              ? t("applicantTracker.deactivate", "Deactivate")
              : t("applicantTracker.activate", "Activate")
          }
        >
          <ToggleStatus className="w-5 h-5" />
        </button>
      </Tooltip>
    </div>
  ), [t, handleView, handleStatusToggle]);

  // Table columns - memoized to prevent recreation
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "applicantId",
      headerName: t("applicantTracker.applicantId", "Applicant Id"),
      flex: 0.8,
      minWidth: 100,
      sortable: true,
    },
    {
      field: "applicantName",
      headerName: t("applicantTracker.applicantName", "Applicant Name"),
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      renderCell: renderApplicantNameCell,
    },
    {
      field: "course",
      headerName: t("applicantTracker.course", "Course"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "applicantStage",
      headerName: t("applicantTracker.applicantStage", "Applicant Stage"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "applicantStatus",
      headerName: t("applicantTracker.applicantStatus", "Applicant Status"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "enrollmentType",
      headerName: t("applicantTracker.enrollmentType", "Enrollment Type"),
      flex: 1.3,
      minWidth: 180,
      sortable: true,
    },
    {
      field: "intakeYear",
      headerName: t("applicantTracker.intakeYear", "Intake Year"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderIntakeYearCell,
    },
    {
      field: "status",
      headerName: t("applicantTracker.status", "Status"),
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      renderCell: renderStatusCell,
    },
    {
      field: "createdDate",
      headerName: t("applicantTracker.createdDate", "Created Date"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
      renderCell: renderCreatedDateCell,
    },
    {
      field: "actions",
      headerName: t("applicantTracker.action", "Action"),
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: renderActionsCell,
    },
  ], [t, renderApplicantNameCell, renderStatusCell, renderCreatedDateCell, renderIntakeYearCell, renderActionsCell]);

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("applicantTracker.title", "Applicant Tracker")} ({totalCount})
          </h1>
          <div className="flex items-center gap-4">
            <div className="w-full md:w-72">
              <SearchBar
                onSearch={handleSearch}
                placeholder={t("applicantTracker.searchPlaceholder", "Search Applicants...")}
              />
            </div>
            <Link to={ROUTES.CREATE_APPLICANT}>
              <Button variant="accent" leftIcon={<Plus className="w-5 h-5" />} rounded>
                {t("applicantTracker.addApplicant", "Add Applicant")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Row */}
        <ApplicantTrackerFilters
          selectedAdmin={selectedAdmin}
          selectedManager={selectedManager}
          selectedCounselor={selectedCounselor}
          selectedApplicantStages={selectedApplicantStages}
          selectedStatus={selectedStatus}
          selectedIntake={selectedIntake}
          selectedEnrollmentType={selectedEnrollmentType}
          selectedAgencyPartner={selectedAgencyPartner}
          startDate={startDate}
          endDate={endDate}
          onAdminChange={setSelectedAdmin}
          onManagerChange={setSelectedManager}
          onCounselorChange={setSelectedCounselor}
          onApplicantStagesChange={setSelectedApplicantStages}
          onStatusChange={setSelectedStatus}
          onIntakeChange={setSelectedIntake}
          onEnrollmentTypeChange={setSelectedEnrollmentType}
          onAgencyPartnerChange={setSelectedAgencyPartner}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />

        {/* DataTable */}
        <DataTable
          rows={filteredApplicants}
          columns={columns}
          pageSize={paginationModel.pageSize}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="client"
          sortingMode="client"
        />

        {/* Status Change Confirmation Popup */}
        <StatusChangePopup
          isOpen={isStatusPopupOpen}
          item={selectedApplicantForStatusChange}
          isChanging={isChangingStatus}
          onClose={handleCancelStatusChange}
          onConfirm={handleConfirmStatusChange}
          nameKey="applicantName"
        />
      </div>
    </Layout>
  );
};

export default ApplicantTracker;
