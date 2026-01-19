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
   * @returns Promise with manager list response
   */
  getManagers: async (agencyId: number | string): Promise<ManagerListResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("agencyId", agencyId.toString());

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
    const optionalParams: Record<string, string | number | boolean | null | undefined> = {
      search: params.search,
      status: params.status !== "all" ? params.status : null,
      enrollmentType: params.enrollmentType,
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      asc: params.asc,
    };

    Object.entries(optionalParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

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
};

export default userService;

