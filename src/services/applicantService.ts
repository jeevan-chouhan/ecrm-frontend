import api from "./api";
import { ENDPOINTS } from "./endpoints";
import { store } from "../redux/store";
import { appendQueryParam, getRoleBasedAssignedId, createQueryParams } from "../utils";
import type {
  ApiResponse,
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
  CampusItem,
  CourseItem,
  EnrollmentTypeItem,
  ProgramTypeItem,
  ApplyApplicationParams,
  ApplyApplicationResponse,
  UpdateApplicationStatusPayload,
  UpdateApplicationStatusResponse,
  StatusHistoryParams,
  StatusHistoryResponse,
  CreatePersonalDetailsPayload,
  CreatePersonalDetailsResponse,
  GetPersonalDetailsResponse,
  UpdatePersonalDetailsPayload,
  UpdatePersonalDetailsResponse,
  CreateApplicationPreferencesPayload,
  CreateApplicationPreferencesResponse,
  GetApplicationPreferencesResponse,
  UpdateApplicationPreferencePayload,
  UpdateApplicationPreferenceResponse,
  DeleteApplicationPreferenceResponse,
  CompleteDetailsParams,
  CompleteDetailsResponse,
  EducationalDetailsPayload,
  EducationalDetailsResponse,
  GetEducationalDetailsResponse,
  UpdateEducationalDetailsResponse,
  WorkExperienceItemPayload,
  CreateWorkExperiencesResponse,
  GetWorkExperiencesResponse,
  UpdateWorkExperienceResponse,
  DeleteWorkExperienceResponse,
  AchievementItemPayload,
  CreateAchievementsResponse,
  GetAchievementsResponse,
  UpdateAchievementResponse,
  DeleteAchievementResponse,
  AgencyPartnerNameItem,
  GetDocumentsResponse,
  UploadDocumentResponse,
  ApplicationPreferenceDocumentsResponse,
  DownloadDocumentUrlResponse,
  ViewDocumentUrlResponse,
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

  // 2. Applicant ID (optional filter)
  appendQueryParam(queryParams, "applicantId", params.applicantId);

  // 3. Role-based assigned ID (based on logged-in user's role)
  // Skip role-based assigned IDs when applicantId is provided (for applicant detail view)
  if (!params.applicantId) {
    const roleBasedId = getRoleBasedAssignedId(user, params);
    if (roleBasedId) {
      appendQueryParam(queryParams, roleBasedId.key, roleBasedId.value);
    } else {
      // Fallback: append assigned IDs if explicitly provided (for backward compatibility)
      appendQueryParam(queryParams, "assignedAdminId", params.assignedAdminId);
      appendQueryParam(queryParams, "assignedManagerId", params.assignedManagerId);
      appendQueryParam(queryParams, "assignedCounselorId", params.assignedCounselorId);
    }
  }
  // When applicantId is provided, we don't send any assigned IDs (assignedAdminId, assignedManagerId, assignedCounselorId)

  // 4. Application status and stage filters
  appendQueryParam(queryParams, "applicationStatus", params.applicationStatus, { skipEmptyString: true });
  appendQueryParam(queryParams, "applicationStage", params.applicationStage, { skipEmptyString: true });

  // 5. University, intake, and enrollment type filters
  appendQueryParam(queryParams, "universityId", params.universityId);
  appendQueryParam(queryParams, "desiredIntake", params.desiredIntake, { skipEmptyString: true });
  appendQueryParam(queryParams, "enrollmentTypeId", params.enrollmentTypeId);

  // 6. Date filters - format dates according to backend requirements
  // appliedFrom and appliedTo use ISO DATE_TIME format (YYYY-MM-DDTHH:mm:ss)
  appendQueryParam(queryParams, "appliedFrom", params.appliedFrom, { skipEmptyString: true });
  appendQueryParam(queryParams, "appliedTo", params.appliedTo, { skipEmptyString: true });
  
  // updatedFrom and updatedTo use ISO DATE_TIME format (YYYY-MM-DDTHH:mm:ss)
  appendQueryParam(queryParams, "updatedFrom", params.updatedFrom, { skipEmptyString: true });
  appendQueryParam(queryParams, "updatedTo", params.updatedTo, { skipEmptyString: true });

  // 7. Search and text filters (skip empty strings)
  appendQueryParam(queryParams, "search", params.search, { skipEmptyString: true });

  // 8. Pagination parameters
  appendQueryParam(queryParams, "page", params.page);
  appendQueryParam(queryParams, "size", params.size);

  // 9. Sorting parameters (skip empty strings)
  appendQueryParam(queryParams, "sortBy", params.sortBy, { skipEmptyString: true });
  appendQueryParam(queryParams, "asc", params.asc);

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
   * Get universities list for an agency, optionally filtered by country
   * @param agencyId - Agency ID
   * @param countryId - Optional Country ID(s) to filter universities (single, array, or comma-separated)
   * @returns Promise with universities response (array directly, not wrapped)
   */
  getUniversities: async (
    agencyId: number | string | null,
    countryId?: number | string | number[] | null
  ): Promise<UniversityItem[]> => {
    // Handle countryId - can be single value, array, or comma-separated string
    let countryIdValue: string | null = null;
    if (countryId) {
      if (Array.isArray(countryId)) {
        countryIdValue = countryId.join(",");
      } else {
        countryIdValue = countryId.toString();
      }
    }

    const queryParams = createQueryParams({
      agencyId,
      countryId: countryIdValue,
    });

    const url = `${ENDPOINTS.AGENCIES.UNIVERSITIES}?${queryParams.toString()}`;

    // API returns array directly: [{id, name, ...}, ...]
    const response = await api.get<UniversityItem[]>(url);
    
    // Response.data is the array directly
    const result: UniversityItem[] = Array.isArray(response.data) ? response.data : [];
    
    return result;
  },

  /**
   * Get campuses list for an agency and university
   * @param agencyId - Agency ID
   * @param universityId - University ID to filter campuses
   * @returns Promise with campuses response (array directly, not wrapped)
   */
  getCampuses: async (
    agencyId: number | string | null,
    universityId?: number | string | null
  ): Promise<CampusItem[]> => {
    const queryParams = createQueryParams({
      agencyId,
      universityId: universityId || null,
    });

    const url = `${ENDPOINTS.AGENCIES.CAMPUSES}?${queryParams.toString()}`;

    // API returns array directly: [{id, name, ...}, ...]
    const response = await api.get<CampusItem[]>(url);
    
    // Response.data is the array directly
    const result: CampusItem[] = Array.isArray(response.data) ? response.data : [];
    
    return result;
  },

  /**
   * Get courses list for an agency, campus, and program type
   * @param agencyId - Agency ID
   * @param campusId - Campus ID to filter courses
   * @param programTypeId - Program type ID (number)
   * @returns Promise with courses response (array directly, not wrapped)
   */
  getCourses: async (
    agencyId: number | string | null,
    campusId?: number | string | null,
    programTypeId?: number | string | null
  ): Promise<CourseItem[]> => {
    const queryParams = createQueryParams({
      agencyId,
      campusId: campusId || null,
      programTypeId: programTypeId || null,
    });

    const url = `${ENDPOINTS.AGENCIES.COURSES}?${queryParams.toString()}`;

    const response = await api.get(url);
    
    // Handle both direct array and wrapped response formats
    let result: CourseItem[] = [];
    if (Array.isArray(response.data)) {
      // Direct array response: [{id, name, ...}, ...]
      result = response.data;
    } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
      // Wrapped response: {status: "success", data: [{id, name, ...}, ...]}
      result = response.data.data;
    }
    
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
   * Get counselor list for an agency, filtered by manager or admin
   * @param agencyId - Agency ID
   * @param assignedManagerId - Manager ID to filter counselors (if user is MANAGER)
   * @param assignedAdminId - Admin ID to filter counselors (if user is ADMIN)
   * @returns Promise with counselor list response (array directly, not wrapped)
   */
  getCounselors: async (
    agencyId: number | string | null,
    assignedManagerId?: number | string | null,
    assignedAdminId?: number | string | null
  ): Promise<CounselorListResponse> => {
    const queryParams = createQueryParams({
      agencyId,
      assignedManagerId: assignedManagerId || null,
      assignedAdminId: assignedAdminId || null,
    });

    const url = `${ENDPOINTS.AGENCIES.COUNSELORS}?${queryParams.toString()}`;

    // API returns array directly: [{id, name}, ...]
    const response = await api.get<CounselorItem[]>(url);
    
    // Response.data is the array directly
    const result: CounselorItem[] = Array.isArray(response.data) ? response.data : [];
    
    return result;
  },

  /**
   * Get counselor list for an agency, filtered by country
   * @param agencyId - Agency ID
   * @param countryId - Country ID to filter counselors
   * @returns Promise with counselor list response (array directly, not wrapped)
   */
  getCounselorsByCountry: async (
    agencyId: number | string | null,
    countryId: number | string | null
  ): Promise<CounselorListResponse> => {
    if (!agencyId || !countryId) {
      return [];
    }

    const queryParams = createQueryParams({
      agencyId,
      countryId,
    });

    const url = `${ENDPOINTS.AGENCIES.COUNSELORS_BY_COUNTRY}?${queryParams.toString()}`;

    // API returns array directly: [{id, name}, ...]
    const response = await api.get<CounselorItem[]>(url);
    
    // Response.data is the array directly
    const result: CounselorItem[] = Array.isArray(response.data) ? response.data : [];
    
    return result;
  },

  /**
   * Apply for an application (submit application to university)
   * @param params - Apply application parameters (applicantId, applicationPrefId)
   * @returns Apply application response
   */
  applyApplication: async (
    params: ApplyApplicationParams
  ): Promise<ApplyApplicationResponse> => {
    const queryParams = createQueryParams({
      applicantId: params.applicantId,
      applicationPrefId: params.applicationPrefId,
    });

    const url = `${ENDPOINTS.APPLICANTS.APPLY}?${queryParams.toString()}`;

    const response = await api.post<ApplyApplicationResponse>(url);

    return response.data;
  },

  /**
   * Update application status
   * @param payload - Update application status payload
   * @returns Update application status response
   */
  updateApplicationStatus: async (
    payload: UpdateApplicationStatusPayload
  ): Promise<UpdateApplicationStatusResponse> => {
    const response = await api.put<UpdateApplicationStatusResponse>(
      ENDPOINTS.APPLICANTS.UPDATE_APPLICATION_STATUS,
      payload
    );

    return response.data;
  },

  /**
   * Get application status history
   * @param params - Status history parameters (applicantId, applicationPrefId)
   * @returns Status history response
   */
  getStatusHistory: async (
    params: StatusHistoryParams
  ): Promise<StatusHistoryResponse> => {
    const queryParams = createQueryParams({
      applicantId: params.applicantId,
      applicationPrefId: params.applicationPrefId,
    });

    const url = `${ENDPOINTS.APPLICANTS.STATUS_HISTORY}?${queryParams.toString()}`;

    const response = await api.get<StatusHistoryResponse>(url);

    return response.data;
  },

  /**
   * Create applicant personal details
   * @param payload - Personal details payload
   * @returns Create personal details response
   */
  createPersonalDetails: async (
    payload: CreatePersonalDetailsPayload
  ): Promise<CreatePersonalDetailsResponse> => {
    const response = await api.post<CreatePersonalDetailsResponse>(
      ENDPOINTS.APPLICANTS.PERSONAL_DETAILS,
      payload
    );

    return response.data;
  },

  /**
   * Get applicant personal details
   * @param applicantId - Applicant ID
   * @returns Get personal details response
   */
  getPersonalDetails: async (
    applicantId: number | string
  ): Promise<GetPersonalDetailsResponse> => {
    const url = ENDPOINTS.APPLICANTS.GET_PERSONAL_DETAILS(applicantId);

    const response = await api.get<GetPersonalDetailsResponse>(url);

    return response.data;
  },

  /**
   * Update applicant personal details
   * @param applicantId - Applicant ID
   * @param payload - Personal details payload
   * @returns Update personal details response
   */
  updatePersonalDetails: async (
    applicantId: number | string,
    payload: UpdatePersonalDetailsPayload
  ): Promise<UpdatePersonalDetailsResponse> => {
    const url = ENDPOINTS.APPLICANTS.UPDATE_PERSONAL_DETAILS(applicantId);

    const response = await api.put<UpdatePersonalDetailsResponse>(url, payload);

    return response.data;
  },

  /**
   * Get applicant application preferences
   * @param applicantId - Applicant ID
   * @returns Get application preferences response
   */
  getApplicationPreferences: async (
    applicantId: number | string
  ): Promise<GetApplicationPreferencesResponse> => {
    const url = ENDPOINTS.APPLICANTS.GET_APPLICATION_PREFERENCES(applicantId);

    const response = await api.get<GetApplicationPreferencesResponse>(url);

    return response.data;
  },

  /**
   * Create applicant application preferences
   * @param applicantId - Applicant ID
   * @param payload - Array of application preference items
   * @returns Create application preferences response
   */
  createApplicationPreferences: async (
    applicantId: number | string,
    payload: CreateApplicationPreferencesPayload
  ): Promise<CreateApplicationPreferencesResponse> => {
    const url = ENDPOINTS.APPLICANTS.APPLICATION_PREFERENCES(applicantId);

    const response = await api.post<CreateApplicationPreferencesResponse>(url, payload);

    return response.data;
  },

  /**
   * Update applicant application preference
   * @param preferenceId - Preference ID
   * @param applicantId - Applicant ID
   * @param payload - Single application preference item
   * @returns Update application preference response
   */
  updateApplicationPreference: async (
    preferenceId: number | string,
    applicantId: number | string,
    payload: UpdateApplicationPreferencePayload
  ): Promise<UpdateApplicationPreferenceResponse> => {
    const url = ENDPOINTS.APPLICANTS.UPDATE_APPLICATION_PREFERENCE(preferenceId, applicantId);

    const response = await api.put<UpdateApplicationPreferenceResponse>(url, payload);

    return response.data;
  },

  /**
   * Delete applicant application preference
   * @param preferenceId - Preference ID
   * @param applicantId - Applicant ID
   * @returns Delete application preference response
   */
  deleteApplicationPreference: async (
    preferenceId: number | string,
    applicantId: number | string
  ): Promise<DeleteApplicationPreferenceResponse> => {
    const url = ENDPOINTS.APPLICANTS.DELETE_APPLICATION_PREFERENCE(preferenceId, applicantId);

    const response = await api.delete<DeleteApplicationPreferenceResponse>(url);
    return response.data;
  },
  
  /**
   * Get applicant complete details (personal, educational, work experience, achievements)
   * @param params - Complete details parameters (agencyId, applicantId)
   * @returns Complete details response
   */
  getCompleteDetails: async (
    params: CompleteDetailsParams
  ): Promise<CompleteDetailsResponse> => {
    const queryParams = createQueryParams({
      agencyId: params.agencyId,
      applicantId: params.applicantId,
    });

    const url = `${ENDPOINTS.APPLICANTS.COMPLETE_DETAILS}?${queryParams.toString()}`;

    const response = await api.get<CompleteDetailsResponse>(url);

    return response.data;
  },

  /**
   * Create applicant educational details
   * @param payload - Educational details payload
   * @returns Educational details response
   */
  createEducationalDetails: async (
    payload: EducationalDetailsPayload
  ): Promise<EducationalDetailsResponse> => {
    const url = ENDPOINTS.APPLICANTS.EDUCATIONAL_DETAILS;

    const response = await api.post<EducationalDetailsResponse>(url, payload);

    return response.data;
  },

  /**
   * Get applicant educational details
   * @param applicantId - Applicant ID
   * @returns Get educational details response
   */
  getEducationalDetails: async (
    applicantId: number | string
  ): Promise<GetEducationalDetailsResponse> => {
    const url = ENDPOINTS.APPLICANTS.GET_EDUCATIONAL_DETAILS(applicantId);

    const response = await api.get<GetEducationalDetailsResponse>(url);

    return response.data;
  },

  /**
   * Update applicant educational details
   * @param payload - Educational details payload
   * @returns Update educational details response
   */
  updateEducationalDetails: async (
    payload: EducationalDetailsPayload
  ): Promise<UpdateEducationalDetailsResponse> => {
    const url = ENDPOINTS.APPLICANTS.UPDATE_EDUCATIONAL_DETAILS;

    const response = await api.put<UpdateEducationalDetailsResponse>(url, payload);

    return response.data;
  },

  /**
   * Create applicant work experiences
   * @param applicantId - Applicant ID
   * @param payload - Array of work experience items
   * @returns Create work experiences response
   */
  createWorkExperiences: async (
    applicantId: number | string,
    payload: WorkExperienceItemPayload[]
  ): Promise<CreateWorkExperiencesResponse> => {
    const url = ENDPOINTS.APPLICANTS.WORK_EXPERIENCES(applicantId);

    const response = await api.post<CreateWorkExperiencesResponse>(url, payload);

    return response.data;
  },

  /**
   * Get applicant work experiences
   * @param applicantId - Applicant ID
   * @returns Get work experiences response
   */
  getWorkExperiences: async (
    applicantId: number | string
  ): Promise<GetWorkExperiencesResponse> => {
    const url = ENDPOINTS.APPLICANTS.GET_WORK_EXPERIENCES(applicantId);

    const response = await api.get<GetWorkExperiencesResponse>(url);

    return response.data;
  },

  /**
   * Update applicant work experience
   * @param workExperienceId - Work experience ID
   * @param applicantId - Applicant ID
   * @param payload - Work experience item payload
   * @returns Update work experience response
   */
  updateWorkExperience: async (
    workExperienceId: number | string,
    applicantId: number | string,
    payload: WorkExperienceItemPayload
  ): Promise<UpdateWorkExperienceResponse> => {
    const url = ENDPOINTS.APPLICANTS.UPDATE_WORK_EXPERIENCE(workExperienceId, applicantId);

    const response = await api.put<UpdateWorkExperienceResponse>(url, payload);

    return response.data;
  },

  /**
   * Delete applicant work experience
   * @param workExperienceId - Work experience ID
   * @param applicantId - Applicant ID
   * @returns Delete work experience response
   */
  deleteWorkExperience: async (
    workExperienceId: number | string,
    applicantId: number | string
  ): Promise<DeleteWorkExperienceResponse> => {
    const url = ENDPOINTS.APPLICANTS.DELETE_WORK_EXPERIENCE(workExperienceId, applicantId);

    const response = await api.delete<DeleteWorkExperienceResponse>(url);
    return response.data;
  },

  /**
   * Create applicant achievements
   * @param applicantId - Applicant ID
   * @param payload - Array of achievement items
   * @returns Create achievements response
   */
  createAchievements: async (
    applicantId: number | string,
    payload: AchievementItemPayload[]
  ): Promise<CreateAchievementsResponse> => {
    const url = ENDPOINTS.APPLICANTS.ACHIEVEMENTS(applicantId);

    const response = await api.post<CreateAchievementsResponse>(url, payload);

    return response.data;
  },

  /**
   * Get applicant achievements
   * @param applicantId - Applicant ID
   * @returns Get achievements response
   */
  getAchievements: async (
    applicantId: number | string
  ): Promise<GetAchievementsResponse> => {
    const url = ENDPOINTS.APPLICANTS.GET_ACHIEVEMENTS(applicantId);

    const response = await api.get<GetAchievementsResponse>(url);

    return response.data;
  },

  /**
   * Update applicant achievement
   * @param achievementId - Achievement ID
   * @param applicantId - Applicant ID
   * @param payload - Achievement item payload
   * @returns Update achievement response
   */
  updateAchievement: async (
    achievementId: number | string,
    applicantId: number | string,
    payload: AchievementItemPayload
  ): Promise<UpdateAchievementResponse> => {
    const url = ENDPOINTS.APPLICANTS.UPDATE_ACHIEVEMENT(achievementId, applicantId);

    const response = await api.put<UpdateAchievementResponse>(url, payload);

    return response.data;
  },

  /**
   * Delete applicant achievement
   * @param achievementId - Achievement ID
   * @param applicantId - Applicant ID
   * @returns Delete achievement response
   */
  deleteAchievement: async (
    achievementId: number | string,
    applicantId: number | string
  ): Promise<DeleteAchievementResponse> => {
    const url = ENDPOINTS.APPLICANTS.DELETE_ACHIEVEMENT(achievementId, applicantId);

    const response = await api.delete<DeleteAchievementResponse>(url);
    return response.data;
  },

  /**
   * Generic lookup service function - reusable for different lookup types
   * @param endpoint - Lookup endpoint (e.g., ENROLLMENT_TYPE, PROGRAM_TYPE)
   * @returns Promise with lookup items array
   */
  getLookupData: async <T extends { id: number; code: string; name: string; isActive: boolean; sortOrder: number }>(
    endpoint: string
  ): Promise<T[]> => {
    const response = await api.get<ApiResponse<T[]>>(endpoint);
    
    // Handle both direct array response and wrapped ApiResponse
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      // Wrapped ApiResponse
      if (response.data.status === "success" && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } else if (Array.isArray(response.data)) {
      // Direct array response
      return response.data;
    }
    
    return [];
  },

  /**
   * Get enrollment types from lookup API
   * @returns Promise with enrollment types response
   */
  getEnrollmentTypes: async (): Promise<EnrollmentTypeItem[]> => {
    return applicantService.getLookupData<EnrollmentTypeItem>(ENDPOINTS.LOOKUP.ENROLLMENT_TYPE);
  },

  /**
   * Get program types from lookup API
   * @returns Promise with program types response
   */
  getProgramTypes: async (): Promise<ProgramTypeItem[]> => {
    return applicantService.getLookupData<ProgramTypeItem>(ENDPOINTS.LOOKUP.PROGRAM_TYPE);
  },

  /**
   * Get agency partner names list for an agency
   * @param agencyId - Agency ID
   * @returns Promise with agency partner names response (array directly, not wrapped)
   */
  getAgencyPartnerNames: async (
    agencyId: number | string | null
  ): Promise<AgencyPartnerNameItem[]> => {
    if (!agencyId) {
      return [];
    }

    const queryParams = createQueryParams({
      agencyId,
    });

    const url = `${ENDPOINTS.AGENCIES.AGENCY_PARTNER_NAME}?${queryParams.toString()}`;

    // API returns array directly: [{id, name}, ...]
    const response = await api.get<AgencyPartnerNameItem[]>(url);
    
    // Response.data is the array directly
    const result: AgencyPartnerNameItem[] = Array.isArray(response.data) ? response.data : [];
    
    return result;
  },

  /**
   * Get documents list for an applicant
   * @param applicantId - Applicant ID
   * @returns Promise with documents response
   */
  getDocuments: async (applicantId: number | string): Promise<GetDocumentsResponse> => {
    const url = ENDPOINTS.APPLICANTS.DOCUMENTS(applicantId);
    const response = await api.get<GetDocumentsResponse>(url);
    
    return response.data;
  },

  /**
   * Get application preference documents for an applicant
   * @param applicantId - Applicant ID
   * @param applicationPrefId - Application Preference ID
   * @returns Promise with application preference documents response
   */
  getApplicationPreferenceDocuments: async (
    applicantId: number | string,
    applicationPrefId: number | string
  ): Promise<ApplicationPreferenceDocumentsResponse> => {
    const url = ENDPOINTS.APPLICANTS.APPLICATION_PREFERENCE_DOCUMENTS(applicantId, applicationPrefId);
    const response = await api.get<ApplicationPreferenceDocumentsResponse>(url);
    
    return response.data;
  },

  /**
   * Upload a document for an applicant
   * @param applicantId - Applicant ID
   * @param documentName - Name of the document
   * @param file - File to upload
   * @param applicationPrefId - Optional application preference ID (for new documents)
   * @returns Promise with upload response
   */
  uploadDocument: async (
    applicantId: number | string,
    documentName: string,
    file: File,
    applicationPrefId?: number | string
  ): Promise<UploadDocumentResponse> => {
    const url = ENDPOINTS.APPLICANTS.UPLOAD_DOCUMENT(applicantId, applicationPrefId);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("documentName", documentName);
    formData.append("document", file);
    
    const response = await api.post<UploadDocumentResponse>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  },

  /**
   * Delete a document for an applicant
   * @param applicantId - Applicant ID
   * @param documentId - Document ID
   * @returns Promise with delete response
   */
  deleteDocument: async (applicantId: number | string, documentId: number | string): Promise<ApiResponse<null>> => {
    const url = ENDPOINTS.APPLICANTS.DELETE_DOCUMENT(applicantId, documentId);
    const response = await api.delete<ApiResponse<null>>(url);
    
    return response.data;
  },

  /**
   * Verify a document for an applicant
   * @param applicantId - Applicant ID
   * @param documentId - Document ID
   * @param isVerified - Verification status (true to verify, false to unverify)
   * @returns Promise with verify response
   */
  verifyDocument: async (
    applicantId: number | string,
    documentId: number | string,
    isVerified: boolean
  ): Promise<ApiResponse<null>> => {
    const url = ENDPOINTS.APPLICANTS.VERIFY_DOCUMENT(applicantId, documentId, isVerified);
    const response = await api.put<ApiResponse<null>>(url);
    
    return response.data;
  },

  /**
   * Get download URL for a document
   * @param applicantId - Applicant ID
   * @param documentId - Document ID
   * @returns Promise with download URL response
   */
  getDocumentDownloadUrl: async (
    applicantId: number | string,
    documentId: number | string
  ): Promise<DownloadDocumentUrlResponse> => {
    const url = ENDPOINTS.APPLICANTS.DOWNLOAD_DOCUMENT_URL(applicantId, documentId);
    const response = await api.get<DownloadDocumentUrlResponse>(url);
    
    return response.data;
  },

  /**
   * Get view URL for a document
   * @param applicantId - Applicant ID
   * @param documentId - Document ID
   * @returns Promise with view URL response
   */
  getDocumentViewUrl: async (
    applicantId: number | string,
    documentId: number | string
  ): Promise<ViewDocumentUrlResponse> => {
    const url = ENDPOINTS.APPLICANTS.VIEW_DOCUMENT_URL(applicantId, documentId);
    const response = await api.get<ViewDocumentUrlResponse>(url);
    
    return response.data;
  },

  /**
   * Download multiple documents as a zip file
   * @param applicantId - Applicant ID
   * @param documentIds - Array of document IDs
   * @returns Promise with blob data for the zip file
   */
  getDocumentZipDownloadUrl: async (
    applicantId: number | string,
    documentIds: (number | string)[]
  ): Promise<Blob> => {
    const url = ENDPOINTS.APPLICANTS.DOWNLOAD_ZIP_URL(applicantId, documentIds);
    const response = await api.post(url, {}, {
      responseType: "blob", // Request binary data
    });
    
    return response.data as Blob;
  },
};

export default applicantService;

