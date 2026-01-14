import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { Layout, Button, Input, Select, PhoneInput, MultiSelect } from "../../../components";
import { ArrowLeft } from "../../../assets";
import {
  COLORS,
  ROUTES,
} from "../../../constants";
import { useFilteredRoleOptions } from "../../../hooks";
import { userService } from "../../../services";
import type { 
  CountryItem, 
  UniversityItem, 
  AddMemberPayload, 
  UpdateMemberPayload,
  AdminItem,
  ManagerItem,
} from "../../../services";
import { handleApiError, getTeamMemberSchema } from "../../../utils";
import { useAppSelector, useAppDispatch } from "../../../redux/hooks";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { addToast } from "../../../redux/slices/toast/toastSlice";

// Form values interface
export interface AddMemberFormValues {
  name: string;
  email: string;
  password: string;
  countryCode: string;
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
  password: "",
  countryCode: "+91",
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
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { memberId } = useParams<{ memberId: string }>();

  // Get user from Redux (for agencyId)
  const { user } = useAppSelector((state) => state.auth);

  // Get member data from navigation state (for edit mode)
  const memberData = location.state?.memberData;

  // Check if we're in edit mode
  const isEditMode = Boolean(memberId);

  // State for countries and universities from API
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);

  // State for admins and managers from API
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  
  // Track if form has been submitted (to show validation errors)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Ref to prevent duplicate API calls
  const hasFetchedCountries = useRef(false);
  const hasFetchedAdmins = useRef(false);
  const hasFetchedManagers = useRef(false);

  // Get filtered role options based on user's permissions
  const filteredRoleOptions = useFilteredRoleOptions();

  // Convert API data to dropdown options
  const countryOptions = useMemo(() => 
    countries.map((country) => ({
      value: country.id.toString(),
      label: country.name,
    })), [countries]);

  const universityOptions = useMemo(() => 
    universities.map((uni) => ({
      value: uni.id.toString(),
      label: uni.name,
    })), [universities]);

  // Convert admin/manager data to dropdown options
  const adminOptions = useMemo(() => 
    admins.map((admin) => ({
      value: admin.id.toString(),
      label: admin.name,
    })), [admins]);

  const managerOptions = useMemo(() => 
    managers.map((manager) => ({
      value: manager.id.toString(),
      label: manager.name,
    })), [managers]);

  // Fetch countries from API
  const fetchCountries = useCallback(async () => {
    if (!user?.agencyId || hasFetchedCountries.current) return;
    
    hasFetchedCountries.current = true;
    setIsLoadingCountries(true);
    dispatch(showLoader());
    
    try {
      const response = await userService.getCountries(user.agencyId);
      // Handle response formats: [...], { data: [...] } or { status: "success", data: [...] }
      if (Array.isArray(response)) {
        setCountries(response);
      } else if (response.data) {
        setCountries(response.data);
      }
    } catch (error: any) {
      hasFetchedCountries.current = false; // Allow retry on error
      dispatch(addToast({ type: "error", message: error.message || "Failed to fetch countries" }));
    } finally {
      setIsLoadingCountries(false);
      dispatch(hideLoader());
    }
  }, [user?.agencyId, dispatch]);

  // Fetch universities from API
  const fetchUniversities = useCallback(async (countryId: number | null = null) => {
    setIsLoadingUniversities(true);
    
    try {
      const response = await userService.getUniversities({
        agencyId: user?.agencyId ?? null,
        countryId,
      });
      // Handle response formats: [...], { data: [...] } or { status: "success", data: [...] }
      if (Array.isArray(response)) {
        setUniversities(response);
      } else if (response.data) {
        setUniversities(response.data);
      }
    } catch (error: any) {
      dispatch(addToast({ type: "error", message: error.message || "Failed to fetch universities" }));
    } finally {
      setIsLoadingUniversities(false);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch admins from API
  const fetchAdmins = useCallback(async () => {
    if (!user?.agencyId || hasFetchedAdmins.current) return;
    
    hasFetchedAdmins.current = true;
    setIsLoadingAdmins(true);
    
    try {
      const response = await userService.getAdmins(user.agencyId);
      // Handle response formats: [...] or { data: [...] }
      if (Array.isArray(response)) {
        setAdmins(response);
      } else if ((response as any).data) {
        setAdmins((response as any).data);
      }
    } catch (error: any) {
      hasFetchedAdmins.current = false;
      dispatch(addToast({ type: "error", message: error.message || "Failed to fetch admins" }));
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch managers from API
  const fetchManagers = useCallback(async () => {
    if (!user?.agencyId || hasFetchedManagers.current) return;
    
    hasFetchedManagers.current = true;
    setIsLoadingManagers(true);
    
    try {
      const response = await userService.getManagers(user.agencyId);
      // Handle response formats: [...] or { data: [...] }
      if (Array.isArray(response)) {
        setManagers(response);
      } else if ((response as any).data) {
        setManagers((response as any).data);
      }
    } catch (error: any) {
      hasFetchedManagers.current = false;
      dispatch(addToast({ type: "error", message: error.message || "Failed to fetch managers" }));
    } finally {
      setIsLoadingManagers(false);
    }
  }, [user?.agencyId, dispatch]);

  // Fetch countries, admins, managers on mount
  useEffect(() => {
    fetchCountries();
    fetchAdmins();
    // fetchManagers();
  }, [fetchCountries, fetchAdmins, fetchManagers]);

  // Fetch universities when in edit mode with assigned countries
  useEffect(() => {
    if (isEditMode && memberData?.assignedCountries?.length > 0) {
      // Fetch universities for the first assigned country
      const countryId = memberData.assignedCountries[0].id;
      fetchUniversities(countryId);
    }
  }, [isEditMode, memberData, fetchUniversities]);

  // Prepare initial values based on mode
  const initialValues = useMemo<AddMemberFormValues>(() => {
    if (isEditMode && memberData) {
      // Build phone number with country code for react-phone-input-2
      const dialCode = memberData.countryCode?.replace("+", "") || "91";
      const fullPhone = `${dialCode}${memberData.contactNumber || ""}`;
      
      // Get admin ID from assignedAdmins array (first item)
      const adminId = memberData.assignedAdmins?.[0]?.id?.toString() || "";
      
      // Get manager ID from assignedManagers array (first item)
      const managerId = memberData.assignedManagers?.[0]?.id?.toString() || "";
      
      return {
        name: memberData.name || "",
        email: memberData.email || "",
        password: "", // Password not needed for edit
        countryCode: memberData.countryCode || "+91",
        contactNumber: fullPhone,
        role: memberData.role?.toLowerCase() || "",
        adminId,
        managerId,
        assignedCountries: memberData.assignedCountries?.map((c: { id: number }) => c.id.toString()) || [],
        assignedUniversities: memberData.assignedUniversities?.map((u: { id: number }) => u.id.toString()) || [],
      };
    }
    return defaultInitialValues;
  }, [isEditMode, memberData]);

  // Get validation schema based on role
  const getValidationSchema = useCallback((role: string) => {
    return getTeamMemberSchema(t, { role, isEditMode });
  }, [isEditMode, t]);

  // Formik hook
  const formik = useFormik<AddMemberFormValues>({
    initialValues,
    // Use validate function for dynamic validation based on current role
    validate: (values) => {
      try {
        getValidationSchema(values.role).validateSync(values, { abortEarly: false });
        return {};
      } catch (err: any) {
        const errors: Record<string, string> = {};
        if (err.inner) {
          err.inner.forEach((error: any) => {
            if (error.path && !errors[error.path]) {
              errors[error.path] = error.message;
            }
          });
        }
        return errors;
      }
    },
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      // Extract phone number without country code
      // react-phone-input-2 stores full number like "919876543210" for +91 9876543210
      const dialCode = values.countryCode.replace("+", ""); // Remove + to get "91"
      const phoneNumber = values.contactNumber.startsWith(dialCode) 
        ? values.contactNumber.slice(dialCode.length) 
        : values.contactNumber;

      // Handle edit mode
      if (isEditMode && memberId) {
        const updatePayload: UpdateMemberPayload = {
          name: values.name,
          email: values.email,
          countryCode: values.countryCode,
          contactNumber: phoneNumber,
          role: values.role.toUpperCase(),
          assignedCountries: values.assignedCountries.map((countryValue) => {
            const country = countries.find((c) => c.id.toString() === countryValue);
            return { id: parseInt(countryValue), name: country?.name || "" };
          }),
          assignedUniversities: values.assignedUniversities.map((uniValue) => {
            const university = universities.find((u) => u.id.toString() === uniValue);
            return { id: parseInt(uniValue), name: university?.name || "" };
          }),
        };

        dispatch(showLoader());
        try {
          const response = await userService.updateMember(
            { userId: parseInt(memberId), agencyId: user?.agencyId || 0 },
            updatePayload
          );
          if (response.status === "success") {
            dispatch(addToast({ type: "success", message: t("manageTeam.memberUpdatedSuccess", "Team member updated successfully") }));
            navigate(ROUTES.MANAGE_TEAM);
          }
        } catch (error: any) {
          const { message } = handleApiError(error);
          dispatch(addToast({ type: "error", message }));
        } finally {
          dispatch(hideLoader());
        }
        return;
      }

      // Build payload for API
      const payload: AddMemberPayload = {
        name: values.name,
        email: values.email,
        password: values.password,
        countryCode: values.countryCode,
        contactNumber: phoneNumber,
        role: values.role.toUpperCase(),
        agencyId: { id: user?.agencyId || 0 },
        assignedCountries: values.assignedCountries.map((countryValue) => {
          const country = countries.find((c) => c.id.toString() === countryValue);
          return { id: parseInt(countryValue), name: country?.name || "" };
        }),
        assignedUniversities: values.assignedUniversities.map((uniValue) => {
          const university = universities.find((u) => u.id.toString() === uniValue);
          return { id: parseInt(uniValue), name: university?.name || "" };
        }),
      };

      // Add assigned_admin for manager, counselor, billing roles (mandatory)
      // For admin/primary_admin roles, assigned_admin should be null
      const role = values.role.toLowerCase();
      if (role === "manager" || role === "counselor" || role === "billing") {
        if (values.adminId) {
          payload.assigned_admin = { id: parseInt(values.adminId) };
        }
      } else {
        // For admin/primary_admin - send null
        payload.assigned_admin = null;
      }

      // Add assigned_manager for counsellor role
      if (role === "counselor" && values.managerId) {
        payload.assigned_manager = { id: parseInt(values.managerId) };
      } else {
        payload.assigned_manager = null;
      }

      dispatch(showLoader());
      try {
        const response = await userService.addMember(payload);
        if (response.status === "success") {
          dispatch(addToast({ type: "success", message: t("manageTeam.memberAddedSuccess", "Team member added successfully") }));
      navigate(ROUTES.MANAGE_TEAM);
        }
      } catch (error: any) {
        const { message } = handleApiError(error);
        dispatch(addToast({ type: "error", message }));
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  // Touched fields for validation
  const allTouchedFields: Record<string, boolean> = useMemo(() => ({
      name: true,
      email: true,
    password: true,
    countryCode: true,
      contactNumber: true,
      role: true,
      adminId: true,
      managerId: true,
      assignedCountries: true,
      assignedUniversities: true,
  }), []);

  // Handle form submit with touch all fields
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark that user has attempted to submit (to show validation errors)
    setHasAttemptedSubmit(true);
    
    await formik.setTouched(allTouchedFields, true);
    const errors = await formik.validateForm();
    
    if (Object.keys(errors).length === 0) {
      formik.submitForm();
    }
    // Errors will show below each field automatically
  }, [formik, allTouchedFields]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(ROUTES.MANAGE_TEAM);
  }, [navigate]);

  // Check if role requires admin field (Manager, Counselor, Billing)
  const showAdminField = formik.values.role === "manager" || formik.values.role === "counselor" || formik.values.role === "billing";
  
  // Check if role requires manager field (Counselor)
  const showManagerField = formik.values.role === "counselor";

  // Check if all mandatory fields are filled
  const isMandatoryFieldsFilled = useMemo(() => {
    const { name, email, password, contactNumber, role, adminId, managerId, assignedCountries, assignedUniversities } = formik.values;
    
    // Base mandatory fields
    const baseFieldsFilled = 
      name.trim() !== "" &&
      email.trim() !== "" &&
      contactNumber.trim() !== "" &&
      role !== "" &&
      assignedCountries.length > 0 &&
      assignedUniversities.length > 0;
    
    // Password is mandatory only in add mode
    const passwordFilled = isEditMode || password.trim() !== "";
    
    // Admin is mandatory for manager, counselor, billing
    const adminFilled = !showAdminField || adminId !== "";
    
    // Manager is mandatory for counselor
    const managerFilled = !showManagerField || managerId !== "";
    
    return baseFieldsFilled && passwordFilled && adminFilled && managerFilled;
  }, [formik.values, isEditMode, showAdminField, showManagerField]);

  // Validate field error based on current role
  const getAdminError = () => {
    if (showAdminField && hasAttemptedSubmit && formik.errors.adminId) {
      return formik.errors.adminId;
    }
    return undefined;
  };

  const getManagerError = () => {
    if (showManagerField && hasAttemptedSubmit && formik.errors.managerId) {
      return formik.errors.managerId;
    }
    return undefined;
  };

  return (
    <Layout>
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
                placeholder={t("manageTeam.enterName", "Enter Name")}
                value={formik.values.name}
                onChange={formik.handleChange}
                error={hasAttemptedSubmit && formik.errors.name ? formik.errors.name : undefined}
                fullWidth
              />
              <Input
                name="email"
                label={<>{t("manageTeam.email", "Email")} <span style={{ color: COLORS.error }}>*</span></>}
                placeholder={t("manageTeam.enterEmail", "Enter Email")}
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={hasAttemptedSubmit && formik.errors.email ? formik.errors.email : undefined}
                fullWidth
              />
            </div>

            {/* Row 2: Password, Contact Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isEditMode && (
                <Input
                  name="password"
                  label={<>{t("manageTeam.password", "Password")} <span style={{ color: COLORS.error }}>*</span></>}
                  placeholder={t("manageTeam.enterPassword", "Enter Password")}
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={hasAttemptedSubmit && formik.errors.password ? formik.errors.password : undefined}
                  showPasswordToggle
                  fullWidth
                />
              )}
              <PhoneInput
                label={<>{t("manageTeam.contactNumber", "Contact Number")} <span style={{ color: COLORS.error }}>*</span></>}
                placeholder={t("manageTeam.contactNumber", "Contact Number")}
                value={formik.values.contactNumber}
                onChange={(value, countryData) => {
                  formik.setFieldValue("contactNumber", value);
                  // Store country code from selected country
                  if (countryData?.dialCode) {
                    formik.setFieldValue("countryCode", `+${countryData.dialCode}`);
                  }
                }}
                error={hasAttemptedSubmit && formik.errors.contactNumber ? formik.errors.contactNumber : undefined}
                fullWidth
              />
            </div>

            {/* Row 3: Role and Admin (conditional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={<>{t("manageTeam.role", "Role")} <span style={{ color: COLORS.error }}>*</span></>}
                options={filteredRoleOptions}
                value={formik.values.role}
                onChange={(value) => {
                  const previousRole = formik.values.role;
                  formik.setFieldValue("role", value);
                  // Only reset admin/manager when role actually changes (not on initial load)
                  if (previousRole && previousRole !== value) {
                  formik.setFieldValue("adminId", "");
                  formik.setFieldValue("managerId", "");
                  }
                }}
                placeholder={t("manageTeam.selectRole", "Select Role")}
                error={hasAttemptedSubmit && formik.errors.role ? formik.errors.role : undefined}
                fullWidth
              />

              {/* Show Admin field for Manager, Counselor and Billing roles */}
              {showAdminField && (
                <Select
                  label={<>{t("manageTeam.admin", "Admin")} <span style={{ color: COLORS.error }}>*</span></>}
                  options={adminOptions}
                  value={formik.values.adminId}
                  onChange={(value) => formik.setFieldValue("adminId", value)}
                  placeholder={isLoadingAdmins ? t("common.loading", "Loading...") : t("manageTeam.selectAdmin", "Select Admin")}
                  error={getAdminError()}
                  fullWidth
                  searchable
                  disabled={isLoadingAdmins}
                />
              )}
            </div>
              
            {/* Row 4: Manager (conditional for Counselor) */}
              {showManagerField && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={<>{t("manageTeam.manager", "Manager")} <span style={{ color: COLORS.error }}>*</span></>}
                  options={managerOptions}
                  value={formik.values.managerId}
                  onChange={(value) => formik.setFieldValue("managerId", value)}
                  placeholder={isLoadingManagers ? t("common.loading", "Loading...") : t("manageTeam.selectManager", "Select Manager")}
                  error={getManagerError()}
                  fullWidth
                  searchable
                  disabled={isLoadingManagers}
                />
              </div>
              )}

            {/* Row 5: Assigned Country and Assigned University */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelect
                label={<>{t("manageTeam.assignedCountry", "Assigned Country")} <span style={{ color: COLORS.error }}>*</span></>}
                options={countryOptions}
                value={formik.values.assignedCountries}
                onChange={(values) => {
                  formik.setFieldValue("assignedCountries", values);
                  // Clear universities when countries change
                  formik.setFieldValue("assignedUniversities", []);
                  setUniversities([]);
                  // Fetch universities based on last selected country
                  if (values.length > 0) {
                    const lastSelectedCountryId = parseInt(values[values.length - 1], 10);
                    fetchUniversities(lastSelectedCountryId);
                  }
                }}
                placeholder={t("manageTeam.selectAssignedCountry", "Select Assigned Country")}
                error={
                  hasAttemptedSubmit && formik.errors.assignedCountries
                    ? String(formik.errors.assignedCountries)
                    : undefined
                }
                fullWidth
                searchable
                disabled={isLoadingCountries}
              />

              <MultiSelect
                label={<>{t("manageTeam.assignedUniversity", "Assigned University")} <span style={{ color: COLORS.error }}>*</span></>}
                options={universityOptions}
                value={formik.values.assignedUniversities}
                onChange={(values) => formik.setFieldValue("assignedUniversities", values)}
                placeholder={t("manageTeam.selectAssignedUniversity", "Select Assigned University")}
                error={
                  hasAttemptedSubmit && formik.errors.assignedUniversities
                    ? String(formik.errors.assignedUniversities)
                    : undefined
                }
                fullWidth
                searchable
                disabled={isLoadingUniversities}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="cancel" rounded onClick={handleBack}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" variant="accent" rounded disabled={!isMandatoryFieldsFilled}>
              {isEditMode ? t("common.update", "Update") : t("common.save", "Save")}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddMember;
