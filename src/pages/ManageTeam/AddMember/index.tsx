import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { memberId } = useParams<{ memberId: string }>();

  // Check if we're in edit mode
  const isEditMode = Boolean(memberId);

  // Find member data for edit mode
  const memberData = useMemo(() => {
    if (!memberId) return null;
    return mockTeamMembers.find((m) => m.id === memberId) || null;
  }, [memberId]);

  // Helper function to find country value by label
  const getCountryValueByLabel = (label: string): string | null => {
    const country = countryOptions.find(
      (c) => c.label.toLowerCase() === label.toLowerCase()
    );
    return country?.value || null;
  };

  // Helper function to find university value by label
  const getUniversityValueByLabel = (label: string): string | null => {
    const university = universityOptions.find(
      (u) => u.label.toLowerCase() === label.toLowerCase()
    );
    return university?.value || null;
  };

  // Get original country and university values for edit mode (these will be disabled)
  const originalCountryValue = useMemo(() => {
    if (isEditMode && memberData?.country) {
      return getCountryValueByLabel(memberData.country);
    }
    return null;
  }, [isEditMode, memberData]);

  const originalUniversityValue = useMemo(() => {
    if (isEditMode && memberData?.university) {
      return getUniversityValueByLabel(memberData.university);
    }
    return null;
  }, [isEditMode, memberData]);

  // Prepare initial values based on mode
  const initialValues = useMemo<AddMemberFormValues>(() => {
    if (isEditMode && memberData) {
      // Get country and university values from member data
      const countryValue = getCountryValueByLabel(memberData.country);
      const universityValue = getUniversityValueByLabel(memberData.university);
      
      return {
        name: memberData.name || "",
        email: memberData.email || "",
        contactNumber: memberData.mobileNo?.replace("+", "") || "",
        role: memberData.role?.toLowerCase() || "",
        adminId: "", // In real app, get from member data
        managerId: "", // In real app, get from member data
        assignedCountries: countryValue ? [countryValue] : [],
        assignedUniversities: universityValue ? [universityValue] : [],
      };
    }
    return defaultInitialValues;
  }, [isEditMode, memberData]);

  // Dynamic validation schema based on role
  const getValidationSchema = (role: string) => {
    const baseSchema = {
      name: Yup.string()
        .trim()
        .min(2, t("validation.nameMinLength", "Name must be at least 2 characters"))
        .required(t("validation.nameRequired", "Name is required")),
      email: Yup.string()
        .trim()
        .email(t("validation.invalidEmail", "Please enter a valid email"))
        .required(t("validation.emailRequired", "Email is required")),
      contactNumber: Yup.string()
        .min(8, t("validation.contactMinLength", "Contact number must be at least 8 digits"))
        .required(t("validation.contactRequired", "Contact number is required")),
      role: Yup.string().required(t("validation.roleRequired", "Role is required")),
      assignedCountries: Yup.array()
        .min(1, t("validation.countryRequired", "At least one country is required"))
        .required(t("validation.assignedCountryRequired", "Assigned country is required")),
      assignedUniversities: Yup.array()
        .min(1, t("validation.universityRequired", "At least one university is required"))
        .required(t("validation.assignedUniversityRequired", "Assigned university is required")),
    };

    // Role-based validation
    if (role === "counselor") {
      return Yup.object().shape({
        ...baseSchema,
        managerId: Yup.string().required(t("validation.managerRequired", "Manager is required")),
      });
    } else if (role === "manager" || role === "billing") {
      return Yup.object().shape({
        ...baseSchema,
        adminId: Yup.string().required(t("validation.adminRequired", "Admin is required")),
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
            {isEditMode ? t("manageTeam.editMember", "Edit Member") : t("manageTeam.addNewMember", "Add New Member")}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-6">
            {/* Row 1: Name, Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name"
                label={<>{t("manageTeam.name", "Name")} <span style={{ color: COLORS.error }}>*</span></>}
                placeholder={t("manageTeam.enterName", "Enter name")}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.submitCount > 0 && formik.errors.name ? formik.errors.name : undefined}
                fullWidth
              />
              <Input
                name="email"
                label={<>{t("manageTeam.email", "Email")} <span style={{ color: COLORS.error }}>*</span></>}
                placeholder={t("manageTeam.enterEmail", "Enter email")}
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
                label={<>{t("manageTeam.contactNumber", "Contact Number")} <span style={{ color: COLORS.error }}>*</span></>}
                placeholder={t("manageTeam.contactNumber", "Contact Number")}
                value={formik.values.contactNumber}
                onChange={(value) => formik.setFieldValue("contactNumber", value)}
                onBlur={() => formik.setFieldTouched("contactNumber", true)}
                error={formik.submitCount > 0 && formik.errors.contactNumber ? formik.errors.contactNumber : undefined}
                fullWidth
              />
              <Select
                label={<>{t("manageTeam.role", "Role")} <span style={{ color: COLORS.error }}>*</span></>}
                options={roleOptions}
                value={formik.values.role}
                onChange={(value) => {
                  formik.setFieldValue("role", value);
                  // Reset admin/manager when role changes
                  formik.setFieldValue("adminId", "");
                  formik.setFieldValue("managerId", "");
                }}
                placeholder={t("manageTeam.selectRole", "Select Role")}
                error={formik.submitCount > 0 && formik.errors.role ? formik.errors.role : undefined}
                fullWidth
              />
            </div>

            {/* Row 3: Admin/Manager (conditional) and Assigned Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Show Admin field for Manager and Billing roles */}
              {showAdminField && (
                <Select
                  label={<>{t("manageTeam.admin", "Admin")} <span style={{ color: COLORS.error }}>*</span></>}
                  options={adminOptions}
                  value={formik.values.adminId}
                  onChange={(value) => formik.setFieldValue("adminId", value)}
                  placeholder={t("manageTeam.selectAdmin", "Select Admin")}
                  error={getAdminError()}
                  fullWidth
                  searchable
                />
              )}
              
              {/* Show Manager field for Counselor role */}
              {showManagerField && (
                <Select
                  label={<>{t("manageTeam.manager", "Manager")} <span style={{ color: COLORS.error }}>*</span></>}
                  options={managerOptions}
                  value={formik.values.managerId}
                  onChange={(value) => formik.setFieldValue("managerId", value)}
                  placeholder={t("manageTeam.selectManager", "Select Manager")}
                  error={getManagerError()}
                  fullWidth
                  searchable
                />
              )}

              <MultiSelect
                label={<>{t("manageTeam.assignedCountry", "Assigned Country")} <span style={{ color: COLORS.error }}>*</span></>}
                options={countryOptions}
                value={formik.values.assignedCountries}
                onChange={(values) => formik.setFieldValue("assignedCountries", values)}
                onBlur={() => formik.setFieldTouched("assignedCountries", true)}
                placeholder={t("manageTeam.selectAssignedCountry", "Select assigned country")}
                error={
                  formik.submitCount > 0 && formik.errors.assignedCountries
                    ? String(formik.errors.assignedCountries)
                    : undefined
                }
                fullWidth
                searchable
                disabledValues={isEditMode && originalCountryValue ? [originalCountryValue] : []}
              />
            </div>

            {/* Row 4: Assigned University */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelect
                label={<>{t("manageTeam.assignedUniversity", "Assigned University")} <span style={{ color: COLORS.error }}>*</span></>}
                options={universityOptions}
                value={formik.values.assignedUniversities}
                onChange={(values) => formik.setFieldValue("assignedUniversities", values)}
                onBlur={() => formik.setFieldTouched("assignedUniversities", true)}
                placeholder={t("manageTeam.selectAssignedUniversity", "Select assigned university")}
                error={
                  formik.submitCount > 0 && formik.errors.assignedUniversities
                    ? String(formik.errors.assignedUniversities)
                    : undefined
                }
                fullWidth
                searchable
                disabledValues={isEditMode && originalUniversityValue ? [originalUniversityValue] : []}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="cancel" rounded onClick={handleBack}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" variant="accent" rounded>
              {isEditMode ? t("common.update", "Update") : t("common.save", "Save")}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddMember;
