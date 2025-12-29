import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Layout,
  Button,
  Input,
  MultiSelect,
  DataTable,
  Popup,
} from "../../../components";
import { ArrowLeft, ToggleStatus } from "../../../assets";
import {
  COLORS,
  ROUTES,
  mockTeamMemberDetail,
  managerOptions,
  counselorOptions,
  countryOptions,
  universityOptions,
  mockTeamData,
  type TeamMemberDetail,
} from "../../../constants";

// Stats Card Component
const StatsCard = ({ label, value }: { label: string; value: number }) => (
  <div
    className="flex flex-col items-center p-4 rounded-lg"
    style={{ border: `1px solid ${COLORS.border}` }}
  >
    <span
      className="text-xs text-center mb-1"
      style={{ color: COLORS.textMuted }}
    >
      {label}
    </span>
    <span className="text-2xl font-semibold" style={{ color: COLORS.textDark }}>
      {value}
    </span>
  </div>
);

// DataTable columns for universities
const universityColumns: GridColDef[] = [
  {
    field: "name",
    headerName: "Universities",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "count",
    headerName: "No. of Successful Applicants",
    flex: 1,
    minWidth: 200,
    align: "right",
    headerAlign: "right",
    renderCell: (params) => params.value.toString().padStart(2, "0"),
  },
];

