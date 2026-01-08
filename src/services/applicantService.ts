import api from "./api";
import { ENDPOINTS } from "./endpoints";
import { store } from "../redux/store";
import { appendQueryParam, getRoleBasedAssignedId, createQueryParams } from "../utils";
import type {
  ApplicationsListParams,
  ApplicationsListResponse,
  CountriesResponse,
  AdminListResponse,
  ManagerListResponse,
  CounselorListResponse,
  AdminItem,
  ManagerItem,
  CounselorItem,
  UniversityItem,
} from "./types";

/**
 * Build query parameters for applications list API
 * @param params - Application list parameters
 * @param user - Logged-in user from Redux state
 * @returns URLSearchParams instance with all query parameters
 */
const buildApplicationsListQueryParams = (
  params: ApplicationsListParams,
  user: { userId: number; role: string } | null
): URLSearchParams => {
  const queryParams = new URLSearchParams();

  // 1. Agency ID (always required if provided)
  appendQueryParam(queryParams, "agencyId", params.agencyId);

  // 2. Role-based assigned ID (based on logged-in user's role)
  const roleBasedId = getRoleBasedAssignedId(user, params);
  if (roleBasedId) {
    appendQueryParam(queryParams, roleBasedId.key, roleBasedId.value);
  } else {
    // Fallback: append assigned IDs if explicitly provided (for backward compatibility)
    appendQueryParam(queryParams, "assignedAdminId", params.assignedAdminId);
    appendQueryParam(queryParams, "assignedManagerId", params.assignedManagerId);
    appendQueryParam(queryParams, "assignedCounselorId", params.assignedCounselorId);
  }

  // 3. Search and text filters (skip empty strings)
  appendQueryParam(queryParams, "search", params.search, { skipEmptyString: true });

  // 4. Pagination parameters
  appendQueryParam(queryParams, "page", params.page);
  appendQueryParam(queryParams, "size", params.size);

  // 5. Sorting parameters (skip empty strings)
  appendQueryParam(queryParams, "sortBy", params.sortBy, { skipEmptyString: true });
  appendQueryParam(queryParams, "asc", params.asc);

  // 6. Additional filters can be easily added here
  // Example for future filters:
  // appendQueryParam(queryParams, "universityId", params.universityId);
  // appendQueryParam(queryParams, "courseId", params.courseId);
  // appendQueryParam(queryParams, "applicantStage", params.applicantStage);
  // appendQueryParam(queryParams, "applicantStatus", params.applicantStatus);
  // appendQueryParam(queryParams, "intake", params.intake);
  // appendQueryParam(queryParams, "appliedFromDate", params.appliedFromDate);
  // appendQueryParam(queryParams, "appliedToDate", params.appliedToDate);
  // appendQueryParam(queryParams, "lastUpdatedFromDate", params.lastUpdatedFromDate);
  // appendQueryParam(queryParams, "lastUpdatedToDate", params.lastUpdatedToDate);

  return queryParams;
};

// ==========================================
// Applicant Service
// ==========================================

/**
 * Applicant Service - Handles applicant-related API calls
 */
const applicantService = {
  /**
   * Get applications list with filters and pagination
   * @param params - Query parameters
   * @returns Promise with applications list response
   */
  getApplicationsList: async (params: ApplicationsListParams): Promise<ApplicationsListResponse> => {
    // Get user info from Redux store
    const state = store.getState();
    const user = state.auth.user;

    // Build query parameters using reusable helper
    const queryParams = buildApplicationsListQueryParams(params, user);

    // Make API call
    const response = await api.get<ApplicationsListResponse>(
      `${ENDPOINTS.APPLICANTS.APPLICATIONS_LIST}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get countries list for an agency
   * @param agencyId - Agency ID
   * @returns Promise with countries response
   */
  getCountries: async (agencyId: number | string | null): Promise<CountriesResponse> => {
    const queryParams = createQueryParams({
      agencyId,
    });

    const response = await api.get<CountriesResponse>(
      `${ENDPOINTS.AGENCIES.COUNTRIES}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get universities list for an agency
   * @param agencyId - Agency ID
   * @returns Promise with universities response (array directly, not wrapped)
   */
  getUniversities: async (agencyId: number | string | null): Promise<UniversityItem[]> => {
    const queryParams = createQueryParams({
      agencyId,
    });

    const url = `${ENDPOINTS.AGENCIES.UNIVERSITIES}?${queryParams.toString()}`;

    // API returns array directly: [{id, name, ...}, ...]
    const response = await api.get<UniversityItem[]>(url);
    
    // Response.data is the array directly
    const result: UniversityItem[] = Array.isArray(response.data) ? response.data : [];
    
    return result;
  },

  /**
   * Get admin list for an agency
   * @param agencyId - Agency ID
   * @returns Promise with admin list response (array directly, not wrapped)
   */
  getAdmins: async (agencyId: number | string | null): Promise<AdminListResponse> => {
    const queryParams = createQueryParams({
      agencyId,
    });

    const url = `${ENDPOINTS.AGENCIES.ADMINS}?${queryParams.toString()}`;

    // API returns array directly: [{id, name, email}, ...]
    const response = await api.get(url);
    
    // Response.data is the array directly
    // Handle both direct array and potential wrapper
    let result: AdminItem[] = [];
    if (Array.isArray(response.data)) {
      result = response.data;
    } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
      // Handle wrapped response: { data: [...] }
      result = response.data.data;
    }
    
    return result;
  },

  /**
   * Get manager list for an agency, optionally filtered by admin
   * @param agencyId - Agency ID
   * @param adminId - Optional Admin ID to filter managers
   * @returns Promise with manager list response (array directly, not wrapped)
   */
  getManagers: async (
    agencyId: number | string | null,
    adminId?: number | string | null
  ): Promise<ManagerListResponse> => {
    const queryParams = createQueryParams({
      agencyId,
      adminId,
    });

    // API returns array directly: [{id, name, email}, ...]
    const response = await api.get<ManagerItem[]>(
      `${ENDPOINTS.AGENCIES.MANAGERS}?${queryParams.toString()}`
    );
    // Response.data is the array directly
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get counselor list for an agency, filtered by manager
   * @param agencyId - Agency ID
   * @param managerId - Manager ID to filter counselors
   * @returns Promise with counselor list response (array directly, not wrapped)
   */
  getCounselors: async (
    agencyId: number | string | null,
    managerId: number | string | null
  ): Promise<CounselorListResponse> => {
    const queryParams = createQueryParams({
      agencyId,
      assignedManagerId: managerId,
    });

    const url = `${ENDPOINTS.AGENCIES.COUNSELORS}?${queryParams.toString()}`;

    // API returns array directly: [{id, name}, ...]
    const response = await api.get<CounselorItem[]>(url);
    
    // Response.data is the array directly
    const result: CounselorItem[] = Array.isArray(response.data) ? response.data : [];
    
    return result;
  },
};

export default applicantService;

