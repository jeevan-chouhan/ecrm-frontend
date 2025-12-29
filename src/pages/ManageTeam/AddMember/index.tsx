import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Layout, Button, Input, Select, PhoneInput, MultiSelect } from "../../../components";
import { ArrowLeft } from "../../../assets";
import {
  COLORS,
  ROUTES,
  roleOptions,
  adminOptions,
  managerOptions,
  countryOptions,
  universityOptions,
  mockTeamMembers,
} from "../../../constants";

// Form values interface
export interface AddMemberFormValues {
  name: string;
  email: string;
  contactNumber: string;
  role: string;
  adminId: string;
  managerId: string;
  assignedCountries: string[];
  assignedUniversities: string[];
}

// Default initial form values
const defaultInitialValues: AddMemberFormValues = {
  name: "",
  email: "",
  contactNumber: "",
  role: "",
  adminId: "",
  managerId: "",
  assignedCountries: [],
  assignedUniversities: [],
};

const AddMember = () => {
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();

  // Check if we're in edit mode
  const isEditMode = Boolean(memberId);

  // Find member data for edit mode
  const memberData = useMemo(() => {
    if (!memberId) return null;
    return mockTeamMembers.find((m) => m.id === memberId) || null;
  }, [memberId]);

  // Prepare initial values based on mode
  const initialValues = useMemo<AddMemberFormValues>(() => {
    if (isEditMode && memberData) {
      return {
        name: memberData.name || "",
        email: memberData.email || "",
        contactNumber: memberData.mobileNo?.replace("+", "") || "",
        role: memberData.role?.toLowerCase() || "",
        adminId: "admin1", // Default admin ID (in real app, get from member data)
        managerId: "carlos", // Default manager ID (in real app, get from member data)
        assignedCountries: ["usa", "uk"], // Mock data (in real app, get from member data)
        assignedUniversities: ["harvard", "mit"], // Mock data (in real app, get from member data)
      };
    }
    return defaultInitialValues;
  }, [isEditMode, memberData]);

  // Dynamic validation schema based on role
  const getValidationSchema = (role: string) => {
    const baseSchema = {
      name: Yup.string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .required("Name is required"),
      email: Yup.string()
        .trim()
        .email("Please enter a valid email")
        .required("Email is required"),
      contactNumber: Yup.string()
        .min(8, "Contact number must be at least 8 digits")
        .required("Contact number is required"),
      role: Yup.string().required("Role is required"),
      assignedCountries: Yup.array()
        .min(1, "At least one country is required")
        .required("Assigned country is required"),
      assignedUniversities: Yup.array()
        .min(1, "At least one university is required")
        .required("Assigned university is required"),
    };

    // Role-based validation
    if (role === "counselor") {
      return Yup.object().shape({
        ...baseSchema,
        managerId: Yup.string().required("Manager is required"),
      });
    } else if (role === "manager" || role === "billing") {
      return Yup.object().shape({
        ...baseSchema,
        adminId: Yup.string().required("Admin is required"),
      });
    }
    
    // Admin/Primary Admin - no admin/manager field required
    return Yup.object().shape(baseSchema);
  };

  // Formik hook
  const formik = useFormik<AddMemberFormValues>({
    initialValues,
    validationSchema: getValidationSchema(initialValues.role),
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values) => {
      if (isEditMode) {
        console.log("Update member:", memberId, values);
      } else {
        console.log("Add member:", values);
      }
      navigate(ROUTES.MANAGE_TEAM);
    },
  });

  // Handle form submit with touch all fields
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with current role's schema
    const errors = await formik.validateForm();
    
    // Touch all fields to show validation errors
    const touchedFields: Record<string, boolean> = {
      name: true,
      email: true,
      contactNumber: true,
      role: true,
      adminId: true,
      managerId: true,
      assignedCountries: true,
      assignedUniversities: true,
    };
    await formik.setTouched(touchedFields, true);
    
    // Check if form is valid
    if (Object.keys(errors).length === 0) {
      formik.submitForm();
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(ROUTES.MANAGE_TEAM);
  };

  // Check if role requires admin field (Manager, Billing)
  const showAdminField = formik.values.role === "manager" || formik.values.role === "billing";
  
  // Check if role requires manager field (Counselor)
  const showManagerField = formik.values.role === "counselor";

  // Validate field error based on current role
  const getAdminError = () => {
    if (showAdminField && formik.submitCount > 0 && formik.errors.adminId) {
      return formik.errors.adminId;
    }
    return undefined;
  };

  const getManagerError = () => {
    if (showManagerField && formik.submitCount > 0 && formik.errors.managerId) {
      return formik.errors.managerId;
    }
    return undefined;
  };

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]">
        {/* Header with Back Button and Title */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="accent"
            size="sm"
            rounded
            icon={<ArrowLeft className="h-5 w-5" />}
            onClick={handleBack}
            className="shrink-0"
          />
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {isEditMode ? "Edit Member" : "Add New Member"}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-6">
            {/* Row 1: Name, Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name"
                label={<>Name <span style={{ color: COLORS.error }}>*</span></>}
                placeholder="Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.submitCount > 0 && formik.errors.name ? formik.errors.name : undefined}
                fullWidth
              />
              <Input
                name="email"
                label={<>Email <span style={{ color: COLORS.error }}>*</span></>}
                placeholder="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.submitCount > 0 && formik.errors.email ? formik.errors.email : undefined}
                fullWidth
              />
            </div>

            {/* Row 2: Contact Number, Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PhoneInput
                label={<>Contact Number <span style={{ color: COLORS.error }}>*</span></>}
                placeholder="Contact Number"
                value={formik.values.contactNumber}
                onChange={(value) => formik.setFieldValue("contactNumber", value)}
                onBlur={() => formik.setFieldTouched("contactNumber", true)}
                error={formik.submitCount > 0 && formik.errors.contactNumber ? formik.errors.contactNumber : undefined}
                fullWidth
              />
              <Select
                label={<>Role <span style={{ color: COLORS.error }}>*</span></>}
                options={roleOptions}
                value={formik.values.role}
                onChange={(value) => {
                  formik.setFieldValue("role", value);
                  // Reset admin/manager when role changes
                  formik.setFieldValue("adminId", "");
                  formik.setFieldValue("managerId", "");
                }}
                placeholder="Select Role"
                error={formik.submitCount > 0 && formik.errors.role ? formik.errors.role : undefined}
                fullWidth
              />
            </div>

            {/* Row 3: Admin/Manager (conditional) and Assigned Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Show Admin field for Manager and Billing roles */}
              {showAdminField && (
                <Select
                  label={<>Admin <span style={{ color: COLORS.error }}>*</span></>}
                  options={adminOptions}
                  value={formik.values.adminId}
                  onChange={(value) => formik.setFieldValue("adminId", value)}
                  placeholder="Select Admin"
                  error={getAdminError()}
                  fullWidth
                  searchable
                />
              )}
              
              {/* Show Manager field for Counselor role */}
              {showManagerField && (
                <Select
                  label={<>Manager <span style={{ color: COLORS.error }}>*</span></>}
                  options={managerOptions}
                  value={formik.values.managerId}
                  onChange={(value) => formik.setFieldValue("managerId", value)}
                  placeholder="Select Manager"
                  error={getManagerError()}
                  fullWidth
                  searchable
                />
              )}

              <MultiSelect
                label={<>Assigned Country <span style={{ color: COLORS.error }}>*</span></>}
                options={countryOptions}
                value={formik.values.assignedCountries}
                onChange={(values) => formik.setFieldValue("assignedCountries", values)}
                onBlur={() => formik.setFieldTouched("assignedCountries", true)}
                placeholder="Select Assigned Country"
                error={
                  formik.submitCount > 0 && formik.errors.assignedCountries
                    ? String(formik.errors.assignedCountries)
                    : undefined
                }
                fullWidth
                searchable
              />
            </div>

            {/* Row 4: Assigned University */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelect
                label={<>Assigned University <span style={{ color: COLORS.error }}>*</span></>}
                options={universityOptions}
                value={formik.values.assignedUniversities}
                onChange={(values) => formik.setFieldValue("assignedUniversities", values)}
                onBlur={() => formik.setFieldTouched("assignedUniversities", true)}
                placeholder="Select Assigned University"
                error={
                  formik.submitCount > 0 && formik.errors.assignedUniversities
                    ? String(formik.errors.assignedUniversities)
                    : undefined
                }
                fullWidth
                searchable
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="cancel" rounded onClick={handleBack}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" rounded>
              {isEditMode ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddMember;
