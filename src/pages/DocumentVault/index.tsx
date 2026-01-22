import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { Layout, SearchBar, DataTable, Button, Chip } from "../../components";
import { Eye } from "../../assets";
import { COLORS } from "../../constants";
import { userService } from "../../services";
import type { ApplicantOverviewItem } from "../../services";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import {
  setApplicants,
  setPage,
  setPageSize,
  setSearch,
} from "../../redux/slices/documentVault/documentVaultSlice";
import type { DocumentVaultApplicantRow } from "../../redux/slices/documentVault/documentVaultSlice";
import { handleApiError } from "../../utils";
import { getEnrollmentTypeLabel, cleanContactNumber } from "../../utils/commonUtils";

// Transform API data to table format
const transformApiData = (items: ApplicantOverviewItem[]): DocumentVaultApplicantRow[] => {
  return items.map((item) => {
    // Parse applicantName to extract name and contact number
    // Format: "Rahul Sharma (+91 9876543210)"
    const nameMatch = item.applicantName.match(/^(.+?)\s*\(([^)]+)\)$/);
    const name = nameMatch ? nameMatch[1].trim() : item.applicantName;
    const rawContactNo = nameMatch ? nameMatch[2].trim() : "";
    const contactNo = cleanContactNumber(rawContactNo);

    return {
      id: item.applicantId,
      applicantId: item.applicantId,
      applicantName: name,
      contactNo: contactNo,
      email: item.email,
      enrollmentType: item.enrollmentType,
      status: item.status === "ACTIVE" ? "Active" : "Inactive",
    };
  });
};

const DocumentVault = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Get documentVault state from Redux
  const { applicants, pagination, filter } = useAppSelector((state) => state.documentVault);

  // Local state for search input (for controlled input with debounce)
  const [searchInput, setSearchInput] = useState(() => filter.search);

  // Refs
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Sync local state when Redux filter changes (e.g., from persist)
  useEffect(() => {
    if (isInitialMount.current) {
      setSearchInput(filter.search);
      isInitialMount.current = false;
    }
  }, [filter.search]);

  // Fetch applicant data
  const fetchApplicants = useCallback(async () => {
    if (!user?.agencyId) return;

    try {
      dispatch(showLoader());

      const response = await userService.getApplicantOverview({
        agencyId: user.agencyId,
        assignedAdminId: null,
        assignedManagerId: null,
        search: filter.search || null,
        page: pagination.page,
        size: pagination.size,
      });

      if (response.status === "success" && response.data) {
        const transformedApplicants = transformApiData(response.data.content);
        dispatch(setApplicants({
          applicants: transformedApplicants,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          first: response.data.first,
          last: response.data.last,
        }));
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(addToast({ 
        type: "error", 
        message: typeof errorMessage === "string" ? errorMessage : "An error occurred" 
      }));
    } finally {
      dispatch(hideLoader());
    }
  }, [user?.agencyId, filter.search, pagination.page, pagination.size, dispatch]);

  // Fetch data on mount and when filters/pagination change
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Handle search with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    // Clear previous debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Set new debounce timer (500ms delay)
    searchDebounceRef.current = setTimeout(() => {
      dispatch(setSearch(value));
    }, 500);
  }, [dispatch]);

  // Handle pagination change
  const handlePaginationChange = useCallback((model: GridPaginationModel) => {
    if (model.page !== pagination.page) {
      dispatch(setPage(model.page));
    }
    if (model.pageSize !== pagination.size) {
      dispatch(setPageSize(model.pageSize));
    }
  }, [dispatch, pagination.page, pagination.size]);

  const handleViewDocuments = useCallback((applicant: DocumentVaultApplicantRow) => {
    navigate(`/document-vault/${applicant.applicantId}`, {
      state: {
        applicantName: applicant.applicantName,
        contactNo: applicant.contactNo,
        email: applicant.email,
        enrollmentType: applicant.enrollmentType,
        status: applicant.status,
      },
    });
  }, [navigate]);

  const columns: GridColDef[] = [
    {
      field: "applicantId",
      headerName: t("documentVault.id", "ID"),
      flex: 0.5,
      minWidth: 80,
    },
    {
      field: "applicantName",
      headerName: t("documentVault.applicantName", "Applicant Name"),
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <div className="flex flex-col gap-0.5 py-1">
          <span className="font-medium text-sm" style={{ color: COLORS.textDark }}>
            {params.value}
          </span>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            {params.row.contactNo}
          </span>
        </div>
      ),
    },
    {
      field: "email",
      headerName: t("documentVault.email", "Email"),
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "enrollmentType",
      headerName: t("documentVault.enrollmentType", "Enrolment Type"),
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <span style={{ color: COLORS.textDark }}>
          {getEnrollmentTypeLabel(params.value)}
        </span>
      ),
    },
    {
      field: "status",
      headerName: t("documentVault.status", "Status"),
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const isActive = params.value === "Active";
        return (
          <Chip
            label={params.value}
            variant={isActive ? "success" : "error"}
            size="sm"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: t("documentVault.action", "Action"),
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Eye className="h-4 w-4" style={{ color: COLORS.accent }} />}
          onClick={() => handleViewDocuments(params.row)}
          title={t("documentVault.view", "View Documents")}
          rounded
        />
      ),
    },
  ];

  // Pagination model for DataTable
  const paginationModel: GridPaginationModel = {
    page: pagination.page,
    pageSize: pagination.size,
  };

  return (
    <Layout>
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
            <span
              className="text-lg font-medium"
              style={{ color: COLORS.textMuted }}
            >
              ({pagination.totalElements})
            </span>
          </div>
          <Tooltip title={t("documentVault.searchTooltip", "Search Applicant Name, ID, Email")} arrow>
            <div className="w-full md:w-80">
              <SearchBar
                value={searchInput}
                onChange={handleSearchChange}
                placeholder={t("documentVault.searchPlaceholder", "Search Applicant Name, ID, Email")}
              />
            </div>
          </Tooltip>
        </div>

        {/* DataTable with Pagination */}
        <DataTable
          rows={applicants}
          columns={columns}
          pageSize={pagination.size}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationChange}
          paginationMode="server"
          rowCount={pagination.totalElements}
        />
      </div>
    </Layout>
  );
};

export default DocumentVault;
