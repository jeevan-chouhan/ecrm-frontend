import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Layout,
  Button,
  DataTable,
  Select,
  Popup,
} from "../../components";
import { Eye, Plus, Search, CloseCircle, UserMinus } from "../../assets";
import {
  COLORS,
  ROUTES,
  statusFilterOptions,
  mockTeamMembers,
  type TeamMember,
} from "../../constants";
import AddMember, { type AddMemberFormValues } from "./AddMember";

const ManageTeam = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deactivatePopup, setDeactivatePopup] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
  }>({ isOpen: false, member: null });
  const [addMemberPopup, setAddMemberPopup] = useState(false);

  // Filter logic
  const filteredMembers = useMemo(() => {
    return mockTeamMembers.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.mobileNo.includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const handleView = (member: TeamMember) => {
    navigate(`${ROUTES.MANAGE_TEAM}/${member.id}`);
  };

  const handleDeactivateClick = (member: TeamMember) => {
    setDeactivatePopup({ isOpen: true, member });
  };

  const handleDeactivateConfirm = () => {
    if (deactivatePopup.member) {
      console.log("Deactivate member:", deactivatePopup.member);
      // Add deactivation logic here
    }
    setDeactivatePopup({ isOpen: false, member: null });
  };

  const handleDeactivateCancel = () => {
    setDeactivatePopup({ isOpen: false, member: null });
  };

  const handleAddMemberOpen = () => {
    setAddMemberPopup(true);
  };

  const handleAddMemberClose = () => {
    setAddMemberPopup(false);
  };

  const handleAddMemberSubmit = (values: AddMemberFormValues) => {
    console.log("Add member:", values);
    // Add member creation logic here (API call, etc.)
  };

  // DataTable columns
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <div className="flex flex-col">
          <span style={{ color: COLORS.textDark, fontWeight: 500 }}>
            {params.row.name}
          </span>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            {params.row.memberId}
          </span>
        </div>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.2,
      minWidth: 200,
    },
    {
      field: "mobileNo",
      headerName: "Mobile No",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 0.6,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-1 mt-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleView(params.row);
            }}
            title="View"
            rounded
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<UserMinus className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeactivateClick(params.row);
            }}
            title="Deactivate"
            rounded
            style={{ color: COLORS.error }}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]">
        {/* Header with Add Member Button */}
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-2xl font-semibold"
            style={{ color: COLORS.textDark }}
          >
            Manage Team
          </h1>
          <Button
            variant="accent"
            rounded
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleAddMemberOpen}
          >
            Add member
          </Button>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
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
              placeholder="Search by name, email or mobile..."
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

          {/* Status Filter Dropdown */}
          <div className="w-full sm:w-[200px]">
            <Select
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              fullWidth
            />
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

      {/* Deactivate Confirmation Popup */}
      <Popup
        isOpen={deactivatePopup.isOpen}
        onClose={handleDeactivateCancel}
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center">
          <p className="text-base mb-6" style={{ color: COLORS.textDark }}>
            Are you sure you want to deactivate the account of{" "}
            <strong>{deactivatePopup.member?.name}</strong>?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="cancel" rounded onClick={handleDeactivateCancel}>
              No
            </Button>
            <Button variant="accent" rounded onClick={handleDeactivateConfirm}>
              Yes
            </Button>
          </div>
        </div>
      </Popup>

      {/* Add Member Popup */}
      <AddMember
        isOpen={addMemberPopup}
        onClose={handleAddMemberClose}
        onSubmit={handleAddMemberSubmit}
      />
    </Layout>
  );
};

export default ManageTeam;
