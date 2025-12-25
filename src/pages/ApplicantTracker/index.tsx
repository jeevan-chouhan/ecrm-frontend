import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import {
  Layout,
  Button,
  SearchBar,
  DataTable,
  Popup,
} from "../../components";
import { COLORS, ROUTES } from "../../constants";
import { Plus, Eye, ToggleStatus } from "../../assets";
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

  // Total count from API response
  // TODO: Replace with actual API call - this should come from API response
  const [totalCount, setTotalCount] = useState<number>(0);

  // Status change confirmation popup state
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
  const [selectedApplicantForStatusChange, setSelectedApplicantForStatusChange] = useState<Applicant | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Filter applicants based on search and applied filters
  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
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
        const enrollmentTypeMap: Record<string, string> = {
          "walk-in": "Walk-in",
          "referred-to-agency": "Referred to Agency Partner",
          "referred-by-agency": "Referred by Agency Partner",
        };
        if (applicant.enrollmentType !== enrollmentTypeMap[appliedEnrollmentType]) return false;
      }

      // Agency Partner filter
      if (appliedAgencyPartner && applicant.agencyPartner !== appliedAgencyPartner) {
        return false;
      }

      // Date filters - filter by createdAt
      if (appliedStartDate || appliedEndDate) {
        if (!applicant.createdAt) return false;
        
        const applicantDate = new Date(applicant.createdAt);
        const startDate = appliedStartDate ? new Date(appliedStartDate) : null;
        const endDate = appliedEndDate ? new Date(appliedEndDate) : null;
        
        // Set time to start of day for start date comparison
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        
        // Set time to end of day for end date comparison
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        
        // Normalize applicant date to start of day for comparison
        const applicantDateNormalized = new Date(applicantDate);
        applicantDateNormalized.setHours(0, 0, 0, 0);
        
        if (startDate && applicantDateNormalized < startDate) return false;
        if (endDate && applicantDateNormalized > endDate) return false;
      }

      return true;
    });
  }, [
    searchQuery,
    appliedAdmin,
    appliedManager,
    appliedCounselor,
    appliedApplicantStages,
    appliedStatus,
    appliedIntake,
    appliedEnrollmentType,
    appliedAgencyPartner,
    appliedStartDate,
    appliedEndDate,
    applicants,
  ]);

  // Update totalCount when filtered applicants change
  // TODO: In real implementation, totalCount should come from API response
  // For now, using filteredApplicants.length as placeholder
  useEffect(() => {
    setTotalCount(filteredApplicants.length);
  }, [filteredApplicants.length]);

  // Handle apply filters - triggers API call
  const handleApplyFilters = () => {
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
  };

  // Handle clear filters
  const handleClearFilters = () => {
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
  };

  // Handle search with debounce (SearchBar handles this internally)
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
  };


  // Handle view action
  const handleView = (applicantId: string) => {
    // Navigate to applicant detail page or open modal
    navigate(`/applicant-tracker/${applicantId}`);
  };

  // Handle status toggle - open confirmation popup
  const handleStatusToggle = (applicant: Applicant) => {
    setSelectedApplicantForStatusChange(applicant);
    setIsStatusPopupOpen(true);
  };

  // Handle confirm status change
  const handleConfirmStatusChange = async () => {
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
      console.error("Error changing status:", error);
      // TODO: Show error toast notification
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Handle cancel status change
  const handleCancelStatusChange = () => {
    setIsStatusPopupOpen(false);
    setSelectedApplicantForStatusChange(null);
  };

  // Table columns
  const columns: GridColDef[] = [
    {
      field: "applicantId",
      headerName: t("applicantTracker.applicantId", "APPLICANT ID"),
      flex: 0.8,
      minWidth: 100,
      sortable: true,
    },
    {
      field: "applicantName",
      headerName: t("applicantTracker.applicantName", "APPLICANT NAME"),
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      renderCell: (params) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
            {params.row.applicantName}
          </span>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            {params.row.contactNo}
          </span>
        </div>
      ),
    },
    {
      field: "course",
      headerName: t("applicantTracker.course", "COURSE"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "applicantStage",
      headerName: t("applicantTracker.applicantStage", "APPLICANT STAGE"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "applicantStatus",
      headerName: t("applicantTracker.applicantStatus", "APPLICANT STATUS"),
      flex: 1.2,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "enrollmentType",
      headerName: t("applicantTracker.enrollmentType", "ENROLLMENT TYPE"),
      flex: 1.3,
      minWidth: 180,
      sortable: true,
    },
    {
      field: "notes",
      headerName: t("applicantTracker.notes", "NOTES"),
      flex: 1.5,
      minWidth: 200,
      sortable: false,
    },
    {
      field: "status",
      headerName: t("applicantTracker.status", "STATUS"),
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      renderCell: (params) => {
        return (
          <span
            style={{
              color: params.value === "Active" ? COLORS.success : COLORS.textMuted,
            }}
          >
            {params.value}
          </span>
        );
      },
    },
    {
      field: "actions",
      headerName: t("applicantTracker.action", "ACTION"),
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
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
      ),
    },
  ];

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
                placeholder={t("applicantTracker.searchPlaceholder", "Search applicants...")}
              />
            </div>
            <Link to={ROUTES.CREATE_APPLICANT}>
              <Button variant="accent" leftIcon={<Plus className="w-5 h-5" />}>
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
        <Popup
          isOpen={isStatusPopupOpen}
          onClose={handleCancelStatusChange}
          title={t("applicantTracker.confirmStatusChange", "Confirm Status Change")}
          size="sm"
          closeOnOverlayClick={!isChangingStatus}
          closeOnEscape={!isChangingStatus}
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="cancel"
                size="sm"
                onClick={handleCancelStatusChange}
                disabled={isChangingStatus}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleConfirmStatusChange}
                isLoading={isChangingStatus}
              >
                {t("common.confirm", "Confirm")}
              </Button>
            </div>
          }
        >
          <div className="py-2">
            <p className="text-sm text-slate-600 mb-2">
              {selectedApplicantForStatusChange && (
                <>
                  {t(
                    "applicantTracker.confirmStatusChangeMessage",
                    "Are you sure you want to change the status of {{name}} from {{currentStatus}} to {{newStatus}}?",
                    {
                      name: selectedApplicantForStatusChange.applicantName,
                      currentStatus: selectedApplicantForStatusChange.status,
                      newStatus:
                        selectedApplicantForStatusChange.status === "Active"
                          ? "Inactive"
                          : "Active",
                    }
                  )}
                </>
              )}
            </p>
          </div>
        </Popup>
      </div>
    </Layout>
  );
};

export default ApplicantTracker;
