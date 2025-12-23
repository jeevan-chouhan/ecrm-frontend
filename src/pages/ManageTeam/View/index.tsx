import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Layout,
  Button,
  Input,
  Select,
  MultiSelect,
  DataTable,
  Popup,
} from "../../../components";
import { ArrowLeft, UserMinus } from "../../../assets";
import {
  COLORS,
  ROUTES,
  mockTeamMemberDetail,
  roleOptions,
  adminOptions,
  managerOptions,
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

  const [formData, setFormData] = useState({
    role: member.role,
    adminId: member.adminId,
    managerId: member.managerId,
    assignedCountry: member.assignedCountry,
    assignedUniversities: member.assignedUniversities,
  });

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

  const handleSave = () => {
    console.log("Save member:", { ...member, ...formData });
    // Add save logic here
    navigate(ROUTES.MANAGE_TEAM);
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
                Role: {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </p>
            </div>
          </div>
          {/* Deactivate Icon Button */}
          <Button
            variant="ghost"
            icon={<UserMinus className="h-5 w-5" />}
            onClick={handleDeactivateClick}
            title="Deactivate Member"
            rounded
            style={{ color: COLORS.error }}
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

        {/* Universities DataTable */}
        <div className="mb-6">
          <DataTable
            rows={universityRows}
            columns={universityColumns}
            hideFooter
            disableRowSelectionOnClick
          />
        </div>

        {/* Email, Contact Number & Role */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            label="Email"
            type="text"
            value={member.email}
            disabled
            fullWidth
          />
          <Input
            label="Contact Number"
            type="text"
            value={member.contactNumber}
            disabled
            fullWidth
          />
          <Select
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value })}
            fullWidth
          />
        </div>

        {/* Admin, Manager & Assigned Country */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select
            label="Admin"
            options={adminOptions}
            value={formData.adminId}
            onChange={(value) => setFormData({ ...formData, adminId: value })}
            fullWidth
          />
          <Select
            label="Manager"
            options={managerOptions}
            value={formData.managerId}
            onChange={(value) => setFormData({ ...formData, managerId: value })}
            fullWidth
          />
          <Select
            label="Assigned Country"
            options={countryOptions}
            value={formData.assignedCountry}
            onChange={(value) =>
              setFormData({ ...formData, assignedCountry: value })
            }
            fullWidth
          />
        </div>

        {/* Assigned University */}
        <div className="mb-6">
          <MultiSelect
            label="Assigned University"
            options={universityOptions}
            value={formData.assignedUniversities}
            onChange={(values) =>
              setFormData({ ...formData, assignedUniversities: values })
            }
            fullWidth
          />
        </div>

        {/* Action Buttons - Only Save Changes */}
        <div className="flex justify-end pt-4">
          <Button variant="accent" rounded onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Deactivate Confirmation Popup */}
      <Popup
        isOpen={isDeactivatePopupOpen}
        onClose={handleDeactivateCancel}
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center">
          <p className="text-base mb-6" style={{ color: COLORS.textDark }}>
            Are you sure you want to deactivate the account of{" "}
            <strong>{member.name}</strong>?
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
    </Layout>
  );
};

export default ViewMember;
