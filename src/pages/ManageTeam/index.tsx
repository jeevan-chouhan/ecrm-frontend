import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Layout,
  Button,
  DataTable,
  Select,
  Popup,
  Input,
  PhoneInput,
} from "../../components";
import { Eye, Plus, Search, CloseCircle, UserMinus, Close } from "../../assets";
import {
  COLORS,
  ROUTES,
  statusFilterOptions,
  mockTeamMembers,
  roleOptions,
  adminOptions,
  countryOptions,
  type TeamMember,
} from "../../constants";
import { isValidEmail, isValidPhone } from "../../utils/regex";

interface AddMemberForm {
  name: string;
  email: string;
  contactNumber: string;
  role: string;
  adminId: string;
  assignedCountry: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  contactNumber?: string;
  role?: string;
  adminId?: string;
  assignedCountry?: string;
}

const initialFormState: AddMemberForm = {
  name: "",
  email: "",
  contactNumber: "",
  role: "counselor",
  adminId: "",
  assignedCountry: "",
};

const ManageTeam = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deactivatePopup, setDeactivatePopup] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
  }>({ isOpen: false, member: null });
  const [addMemberPopup, setAddMemberPopup] = useState(false);
  const [addMemberForm, setAddMemberForm] =
    useState<AddMemberForm>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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

  const handleAddMember = () => {
    setAddMemberForm(initialFormState);
    setFormErrors({});
    setAddMemberPopup(true);
  };

  const handleAddMemberClose = () => {
    setAddMemberPopup(false);
    setAddMemberForm(initialFormState);
    setFormErrors({});
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Name validation
    if (!addMemberForm.name.trim()) {
      errors.name = "Name is required";
    } else if (addMemberForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!addMemberForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(addMemberForm.email)) {
      errors.email = "Please enter a valid email";
    }

    // Contact number validation
    if (!addMemberForm.contactNumber || addMemberForm.contactNumber.length < 5) {
      errors.contactNumber = "Contact number is required";
    } else if (!isValidPhone(addMemberForm.contactNumber)) {
      errors.contactNumber = "Please enter a valid contact number";
    }

    // Role validation
    if (!addMemberForm.role) {
      errors.role = "Role is required";
    }

    // Admin validation
    if (!addMemberForm.adminId) {
      errors.adminId = "Admin is required";
    }

    // Country validation
    if (!addMemberForm.assignedCountry) {
      errors.assignedCountry = "Assigned country is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMemberSubmit = () => {
    if (validateForm()) {
      console.log("Add member:", addMemberForm);
      // Add member creation logic here
      handleAddMemberClose();
    }
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

  // Role options for add member (default to Counselor)
  const addMemberRoleOptions = roleOptions.map((opt) => ({
    ...opt,
    label: opt.value === "counselor" ? `Role - ${opt.label}` : opt.label,
  }));

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
            onClick={handleAddMember}
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
      <Popup
        isOpen={addMemberPopup}
        onClose={handleAddMemberClose}
        size="full"
        showCloseButton={false}
      >
        <div>
          {/* Header with title and close button */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-semibold"
              style={{ color: COLORS.textDark }}
            >
              Add new member
            </h2>
            <button
              onClick={handleAddMemberClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
              style={{ color: COLORS.textMuted }}
            >
              <Close className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Row 1: Name, Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Name"
                value={addMemberForm.name}
                onChange={(e) =>
                  setAddMemberForm({ ...addMemberForm, name: e.target.value })
                }
                error={formErrors.name}
                fullWidth
              />
              <Input
                placeholder="Email"
                type="email"
                value={addMemberForm.email}
                onChange={(e) =>
                  setAddMemberForm({ ...addMemberForm, email: e.target.value })
                }
                error={formErrors.email}
                fullWidth
              />
            </div>

            {/* Row 2: Contact Number, Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PhoneInput
                placeholder="Contact Number"
                value={addMemberForm.contactNumber}
                onChange={(value) =>
                  setAddMemberForm({
                    ...addMemberForm,
                    contactNumber: value,
                  })
                }
                error={formErrors.contactNumber}
                fullWidth
              />
              <Input
                placeholder="System Generated Password"
                disabled
                fullWidth
              />
            </div>

            {/* Row 3: Role, Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                options={addMemberRoleOptions}
                value={addMemberForm.role}
                onChange={(value) =>
                  setAddMemberForm({ ...addMemberForm, role: value })
                }
                placeholder="Role - Counselor"
                error={formErrors.role}
                fullWidth
              />
              <Select
                options={adminOptions}
                value={addMemberForm.adminId}
                onChange={(value) =>
                  setAddMemberForm({ ...addMemberForm, adminId: value })
                }
                placeholder="Select Admin"
                error={formErrors.adminId}
                fullWidth
              />
            </div>

            {/* Row 4: Assigned Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                options={countryOptions}
                value={addMemberForm.assignedCountry}
                onChange={(value) =>
                  setAddMemberForm({ ...addMemberForm, assignedCountry: value })
                }
                placeholder="Select Assigned Country"
                error={formErrors.assignedCountry}
                fullWidth
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="cancel" rounded onClick={handleAddMemberClose}>
              Cancel
            </Button>
            <Button variant="accent" rounded onClick={handleAddMemberSubmit}>
              Add
            </Button>
          </div>
        </div>
      </Popup>
    </Layout>
  );
};

export default ManageTeam;
