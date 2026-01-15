import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridSortModel, GridPaginationModel } from "@mui/x-data-grid";
import { Layout, SearchBar, DataTable, Button, Popup } from "../../components";
import { COLORS } from "../../constants";
import { Edit, Trash } from "../../assets";
import { agencyService } from "../../services";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import {
  setPartners,
  setPage,
  setPageSize,
  setSort,
  setSearch,
} from "../../redux/slices/agencyPartner/agencyPartnerSlice";
import type { PartnerRow } from "../../redux/slices/agencyPartner/agencyPartnerSlice";
import { handleApiError, cleanContactNumber } from "../../utils";
import AddAgencyPartner from "./AddAgencyPartner";
import type { AgencyPartnerFormData } from "./AddAgencyPartner";

// Format contact number helper using common utility
const formatContactNumber = (countryCode: string, contactNumber: string): string => {
  if (!contactNumber) return "";
  return cleanContactNumber(`${countryCode} ${contactNumber}`);
};

const AgencyPartner = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { partners, pagination, sort, filter } = useAppSelector((state) => state.agencyPartner);

  // Local state for popups
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerRow | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<PartnerRow | null>(null);

  // Ref to track last fetch params (prevent duplicate API calls)
  const lastFetchParamsRef = useRef<string>("");

  // Fetch partners from API
  const fetchPartners = useCallback(async () => {
    if (!user?.agencyId) return;

    const fetchParamsKey = `${user.agencyId}-${filter.search}-${pagination.page}-${pagination.size}-${sort.sortBy}-${sort.asc}`;

    // Skip if same params already fetched
    if (lastFetchParamsRef.current === fetchParamsKey) return;
    lastFetchParamsRef.current = fetchParamsKey;

    dispatch(showLoader());

    try {
      const response = await agencyService.getPartnersList({
        agencyId: user.agencyId,
        search: filter.search || null,
        page: pagination.page,
        size: pagination.size,
        sortBy: sort.sortBy,
        asc: sort.asc,
      });

      if (response.status === "success" && response.data) {
        const transformedPartners: PartnerRow[] = response.data.content.map((item) => ({
          id: item.id,
          name: item.name,
          contactPerson: item.contactPerson,
          email: item.email,
          countryCode: item.countryCode,
          contactNumber: item.contactNumber,
          commissionPercentage: item.commissionPercentage,
          description: item.description,
          status: item.status,
        }));

        dispatch(setPartners({
          partners: transformedPartners,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          first: response.data.first,
          last: response.data.last,
        }));
      } else {
        lastFetchParamsRef.current = "";
        throw new Error(response.message || "Failed to fetch partners");
      }
    } catch (error) {
      lastFetchParamsRef.current = "";
      const { message } = handleApiError(error, "Failed to fetch partners");
      dispatch(addToast({ type: "error", message }));
    } finally {
      dispatch(hideLoader());
    }
  }, [user?.agencyId, filter.search, pagination.page, pagination.size, sort.sortBy, sort.asc, dispatch]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    dispatch(setSearch(value));
  }, [dispatch]);

  // Handle pagination change
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    if (model.page !== pagination.page) {
      dispatch(setPage(model.page));
    }
    if (model.pageSize !== pagination.size) {
      dispatch(setPageSize(model.pageSize));
    }
  }, [dispatch, pagination.page, pagination.size]);

  // Handle sort change
  const handleSortChange = useCallback((sortModel: GridSortModel) => {
    if (sortModel.length > 0) {
      dispatch(setSort({
        sortBy: sortModel[0].field,
        asc: sortModel[0].sort === "asc",
      }));
    } else {
      dispatch(setSort({ sortBy: null, asc: null }));
    }
  }, [dispatch]);

  // Popup handlers
  const handleOpenAddPopup = useCallback(() => {
    setEditingPartner(null);
    setIsPopupOpen(true);
  }, []);

  const handleOpenEditPopup = useCallback((partner: PartnerRow) => {
    setEditingPartner(partner);
    setIsPopupOpen(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setIsPopupOpen(false);
    setEditingPartner(null);
  }, []);

  // Handle add/edit success - refresh list from API
  const handleSuccess = useCallback(() => {
    // Reset fetch params to allow refetching
    lastFetchParamsRef.current = "";
    // Fetch updated list from API
    fetchPartners();
  }, [fetchPartners]);

  // Delete handlers
  const handleOpenDeletePopup = useCallback((partner: PartnerRow) => {
    setDeletingPartner(partner);
    setIsDeletePopupOpen(true);
  }, []);

  const handleCloseDeletePopup = useCallback(() => {
    setIsDeletePopupOpen(false);
    setDeletingPartner(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletingPartner || !user?.agencyId) return;

    dispatch(showLoader());

    try {
      const response = await agencyService.deleteAgencyPartner(deletingPartner.id, user.agencyId);

      if (response.status === "success") {
        dispatch(addToast({ type: "success", message: t("agencyPartner.deleteSuccess", "Agency Partner deleted successfully") }));
        // Reset fetch params and refresh list
        lastFetchParamsRef.current = "";
        fetchPartners();
      } else {
        throw new Error(response.message || "Failed to delete agency partner");
      }
    } catch (error) {
      const { message } = handleApiError(error, "Failed to delete agency partner");
      dispatch(addToast({ type: "error", message }));
    } finally {
      dispatch(hideLoader());
      handleCloseDeletePopup();
    }
  }, [deletingPartner, user?.agencyId, dispatch, t, handleCloseDeletePopup, fetchPartners]);

  // Convert PartnerRow to AgencyPartnerFormData for editing
  const getEditingPartnerData = useMemo((): AgencyPartnerFormData | null => {
    if (!editingPartner) return null;
    return {
      id: editingPartner.id,
      name: editingPartner.name,
      contactPerson: editingPartner.contactPerson,
      email: editingPartner.email,
      contactNo: `${editingPartner.countryCode} ${editingPartner.contactNumber}`,
      commissionPercentage: editingPartner.commissionPercentage.toString(),
      description: editingPartner.description,
    };
  }, [editingPartner]);

  // Memoized columns
  const columns: GridColDef[] = useMemo(() => [
    {
      field: "serialNo",
      headerName: t("agencyPartner.no", "No."),
      width: 70,
      sortable: false,
      renderCell: (params) => {
        const index = partners.findIndex((p) => p.id === params.row.id);
        const serialNo = pagination.page * pagination.size + index + 1;
        return <span style={{ color: COLORS.textMuted }}>{String(serialNo).padStart(2, "0")}</span>;
      },
    },
    {
      field: "name",
      headerName: t("agencyPartner.agencyPartnerName", "Agency Partner Name"),
      flex: 1,
      minWidth: 150,
    },
    {
      field: "contactPerson",
      headerName: t("agencyPartner.contactPerson", "Contact Person"),
      flex: 1,
      minWidth: 150,
    },
    {
      field: "email",
      headerName: t("agencyPartner.email", "Email"),
      flex: 1,
      minWidth: 180,
    },
    {
      field: "contactNumber",
      headerName: t("agencyPartner.contactNo", "Contact Number"),
      flex: 1,
      minWidth: 140,
      renderCell: (params) => formatContactNumber(params.row.countryCode, params.row.contactNumber),
    },
    {
      field: "commissionPercentage",
      headerName: t("agencyPartner.commission", "Commission %"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => `${params.value}%`,
    },
    {
      field: "actions",
      headerName: t("common.action", "Action"),
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditPopup(params.row)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title={t("common.edit", "Edit")}
          >
            <Edit className="h-4 w-4 mt-2" style={{ color: COLORS.accent }} />
          </button>
          <button
            onClick={() => handleOpenDeletePopup(params.row)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title={t("common.delete", "Delete")}
          >
            <Trash className="h-4 w-4 mt-2" style={{ color: COLORS.error }} />
          </button>
        </div>
      ),
    },
  ], [t, partners, pagination.page, pagination.size, handleOpenEditPopup, handleOpenDeletePopup]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold" style={{ color: COLORS.textDark }}>
            {t("agencyPartner.title", "Agency Partner")}
          </h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <SearchBar
              placeholder={t("agencyPartner.searchPlaceholder", "Search Agency Partner...")}
              value={filter.search}
              onChange={handleSearchChange}
            />
            <Button variant="accent" size="md" rounded onClick={handleOpenAddPopup}>
              {t("agencyPartner.addAgencyPartner", "Add Agency Partner")}
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <DataTable
            rows={partners}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            rowCount={pagination.totalElements}
            paginationModel={{ page: pagination.page, pageSize: pagination.size }}
            paginationMode="server"
            onPaginationModelChange={handlePaginationModelChange}
            sortingMode="server"
            onSortModelChange={handleSortChange}
          />
        </div>
      </div>

      {/* Add/Edit Agency Partner Popup */}
      <AddAgencyPartner
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onSuccess={handleSuccess}
        editingPartner={getEditingPartnerData}
      />

      {/* Delete Confirmation Popup */}
      <Popup
        isOpen={isDeletePopupOpen}
        onClose={handleCloseDeletePopup}
        title={t("agencyPartner.deleteAgencyPartner", "Delete Agency Partner")}
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: COLORS.textMuted }}>
            {t("agencyPartner.deleteConfirmation", "Are you sure you want to delete")}{" "}
            <strong style={{ color: COLORS.textDark }}>{deletingPartner?.name}</strong>?{" "}
            {t("agencyPartner.deleteWarning", "This action cannot be undone.")}
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="cancel" size="md" rounded onClick={handleCloseDeletePopup}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="accent" size="md" rounded onClick={handleDelete}>
              {t("common.delete", "Delete")}
            </Button>
          </div>
        </div>
      </Popup>
    </Layout>
  );
};

export default AgencyPartner;
