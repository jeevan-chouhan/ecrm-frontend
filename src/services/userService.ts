import api from "./api";
import { ENDPOINTS } from "./endpoints";
import type {
  UserListParams,
  UserListResponse,
  CountriesResponse,
  UniversitiesResponse,
  UniversityParams,
  UserDetailsParams,
  UserDetailsResponse,
  AddMemberPayload,
  AddMemberResponse,
  UpdateMemberParams,
  UpdateMemberPayload,
  UpdateMemberResponse,
  AdminListResponse,
  ManagerListResponse,
  UpdateStatusResponse,
  ApplicantOverviewParams,
  ApplicantOverviewResponse,
  UpdateApplicantStatusParams,
  UpdateApplicantStatusPayload,
  UpdateApplicantStatusResponse,
  ProfileDetailsParams,
  ProfileDetailsResponse,
  UpdateProfileParams,
  UpdateProfilePayload,
  UpdateProfileResponse,
  TeamOverviewParams,
  TeamOverviewResponse,
  MenuResponse,
} from "./types";

/**
 * User Service - Handles user-related API calls
 */
const userService = {
  /**
   * Get user list with filters and pagination
   * @param params - Query parameters
   * @returns Promise with user list response
   */
  getUserList: async (params: UserListParams): Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();

    // Build query string
    queryParams.append("agencyId", params.agencyId?.toString() ?? "null");
    queryParams.append("assignedManagerId", params.assignedManagerId?.toString() ?? "");
    queryParams.append("search", params.search ?? "");
    // Status: pass empty or "all" as default, otherwise pass the status value
    queryParams.append("status", params.status && params.status !== "all" ? params.status : "");
    queryParams.append("page", params.page?.toString() ?? "");
    queryParams.append("size", params.size?.toString() ?? "");
    queryParams.append("sortBy", params.sortBy ?? "");
    queryParams.append("asc", params.asc?.toString() ?? "");

    const response = await api.get<UserListResponse>(
      `${ENDPOINTS.USERS.LIST}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get countries list for an agency
   * @param agencyId - Agency ID
   * @returns Promise with countries response
   */
  getCountries: async (agencyId: number | string): Promise<CountriesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("agencyId", agencyId.toString());

    const response = await api.get<CountriesResponse>(
      `${ENDPOINTS.AGENCIES.COUNTRIES}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get universities list with filters
   * @param params - Query parameters (agencyId, countryId - can be single or array)
   * @returns Promise with universities response
   */
  getUniversities: async (params: UniversityParams): Promise<UniversitiesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("agencyId", params.agencyId?.toString() ?? "");

    // Handle countryId - can be single value, array, or comma-separated string
    let countryIdValue = "";
    if (params.countryId) {
      if (Array.isArray(params.countryId)) {
        countryIdValue = params.countryId.join(",");
      } else {
        countryIdValue = params.countryId.toString();
      }
    }
    queryParams.append("countryId", countryIdValue);

    const response = await api.get<UniversitiesResponse>(
      `${ENDPOINTS.AGENCIES.UNIVERSITIES}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get user details by userId
   * @param params - Query parameters (userId, agencyId, assignedManagerId, assignedAdminId, assignedCounsellorId)
   * @returns Promise with user details response
   */
  getUserDetails: async (params: UserDetailsParams): Promise<UserDetailsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("userId", params.userId.toString());
    queryParams.append("agencyId", params.agencyId?.toString() ?? "");
    queryParams.append("assignedManagerId", params.assignedManagerId?.toString() ?? "");
    queryParams.append("assignedAdminId", params.assignedAdminId?.toString() ?? "");
    queryParams.append("assignedCounsellorId", params.assignedCounsellorId?.toString() ?? "");

    const response = await api.get<UserDetailsResponse>(
      `${ENDPOINTS.USERS.DETAILS}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Add new team member
   * @param payload - Member data
   * @returns Promise with add member response
   */
  addMember: async (payload: AddMemberPayload): Promise<AddMemberResponse> => {
    const response = await api.post<AddMemberResponse>(
      ENDPOINTS.USERS.REGISTER,
      payload
    );
    return response.data;
  },

  /**
   * Update team member details
   * @param params - Query parameters (userId, agencyId)
   * @param payload - Member data to update
   * @returns Promise with update member response
   */
  updateMember: async (params: UpdateMemberParams, payload: UpdateMemberPayload): Promise<UpdateMemberResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("userId", params.userId.toString());
    queryParams.append("agencyId", params.agencyId.toString());

    const response = await api.patch<UpdateMemberResponse>(
      `${ENDPOINTS.USERS.UPDATE}?${queryParams.toString()}`,
      payload
    );
    return response.data;
  },

  /**
   * Get admin list for an agency
   * @param agencyId - Agency ID
   * @returns Promise with admin list response
   */
  getAdmins: async (agencyId: number | string): Promise<AdminListResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("agencyId", agencyId.toString());

    const response = await api.get<AdminListResponse>(
      `${ENDPOINTS.AGENCIES.ADMINS}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get manager list for an agency
   * @param agencyId - Agency ID
   * @param adminId - Optional Admin ID to filter managers
   * @returns Promise with manager list response
   */
  getManagers: async (
    agencyId: number | string,
    adminId?: number | string | null
  ): Promise<ManagerListResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("agencyId", agencyId.toString());
    if (adminId) {
      queryParams.append("adminId", adminId.toString());
    }

    const response = await api.get<ManagerListResponse>(
      `${ENDPOINTS.AGENCIES.MANAGERS}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Update user status (toggle active/inactive)
   * @param userId - User ID
   * @returns Promise with update status response
   */
  updateStatus: async (userId: number): Promise<UpdateStatusResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("userId", userId.toString());

    const response = await api.patch<UpdateStatusResponse>(
      `${ENDPOINTS.USERS.UPDATE_STATUS}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get applicant overview data for dashboard
   * @param params - Query parameters
   * @returns Promise with applicant overview response
   */
  getApplicantOverview: async (params: ApplicantOverviewParams): Promise<ApplicantOverviewResponse> => {
    const queryParams = new URLSearchParams({
      agencyId: params.agencyId?.toString() ?? "",
      assignedAdminId: params.assignedAdminId?.toString() ?? "",
      assignedManagerId: params.assignedManagerId?.toString() ?? "",
    });

    // Optional params - only append if they have values
    if (params.search) {
      queryParams.append("search", params.search);
    }
    if (params.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params.enrollmentType) {
      queryParams.append("enrollmentType", params.enrollmentType);
    }
    if (params.page !== null && params.page !== undefined) {
      queryParams.append("page", params.page.toString());
    }
    if (params.size !== null && params.size !== undefined) {
      queryParams.append("size", params.size.toString());
    }
    if (params.sortBy) {
      queryParams.append("sortBy", params.sortBy);
    }
    if (params.asc !== null && params.asc !== undefined) {
      queryParams.append("asc", params.asc.toString());
    }

    const response = await api.get<ApplicantOverviewResponse>(
      `${ENDPOINTS.APPLICANTS.OVERVIEW}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Update applicant status (toggle active/inactive)
   * @param params - Query parameters (applicantId)
   * @param payload - Status update data
   * @returns Promise with update applicant status response
   */
  updateApplicantStatus: async (
    params: UpdateApplicantStatusParams,
    payload: UpdateApplicantStatusPayload
  ): Promise<UpdateApplicantStatusResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("applicantId", params.applicantId.toString());

    const response = await api.patch<UpdateApplicantStatusResponse>(
      `${ENDPOINTS.APPLICANTS.UPDATE_APPLICANT_STATUS}?${queryParams.toString()}`,
      payload
    );
    return response.data;
  },

  /**
   * Get user profile details
   * @param params - Query parameters (userId)
   * @returns Promise with profile details response
   */
  getProfileDetails: async (params: ProfileDetailsParams): Promise<ProfileDetailsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("userId", params.userId.toString());

    const response = await api.get<ProfileDetailsResponse>(
      `${ENDPOINTS.USERS.PROFILE_DETAILS}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Update user profile details
   * @param params - Query parameters (userId)
   * @param payload - Profile data to update
   * @returns Promise with update profile response
   */
  updateProfile: async (
    params: UpdateProfileParams,
    payload: UpdateProfilePayload
  ): Promise<UpdateProfileResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("userId", params.userId.toString());

    const response = await api.put<UpdateProfileResponse>(
      `${ENDPOINTS.USERS.PROFILE_DETAILS}?${queryParams.toString()}`,
      payload
    );
    return response.data;
  },

  /**
   * Get all plans
   * @returns Promise with plans response
   */
  getAllPlans: async (): Promise<unknown> => {
    const response = await api.get(ENDPOINTS.PLAN.GET_ALL);
    return response.data;
  },

  /**
   * Register a new agency
   * @param payload - Agency registration data (agencyName, fullName, email, contactNumber, logo)
   * @returns Promise with registration response
   */
  registerAgency: async (payload: {
    agencyName: string;
    fullName: string;
    email: string;
    contactNumber: string;
    logo?: File | null;
  }): Promise<unknown> => {
    const formData = new FormData();
    formData.append("agencyName", payload.agencyName);
    formData.append("fullName", payload.fullName);
    formData.append("email", payload.email);
    formData.append("contactNumber", payload.contactNumber);
    if (payload.logo) {
      formData.append("logo", payload.logo);
    }

    const response = await api.post(ENDPOINTS.AGENCIES.REGISTER, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Get team overview data with filters, pagination, and sorting
   * @param params - Query parameters
   * @returns Promise with team overview response
   */
  getTeamOverview: async (params: TeamOverviewParams): Promise<TeamOverviewResponse> => {
    const queryParams = new URLSearchParams();

    // Required params
    if (params.agencyId !== null && params.agencyId !== undefined) {
      queryParams.append("agencyId", params.agencyId.toString());
    }

    // Optional params - only append if they have values
    if (params.search !== null && params.search !== undefined && params.search !== "") {
      queryParams.append("search", params.search);
    }
    if (params.role !== null && params.role !== undefined && params.role !== "") {
      queryParams.append("role", params.role);
    }
    if (params.page !== null && params.page !== undefined) {
      queryParams.append("page", params.page.toString());
    }
    if (params.size !== null && params.size !== undefined) {
      queryParams.append("size", params.size.toString());
    }
    if (params.sortBy !== null && params.sortBy !== undefined && params.sortBy !== "") {
      queryParams.append("sortBy", params.sortBy);
    }
    if (params.asc !== null && params.asc !== undefined) {
      queryParams.append("asc", params.asc.toString());
    }
    if (params.assignedAdminId !== null && params.assignedAdminId !== undefined) {
      queryParams.append("assignedAdminId", params.assignedAdminId.toString());
    }
    if (params.assignedManagerId !== null && params.assignedManagerId !== undefined) {
      queryParams.append("assignedManagerId", params.assignedManagerId.toString());
    }
    if (params.assignedCounselorId !== null && params.assignedCounselorId !== undefined) {
      queryParams.append("assignedCounselorId", params.assignedCounselorId.toString());
    }
    if (params.enrollmentType !== null && params.enrollmentType !== undefined && params.enrollmentType !== "") {
      queryParams.append("enrollmentType", params.enrollmentType);
    }
    if (params.fromDate !== null && params.fromDate !== undefined && params.fromDate !== "") {
      queryParams.append("fromDate", params.fromDate);
    }
    if (params.toDate !== null && params.toDate !== undefined && params.toDate !== "") {
      queryParams.append("toDate", params.toDate);
    }

    const response = await api.get<TeamOverviewResponse>(
      `${ENDPOINTS.USERS.TEAM_OVERVIEW}?${queryParams.toString()}`
    );
    return response.data;
  },

  /* Get menu items based on user role
  * @param role - User role (e.g., "ADMIN", "MANAGER", "COUNSELOR")
  * @returns Promise with menu items
  */
  getMenuByRole: async (role: string): Promise<MenuResponse> => {
    const response = await api.get<MenuResponse>(
      `${ENDPOINTS.MENU.GET_BY_ROLE}?role=${role}`
    );
    return response.data;
  },
};

export default userService;

