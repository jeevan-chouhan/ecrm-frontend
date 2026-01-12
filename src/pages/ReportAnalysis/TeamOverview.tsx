import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { DataTable } from "../../components";
import type { DateRange, SelectOption } from "../../components";
import { COLORS, typography } from "../../constants";
import { mockTeamOverviewData, type TeamOverviewItem } from "../../constants/mockData";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { applicantService, userService } from "../../services";
import type { AdminItem, ManagerItem, CounselorItem } from "../../services";
import { handleApiError } from "../../utils";
import TeamOverviewFilters from "./TeamOverviewFilters";

const TeamOverview = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Filter states (selected - what user is choosing)
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // Applied filter states (what's actually being used for filtering)
  const [appliedAdmin, setAppliedAdmin] = useState("");
  const [appliedManager, setAppliedManager] = useState("");
  const [appliedCounselor, setAppliedCounselor] = useState("");
  const [appliedEnrollmentType, setAppliedEnrollmentType] = useState("");
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // Data states
  const [teamOverviewData, setTeamOverviewData] = useState<TeamOverviewItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter options states
  const [adminOptions, setAdminOptions] = useState<SelectOption[]>([]);
  const [managerOptions, setManagerOptions] = useState<SelectOption[]>([]);
  const [counselorOptions, setCounselorOptions] = useState<SelectOption[]>([]);

  // Pagination state
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Refs to prevent multiple simultaneous API calls
  const isLoadingFilterOptionsRef = useRef(false);
  const hasFetchedFilterOptionsRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  /**
   * Fetch filter options (admins, managers, counselors) from API
   */
  const fetchFilterOptions = useCallback(async () => {
    if (!user?.agencyId) {
      return;
    }

    if (isLoadingFilterOptionsRef.current) {
      return;
    }

    isLoadingFilterOptionsRef.current = true;
    try {
      const [adminsResult] = await Promise.allSettled([
        userService.getAdmins(user.agencyId),
      ]);

      // Process admins response
      if (adminsResult.status === 'fulfilled') {
        const adminsResponse = adminsResult.value;
        
        let admins: AdminItem[] = [];
        if (Array.isArray(adminsResponse)) {
          admins = adminsResponse;
        } else if ((adminsResponse as any)?.data) {
          admins = (adminsResponse as any).data;
        }
        
        const adminOptionsData = admins.map((admin: AdminItem) => ({
          value: admin.id.toString(),
          label: admin.name,
        }));
        
        setAdminOptions(adminOptionsData);
      } else {
        dispatch(addToast({ type: "error", message: "Failed to fetch admins" }));
      }

      // Counselors will be fetched when manager is selected
      setCounselorOptions([]);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch filter options");
      dispatch(addToast({ type: "error", message }));
    } finally {
      isLoadingFilterOptionsRef.current = false;
    }
  }, [user?.agencyId, dispatch]);

  // Fetch filter options when user is loaded (only once)
  useEffect(() => {
    if (user?.agencyId && !hasFetchedFilterOptionsRef.current) {
      hasFetchedFilterOptionsRef.current = true;
      fetchFilterOptions();
    }
    
    return () => {
      if (!user?.agencyId) {
        hasFetchedFilterOptionsRef.current = false;
      }
    };
  }, [user?.agencyId, fetchFilterOptions]);

  // Fetch managers when admin is selected
  const fetchManagers = useCallback(async (adminId: string | null) => {
    if (!user?.agencyId || !adminId) {
      setManagerOptions([]);
      return;
    }

    try {
      const managersResponse = await applicantService.getManagers(
        user.agencyId,
        adminId
      );

      const managerOptionsData = managersResponse.map((manager: ManagerItem) => ({
        value: manager.id.toString(),
        label: manager.name,
      }));

      setManagerOptions(managerOptionsData);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch managers");
      dispatch(addToast({ type: "error", message }));
      setManagerOptions([]);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch counselors when manager is selected
  const fetchCounselors = useCallback(async (managerId: string | null) => {
    if (!user?.agencyId || !managerId) {
      setCounselorOptions([]);
      return;
    }

    try {
      const counselorsResponse = await applicantService.getCounselors(
        user.agencyId,
        managerId
      );

      const counselorOptionsData = counselorsResponse.map((counselor: CounselorItem) => ({
        value: counselor.id.toString(),
        label: counselor.name,
      }));

      setCounselorOptions(counselorOptionsData);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch counselors");
      dispatch(addToast({ type: "error", message }));
      setCounselorOptions([]);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch managers when admin is selected
  useEffect(() => {
    if (user?.agencyId && selectedAdmin) {
      fetchManagers(selectedAdmin);
    } else {
      setManagerOptions([]);
      setSelectedManager("");
      setCounselorOptions([]);
      setSelectedCounselor("");
    }
  }, [selectedAdmin, user?.agencyId, fetchManagers]);

  // Fetch counselors when manager is selected
  useEffect(() => {
    if (user?.agencyId && selectedManager) {
      fetchCounselors(selectedManager);
    } else {
      setCounselorOptions([]);
      setSelectedCounselor("");
    }
  }, [selectedManager, user?.agencyId, fetchCounselors]);

  /**
   * Fetch team overview data from API
   */
  const fetchTeamOverview = useCallback(async () => {
    if (!user?.agencyId) {
      return;
    }

    setLoading(true);
    dispatch(showLoader());

    try {
      // TODO: Replace with actual API call when endpoint is available
      // const response = await teamOverviewService.getTeamOverview({
      //   agencyId: user.agencyId,
      //   adminId: appliedAdmin ? parseInt(appliedAdmin) : null,
      //   managerId: appliedManager ? parseInt(appliedManager) : null,
      //   counselorId: appliedCounselor ? parseInt(appliedCounselor) : null,
      //   enrollmentType: appliedEnrollmentType || null,
      //   startDate: appliedDateRange.startDate?.toISOString() || null,
      //   endDate: appliedDateRange.endDate?.toISOString() || null,
      //   page: paginationModel.page,
      //   size: paginationModel.pageSize,
      // });

      // Mock data for now - replace with API response
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Filter mock data based on applied filters
      let filteredData = [...mockTeamOverviewData];
      if (appliedManager) {
        const managerLabel = managerOptions.find(opt => opt.value === appliedManager)?.label || "";
        filteredData = filteredData.filter(row => row.manager === managerLabel);
      }
      if (appliedCounselor) {
        const counselorLabel = counselorOptions.find(opt => opt.value === appliedCounselor)?.label || "";
        filteredData = filteredData.filter(row => row.counselor === counselorLabel);
      }

      setTeamOverviewData(filteredData);
      setTotalCount(filteredData.length);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch team overview");
      dispatch(addToast({ type: "error", message }));
      setTeamOverviewData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      dispatch(hideLoader());
    }
  }, [
    user?.agencyId,
    appliedAdmin,
    appliedManager,
    appliedCounselor,
    appliedEnrollmentType,
    appliedDateRange,
    paginationModel,
    managerOptions,
    counselorOptions,
    dispatch,
  ]);

  // Fetch team overview data when filters or pagination change
  useEffect(() => {
    if (user?.agencyId) {
      fetchTeamOverview();
    }
  }, [user?.agencyId, appliedAdmin, appliedManager, appliedCounselor, appliedEnrollmentType, appliedDateRange, paginationModel, fetchTeamOverview]);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    setAppliedAdmin(selectedAdmin);
    setAppliedManager(selectedManager);
    setAppliedCounselor(selectedCounselor);
    setAppliedEnrollmentType(selectedEnrollmentType);
    setAppliedDateRange(selectedDateRange);
    setPaginationModel((prev) => ({ page: 0, pageSize: prev.pageSize }));
  }, [selectedAdmin, selectedManager, selectedCounselor, selectedEnrollmentType, selectedDateRange]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedAdmin("");
    setSelectedManager("");
    setSelectedCounselor("");
    setSelectedEnrollmentType("");
    setSelectedDateRange({ startDate: null, endDate: null });
    setAppliedAdmin("");
    setAppliedManager("");
    setAppliedCounselor("");
    setAppliedEnrollmentType("");
    setAppliedDateRange({ startDate: null, endDate: null });
    setPaginationModel((prev) => ({ page: 0, pageSize: prev.pageSize }));
  }, []);

  // Table columns with translations
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "id",
      headerName: t("reportAnalysis.teamOverview.tableId", "ID"),
      width: 70,
      sortable: true,
    },
    {
      field: "manager",
      headerName: t("reportAnalysis.teamOverview.tableManager", "Manager"),
      flex: 1,
      minWidth: 120,
      sortable: true,
    },
    {
      field: "counselor",
      headerName: t("reportAnalysis.teamOverview.tableCounselor", "Counselor"),
      flex: 1,
      minWidth: 150,
      sortable: true,
    },
    {
      field: "country",
      headerName: t("reportAnalysis.teamOverview.tableCountry", "Country"),
      flex: 1,
      minWidth: 120,
      sortable: true,
    },
    {
      field: "totalApplicants",
      headerName: t("reportAnalysis.teamOverview.tableTotalApplicants", "Total Applicants"),
      flex: 1,
      minWidth: 150,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "leads",
      headerName: t("reportAnalysis.teamOverview.tableLeads", "Leads"),
      flex: 1,
      minWidth: 100,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "inProgressApplicants",
      headerName: t("reportAnalysis.teamOverview.tableInProgressApplications", "In Progress Applications"),
      flex: 1,
      minWidth: 200,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "enrolledApplicants",
      headerName: t("reportAnalysis.teamOverview.tableEnrolledApplications", "Enrolled Applications"),
      flex: 1,
      minWidth: 180,
      sortable: true,
      align: "center",
      headerAlign: "center",
    },
  ], [t]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2
          className="text-lg font-semibold"
          style={{
            color: COLORS.textDark,
            fontSize: typography.fontSize.h3,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          {t("reportAnalysis.teamOverview.title", "Team Overview")} ({totalCount})
        </h2>
      </div>

      {/* Filters */}
      <TeamOverviewFilters
        adminOptions={adminOptions}
        managerOptions={managerOptions}
        counselorOptions={counselorOptions}
        selectedAdmin={selectedAdmin}
        selectedManager={selectedManager}
        selectedCounselor={selectedCounselor}
        selectedEnrollmentType={selectedEnrollmentType}
        selectedDateRange={selectedDateRange}
        onAdminChange={setSelectedAdmin}
        onManagerChange={setSelectedManager}
        onCounselorChange={setSelectedCounselor}
        onEnrollmentTypeChange={setSelectedEnrollmentType}
        onDateRangeChange={setSelectedDateRange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Team Overview Table */}
      <DataTable
        rows={teamOverviewData}
        columns={columns}
        loading={loading}
        pageSize={paginationModel.pageSize}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        paginationMode="client"
        sortingMode="client"
      />
    </div>
  );
};

export default TeamOverview;
