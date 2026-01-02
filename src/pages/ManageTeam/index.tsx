import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Layout,
  Button,
  DataTable,
  Select,
  Popup,
} from "../../components";
import { Eye, Edit, Plus, Search, CloseCircle, ToggleStatus } from "../../assets";
import {
  COLORS,
  ROUTES,
  statusFilterOptions,
  mockTeamMembers,
  type TeamMember,
} from "../../constants";

const ManageTeam = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [statusPopup, setStatusPopup] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
  }>({ isOpen: false, member: null });

  // Filter logic
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.mobileNo.includes(searchTerm);
      const matchesStatus =
        statusFilter === "" || statusFilter === "all" || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, members]);

  const handleView = (member: TeamMember) => {
    navigate(`${ROUTES.MANAGE_TEAM}/${member.id}`);
  };

  const handleStatusToggle = (member: TeamMember) => {
    setStatusPopup({ isOpen: true, member });
  };

  const handleStatusConfirm = () => {
    if (statusPopup.member) {
      // Toggle the status
      const newStatus = statusPopup.member.status === "active" ? "inactive" : "active";
      
      // Update the member in state
      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === statusPopup.member!.id
            ? { ...m, status: newStatus as "active" | "inactive" }
            : m
        )
      );
      
      console.log("Status changed:", statusPopup.member.name, "to", newStatus);
    }
    setStatusPopup({ isOpen: false, member: null });
  };

  const handleStatusCancel = () => {
    setStatusPopup({ isOpen: false, member: null });
  };

  const handleAddMember = () => {
    navigate(ROUTES.MANAGE_TEAM_ADD);
  };

  const handleEdit = (member: TeamMember) => {
    navigate(`/manage-team/edit/${member.id}`);
  };

  // Get popup message based on current status
  const getStatusChangeMessage = () => {
    if (!statusPopup.member) return "";
    const currentStatus = statusPopup.member.status === "active" ? "Active" : "Inactive";
    const newStatus = statusPopup.member.status === "active" ? "Inactive" : "Active";
    return `Are you sure you want to change the status of ${statusPopup.member.name} from ${currentStatus} to ${newStatus}?`;
  };

  // DataTable columns
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: t("manageTeam.name", "Name"),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <div className="flex flex-col">
          <span style={{ color: COLORS.textDark, fontWeight: 500 }}>
            {params.row.name}
          </span>
        </div>
      ),
    },
    {
      field: "role",
      headerName: t("manageTeam.role", "Role"),
      flex: 0.7,
      minWidth: 100,
    },
    {
      field: "email",
      headerName: t("manageTeam.email", "Email"),
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: "mobileNo",
      headerName: t("manageTeam.contactNo", "Contact No"),
      flex: 0.9,
      minWidth: 130,
    },
    {
      field: "status",
      headerName: t("manageTeam.status", "Status"),
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => (
        <span
          style={{
            color: params.value === "active" ? COLORS.success : COLORS.textMuted,
            fontWeight: 500,
            textTransform: "capitalize",
          }}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: t("manageTeam.action", "Action"),
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-5 w-5" style={{ color: COLORS.accent }} />}
            onClick={(e) => {
              e.stopPropagation();
              handleView(params.row);
            }}
            title={t("common.view", "View")}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="h-5 w-5" style={{ color: COLORS.success }} />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(params.row);
            }}
            title={t("common.edit", "Edit")}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={
              <ToggleStatus 
                className="h-5 w-5" 
                style={{ 
                  color: params.row.status === "active" ? COLORS.error : COLORS.success 
                }} 
              />
            }
            onClick={(e) => {
              e.stopPropagation();
              handleStatusToggle(params.row);
            }}
            title={params.row.status === "active" ? t("common.deactivate", "Deactivate") : t("common.activate", "Activate")}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]">
        {/* Header with Search, Status Filter and Add Member Button */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          {/* Title with Count */}
          <div className="flex items-center gap-2 shrink-0">
            <h1
              className="text-2xl font-semibold"
              style={{ color: COLORS.textDark }}
            >
              {t("manageTeam.title", "Manage Team")}
            </h1>
            {(searchTerm || (statusFilter && statusFilter !== "all")) && (
              <span
                className="text-lg font-medium"
                style={{ color: COLORS.textMuted }}
              >
                ({filteredMembers.length})
              </span>
            )}
          </div>

          {/* Search, Filter and Add Member */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="w-full sm:w-80">
              <div className="h-[21px] mb-1.5"></div>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: COLORS.textMuted }}
                >
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("manageTeam.searchPlaceholder", "Search By Name, Email Or Contact...")}
                  className="block w-full rounded-lg pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:outline-none"
                  style={{
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textDark,
                    backgroundColor: COLORS.surface,
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                    style={{ color: COLORS.textMuted }}
                  >
                    <CloseCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Dropdown */}
            <div className="w-full sm:w-[200px]">
              <Select
                label={t("manageTeam.statusLabel", "Status")}
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                placeholder={t("manageTeam.status", "Status")}
                fullWidth
              />
            </div>

            {/* Add Member Button */}
            <div className="flex items-end">
              <Button
                variant="accent"
                rounded
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleAddMember}
                className="shrink-0"
              >
                {t("manageTeam.addMember", "Add member")}
              </Button>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <DataTable
          rows={filteredMembers}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
        />
      </div>

      {/* Status Change Confirmation Popup */}
      <Popup
        isOpen={statusPopup.isOpen}
        onClose={handleStatusCancel}
        title={t("manageTeam.confirmStatusChange", "Confirm Status Change")}
        size="sm"
        showCloseButton={true}
      >
        <div>
          <p className="text-base mb-8" style={{ color: COLORS.textDark }}>
            {getStatusChangeMessage()}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="cancel" rounded onClick={handleStatusCancel}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="accent" rounded onClick={handleStatusConfirm}>
              {t("common.confirm", "Confirm")}
            </Button>
          </div>
        </div>
      </Popup>

    </Layout>
  );
};

export default ManageTeam;