const ViewMember = () => {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();
  const [isDeactivatePopupOpen, setIsDeactivatePopupOpen] = useState(false);

  // Find member from mock data (in real app, fetch from API)
  const findMemberInfo = () => {
    for (const roleGroup of mockTeamData) {
      const found = roleGroup.members.find((m) => m.id === memberId);
      if (found) {
        return {
          ...mockTeamMemberDetail,
          id: found.id,
          name: found.name,
          memberId: found.memberId,
          role: roleGroup.role.toLowerCase(),
        };
      }
    }
    return mockTeamMemberDetail;
  };

  const member: TeamMemberDetail = findMemberInfo();

  // Prepare university rows for DataTable
  const universityRows = member.universities.map((uni, index) => ({
    id: index,
    name: uni.name,
    count: uni.count,
  }));

  // Mock data for view mode (in real app, this would come from API)
  const viewData = {
    email: member.email,
    contactNumber: member.contactNumber,
    role: member.role,
    managers: ["carlos", "sarah"], // Mock managers for admin view
    counselors: ["bob", "sara", "jon"], // Mock counselors for manager view
    assignedCountries: ["usa", "uk", "canada"],
    assignedUniversities: ["harvard", "toronto", "mit"],
  };

  const handleBack = () => {
    navigate(ROUTES.MANAGE_TEAM);
  };

  const handleDeactivateClick = () => {
    setIsDeactivatePopupOpen(true);
  };

  const handleDeactivateConfirm = () => {
    console.log("Deactivate member:", member.id);
    // Add deactivation logic here
    setIsDeactivatePopupOpen(false);
    navigate(ROUTES.MANAGE_TEAM);
  };

  const handleDeactivateCancel = () => {
    setIsDeactivatePopupOpen(false);
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Render role-based fields
  // View mode:
  // - Admin/Primary Admin: Show Manager field (multiselect)
  // - Manager: Show Counselor field (multiselect)
  // - Counselor: Hide field (just show country and university)
  const renderRoleBasedFields = () => {
    const role = member.role.toLowerCase();

    if (role === "admin" || role === "primary admin" || role === "admin-primary") {
      return (
        <>
          {/* Managers (MultiSelect for Admin) */}
          <div className="mb-4">
            <MultiSelect
              label="Managers"
              options={managerOptions}
              value={viewData.managers}
              disabled
              fullWidth
            />
          </div>
          {/* Assigned Country & University */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelect
              label="Assigned Country"
              options={countryOptions}
              value={viewData.assignedCountries}
              disabled
              fullWidth
            />
            <MultiSelect
              label="Assigned University"
              options={universityOptions}
              value={viewData.assignedUniversities}
              disabled
              fullWidth
            />
          </div>
        </>
      );
    }

    if (role === "manager") {
      return (
        <>
          {/* Counselors (MultiSelect for Manager) */}
          <div className="mb-4">
            <MultiSelect
              label="Counselors"
              options={counselorOptions}
              value={viewData.counselors}
              disabled
              fullWidth
            />
          </div>
          {/* Assigned Country & University */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelect
              label="Assigned Country"
              options={countryOptions}
              value={viewData.assignedCountries}
              disabled
              fullWidth
            />
            <MultiSelect
              label="Assigned University"
              options={universityOptions}
              value={viewData.assignedUniversities}
              disabled
              fullWidth
            />
          </div>
        </>
      );
    }

    // Counselor or other roles - hide manager/counselor fields, only show country & university
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MultiSelect
          label="Assigned Country"
          options={countryOptions}
          value={viewData.assignedCountries}
          disabled
          fullWidth
        />
        <MultiSelect
          label="Assigned University"
          options={universityOptions}
          value={viewData.assignedUniversities}
          disabled
          fullWidth
        />
      </div>
    );
  };

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]">
        {/* Back Button & Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="accent"
              icon={<ArrowLeft className="h-5 w-5" />}
              onClick={handleBack}
              rounded
            />
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{ color: COLORS.textDark }}
              >
                {member.name}
              </h1>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                ID: {member.memberId}
              </p>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                Role: {getRoleDisplayName(member.role)}
              </p>
            </div>
          </div>
          {/* Deactivate Icon Button */}
          <Button
            variant="ghost"
            size="sm"
            icon={<ToggleStatus className="h-5 w-5" style={{ color: COLORS.error }} />}
            onClick={handleDeactivateClick}
            title="Deactivate"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard label="Total Applicants" value={member.totalApplicants} />
          <StatsCard
            label="In Progress Applicants"
            value={member.inProgressApplicants}
          />
          <StatsCard
            label="Successful Applicants"
            value={member.successfulApplicants}
          />
          <StatsCard
            label="Rejected Applicants"
            value={member.rejectedApplicants}
          />
        </div>

        {/* Two Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: University List */}
          <div
            className="rounded-lg p-4"
            style={{ border: `1px solid ${COLORS.border}` }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: COLORS.textDark }}
            >
              University List
            </h2>
            <DataTable
              rows={universityRows}
              columns={universityColumns}
              hideFooter
              disableRowSelectionOnClick
            />
          </div>

          {/* Card 2: Member Details (View Mode) */}
          <div
            className="rounded-lg p-4"
            style={{ border: `1px solid ${COLORS.border}` }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: COLORS.textDark }}
            >
              Member Details
            </h2>

            {/* Email, Contact Number & Role */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="Email"
                type="text"
                value={viewData.email}
                disabled
                fullWidth
              />
              <Input
                label="Contact Number"
                type="text"
                value={viewData.contactNumber}
                disabled
                fullWidth
              />
              <Input
                label="Role"
                type="text"
                value={getRoleDisplayName(viewData.role)}
                disabled
                fullWidth
              />
            </div>

            {/* Role-based fields */}
            {renderRoleBasedFields()}
          </div>
        </div>
      </div>

      {/* Deactivate Confirmation Popup */}
      <Popup
        isOpen={isDeactivatePopupOpen}
        onClose={handleDeactivateCancel}
        title="Confirm Status Change"
        size="sm"
        showCloseButton={true}
      >
        <div>
          <p className="text-base mb-8" style={{ color: COLORS.textDark }}>
            Are you sure you want to change the status of{" "}
            <strong>{member.name}</strong> from Active to Inactive?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="cancel" rounded onClick={handleDeactivateCancel}>
              Cancel
            </Button>
            <Button variant="accent" rounded onClick={handleDeactivateConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Popup>
    </Layout>
  );
};

export default ViewMember;
