import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import {
  Layout,
  Button,
  DataTable,
  Popup,
  Card,
} from "../../../components";
import { ArrowLeft, ToggleStatus, ToggleOn, User, Settings } from "../../../assets";
import { COLORS, ROUTES, UserRole, getRoleDisplayName } from "../../../constants";
import { userService } from "../../../services";
import type { UserDetailsData } from "../../../services";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { handleApiError } from "../../../utils";

// Stats Card Component - defined outside to prevent re-creation
const StatsCard = ({ label, value }: { label: string; value: number }) => (
  <div
    className="flex flex-col items-center p-4 rounded-lg"
    style={{ border: `1px solid ${COLORS.border}` }}
  >
    <span className="text-xs text-center mb-1" style={{ color: COLORS.textMuted }}>
      {label}
    </span>
    <span className="text-2xl font-semibold" style={{ color: COLORS.textDark }}>
      {value}
    </span>
  </div>
);

const ViewMember = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { memberId } = useParams<{ memberId: string }>();
  
  // Get user from Redux (decoded from token)
  const { user } = useAppSelector((state) => state.auth);
  
  // Get member data from navigation state (passed from list page)
  const memberDataFromList = location.state?.memberData;
  const initialStatus = (memberDataFromList?.status?.toUpperCase() as "ACTIVE" | "INACTIVE") || "ACTIVE";
  
  // State for member details (from API - for applicant counts, subordinates etc.)
  const [memberDetails, setMemberDetails] = useState<UserDetailsData | null>(null);
  const [memberStatus, setMemberStatus] = useState<"ACTIVE" | "INACTIVE">(initialStatus);
  const [isDeactivatePopupOpen, setIsDeactivatePopupOpen] = useState(false);

  // Memoized DataTable columns for universities
  const universityColumns: GridColDef[] = useMemo(() => [
    {
      field: "name",
      headerName: t("manageTeam.universities", "Universities"),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "count",
      headerName: t("manageTeam.successfulApplicantsCount", "No. of Successful Applicants"),
      flex: 1,
      minWidth: 200,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => params.value.toString().padStart(2, "0"),
    },
  ], [t]);

  /**
   * Fetch user details from API
   */
  const fetchUserDetails = useCallback(async () => {
    if (!memberId || !user) return;

    dispatch(showLoader());

    try {
      const response = await userService.getUserDetails({
        userId: parseInt(memberId),
        agencyId: user.agencyId ?? null,
        assignedManagerId: user.role === UserRole.MANAGER ? user.userId : null,
        assignedAdminId: user.role === UserRole.ADMIN ? user.userId : null,
        assignedCounsellorId: user.role === UserRole.COUNSELLOR ? user.userId : null,
      });

      if (response.status === "success" && response.data) {
        setMemberDetails(response.data);
      } else {
        dispatch(addToast({ type: "error", message: response.message || "Failed to fetch user details" }));
      }
    } catch (error: unknown) {
      const { message } = handleApiError(error, "Failed to fetch user details");
      dispatch(addToast({ type: "error", message }));
    } finally {
      dispatch(hideLoader());
    }
  }, [memberId, user, dispatch]);

  // Fetch user details on mount
  useEffect(() => {
    if (user && memberId) {
      fetchUserDetails();
    }
  }, [user, memberId, fetchUserDetails]);

  // Memoized university rows for DataTable
  const universityRows = useMemo(() => 
    memberDetails?.enrolledApplicantsByUniversity?.map((uni) => ({
      id: uni.universityId,
      name: uni.universityName,
      count: uni.count,
    })) || []
  , [memberDetails?.enrolledApplicantsByUniversity]);

  // Memoized member name - prefer data from list, fallback to API response
  const memberName = useMemo(() => 
    memberDataFromList?.name || memberDetails?.personalData?.email?.split("@")[0] || `Member #${memberId}`
  , [memberDataFromList?.name, memberDetails?.personalData?.email, memberId]);

  // Memoized handlers
  const handleBack = useCallback(() => {
    navigate(ROUTES.MANAGE_TEAM);
  }, [navigate]);

  const handleDeactivateClick = useCallback(() => {
    setIsDeactivatePopupOpen(true);
  }, []);

  const handleDeactivateCancel = useCallback(() => {
    setIsDeactivatePopupOpen(false);
  }, []);

  const handleDeactivateConfirm = useCallback(async () => {
    if (!memberId) return;
    
    dispatch(showLoader());
    try {
      const response = await userService.updateStatus(parseInt(memberId));
      if (response.status === "success" && response.data) {
        const newStatus = response.data.status as "ACTIVE" | "INACTIVE";
        setMemberStatus(newStatus);
        dispatch(addToast({ type: "success", message: t("manageTeam.statusUpdated", `Status changed to ${newStatus === "ACTIVE" ? "Active" : "Inactive"}`) }));
      }
    } catch (error: unknown) {
      const { message } = handleApiError(error);
      dispatch(addToast({ type: "error", message }));
    } finally {
      dispatch(hideLoader());
      setIsDeactivatePopupOpen(false);
    }
  }, [memberId, dispatch, t]);

  if (!memberDetails) {
    return (
      <Layout userName={user?.name || "Admin"} userRole={user?.role || "User"}>
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)] flex items-center justify-center">
          <p style={{ color: COLORS.textMuted }}>Loading...</p>
        </div>
      </Layout>
    );
  }

  const { personalData, applicantCount, subordinates } = memberDetails;

  return (
    <Layout userName={user?.name || "Admin"} userRole={user?.role || "User"}>
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]">
        {/* Back Button & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="accent"
              icon={<ArrowLeft className="h-5 w-5" />}
              onClick={handleBack}
              rounded
            />
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-semibold truncate"
                style={{ color: COLORS.textDark }}
              >
                {memberName}
              </h1>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("manageTeam.id", "ID")}: {memberId}
              </p>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("manageTeam.role", "Role")}: {getRoleDisplayName(personalData.role)}
              </p>
            </div>
          </div>
          {/* Status Toggle Icon Button */}
          <Button
            variant="ghost"
            size="sm"
            icon={
              memberStatus === "ACTIVE" ? (
                <ToggleOn
                  className="h-5 w-5"
                  style={{ color: COLORS.error }}
                />
              ) : (
                <ToggleStatus
                  className="h-5 w-5"
                  style={{ color: COLORS.success }}
                />
              )
            }
            onClick={handleDeactivateClick}
            title={memberStatus === "ACTIVE" ? t("common.inactive", "Inactive") : t("common.active", "Active")}
            className="self-start sm:self-center"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            label={t("manageTeam.totalApplications", "Total Applications")} 
            value={applicantCount.totalApplicants} 
          />
          <StatsCard
            label={t("manageTeam.inProgressApplications", "In Progress Applications")}
            value={applicantCount.inProgressApplicants}
          />
          <StatsCard
            label={t("manageTeam.successfulApplications", "Successful Applications")}
            value={applicantCount.successFullApplicants}
          />
          <StatsCard
            label={t("manageTeam.rejectedApplications", "Rejected Applications")}
            value={applicantCount.rejectedApplicants}
          />
        </div>

        {/* Two Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: University List */}
          <Card
            title={t("manageTeam.universityList", "University List")}
            headerIcon={<Settings className="h-5 w-5 text-white" />}
            headerBackgroundColor={COLORS.accent}
            headerTextColor="white"
            padding="md"
            shadow="sm"
          >
            {universityRows.length > 0 ? (
              <DataTable
                rows={universityRows}
                columns={universityColumns}
                hideFooter
                disableRowSelectionOnClick
              />
            ) : (
              <p className="text-center py-8" style={{ color: COLORS.textMuted }}>
                {t("manageTeam.noUniversities", "No universities assigned")}
              </p>
            )}
          </Card>

          {/* Card 2: Member Details (View Mode) */}
          <Card
            title={t("manageTeam.memberDetails", "Member Details")}
            headerIcon={<User className="h-5 w-5 text-white" />}
            headerBackgroundColor={COLORS.accent}
            headerTextColor="white"
            padding="md"
            shadow="sm"
          >
            {/* Row 1: Email & Contact Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
              <div className="min-w-0 space-y-1">
                <label className="text-xs font-medium tracking-wide" style={{ color: COLORS.textMuted }}>
                  {t("manageTeam.email", "Email")}
                </label>
                <p className="text-sm font-medium truncate" style={{ color: COLORS.textDark }} title={memberDataFromList?.email || personalData.email || ""}>
                  {memberDataFromList?.email || personalData.email || "-"}
                </p>
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-xs font-medium tracking-wide" style={{ color: COLORS.textMuted }}>
                  {t("manageTeam.contactNumber", "Contact Number")}
                </label>
                <p className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                  {memberDataFromList?.countryCode ? `${memberDataFromList.countryCode} ` : ""}{memberDataFromList?.contactNumber || personalData.contactNumber || "-"}
                </p>
              </div>
            </div>

            {/* Row 2: Role & Assigned Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
              <div className="min-w-0 space-y-1">
                <label className="text-xs font-medium tracking-wide" style={{ color: COLORS.textMuted }}>
                  {t("manageTeam.role", "Role")}
                </label>
                <p className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                  {getRoleDisplayName(memberDataFromList?.role || personalData.role)}
                </p>
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-xs font-medium tracking-wide" style={{ color: COLORS.textMuted }}>
                  {t("manageTeam.assignedAdmin", "Assigned Admin")}
                </label>
                <p className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                  {memberDataFromList?.assignedAdmins?.map((a: { id: number; name: string }) => a.name).join(", ") || 
                   personalData.assignedAdminName || 
                   memberDetails?.assignedAdmins?.map((a: { id: number; name: string }) => a.name).join(", ") || "-"}
                </p>
              </div>
            </div>

            {/* Assigned Manager (if exists) */}
            {(memberDataFromList?.assignedManagers?.length > 0 || personalData.assignedManagerName || memberDetails?.assignedManagers?.length) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium tracking-wide" style={{ color: COLORS.textMuted }}>
                    {t("manageTeam.assignedManager", "Assigned Manager")}
                  </label>
                  <p className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                    {memberDataFromList?.assignedManagers?.map((m: { id: number; name: string }) => m.name).join(", ") || 
                     personalData.assignedManagerName || 
                     memberDetails?.assignedManagers?.map((m: { id: number; name: string }) => m.name).join(", ") || "-"}
                  </p>
                </div>
              </div>
            )}

            {/* Assigned Countries - check list data first, then API response */}
            {((memberDataFromList?.assignedCountries && memberDataFromList.assignedCountries.length > 0) ||
              (memberDetails?.assignedCountries && memberDetails.assignedCountries.length > 0) || 
              (personalData.assignedCountries && personalData.assignedCountries.length > 0)) && (
              <div className="mb-4">
                <label className="text-xs font-medium tracking-wide mb-2 block" style={{ color: COLORS.textMuted }}>
                  {t("manageTeam.assignedCountry", "Assigned Country")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(memberDataFromList?.assignedCountries || memberDetails?.assignedCountries || personalData.assignedCountries || []).map((country: { id: number; name: string }) => (
                    <span
                      key={country.id}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: COLORS.accent + "15",
                        color: COLORS.accent,
                        border: `1px solid ${COLORS.accent}30`,
                      }}
                    >
                      {country.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Universities - check list data first, then API response (remove duplicates by name) */}
            {((memberDataFromList?.assignedUniversities && memberDataFromList.assignedUniversities.length > 0) ||
              (memberDetails?.assignedUniversities && memberDetails.assignedUniversities.length > 0) || 
              (personalData.assignedUniversities && personalData.assignedUniversities.length > 0)) && (
              <div className="mb-4">
                <label className="text-xs font-medium tracking-wide mb-2 block" style={{ color: COLORS.textMuted }}>
                  {t("manageTeam.assignedUniversity", "Assigned University")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(memberDataFromList?.assignedUniversities || memberDetails?.assignedUniversities || personalData.assignedUniversities || [])
                    .filter((university: { id: number; name: string }, index: number, self: Array<{ id: number; name: string }>) => 
                      index === self.findIndex((u) => u.name === university.name)
                    )
                    .map((university: { id: number; name: string }) => (
                      <span
                        key={university.id}
                        className="text-xs px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: COLORS.success + "15",
                          color: COLORS.success,
                          border: `1px solid ${COLORS.success}30`,
                        }}
                      >
                        {university.name}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Subordinates List */}
            {subordinates && subordinates.length > 0 && (
              <div className="pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <label className="text-xs font-medium tracking-wide mb-3 block" style={{ color: COLORS.textMuted }}>
                  {t("manageTeam.subordinates", "Subordinates")}
                </label>
                <div className="space-y-2">
                  {subordinates.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="flex justify-between items-center p-3 rounded-lg"
                      style={{ backgroundColor: COLORS.surface }}
                    >
                      <span className="text-sm font-medium" style={{ color: COLORS.textDark }}>{sub.name}</span>
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: COLORS.accent + "20", 
                          color: COLORS.accent 
                        }}
                      >
                        {getRoleDisplayName(sub.role)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Status Change Confirmation Popup */}
      <Popup
        isOpen={isDeactivatePopupOpen}
        onClose={handleDeactivateCancel}
        title={t("manageTeam.confirmStatusChange", "Confirm Status Change")}
        size="sm"
        showCloseButton={true}
      >
        <div>
          <p className="text-base mb-8" style={{ color: COLORS.textDark }}>
            {t("manageTeam.statusChangeConfirmation", "Are you sure you want to change the status of")}{" "}
            <strong>{memberName}</strong> {t("common.from", "From")}{" "}
            {memberStatus === "ACTIVE" 
              ? t("manageTeam.activeToInactive", "Active to Inactive") 
              : t("manageTeam.inactiveToActive", "Inactive to Active")}?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="cancel" rounded onClick={handleDeactivateCancel}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="accent" rounded onClick={handleDeactivateConfirm}>
              {t("common.confirm", "Confirm")}
            </Button>
          </div>
        </div>
      </Popup>
    </Layout>
  );
};

export default ViewMember;
