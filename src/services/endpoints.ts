// ==========================================
// API Endpoints
// ==========================================

export const ENDPOINTS = {
  // Auth Endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    VERIFY_OTP: "/auth/verify-otp",
    UPDATE_PASSWORD: "/auth/update-password",
  },

  // Users Endpoints
  USERS: {
    LIST: "/users/userList",
    DETAILS: "/users/userDetails",
    PROFILE_DETAILS: "/users/profileDetails",
    REGISTER: "users/add-member",
    UPDATE: "/users/update-userDetails",
    UPDATE_STATUS: "/users/update-userStatus",
    TEAM_OVERVIEW: "/users/team-overview",
  },

  // Agency Endpoints
  AGENCIES: {
    REGISTER: "/agencies/register",
    COUNTRIES: "/agencies/countries",
    UNIVERSITIES: "/agencies/universities",
    CAMPUSES: "/agencies/campuses",
    COURSES: "/agencies/courses",
    ADMINS: "/agencies/admins",
    MANAGERS: "/agencies/managers",
    COUNSELORS: "/agencies/counselors",
    COUNSELORS_BY_COUNTRY: "/agencies/counselors-by-country",
    PARTNERS: "/agencies/partners",
    PARTNERS_LIST: "/agencies/partnersList",
    PARTNER_NAMES: "/agencies/global-agencyPartner-name",
    AGENCY_PARTNER_NAME: "/agencies/agency-partner-name",
    GENERAL_SETTINGS: "/agencies/general-settings",
    SERVING: "/agencies/serving",
    SETTING_UNIVERSITY_LIST: "/agencies/setting-universityList",
    OVERALL_COUNTS: "/agencies/overall-counts",
    ANALYTICS: "/reports/analytics",
    START_TRIAL: (agencyId: number | string) => `/agencies/start-trial/${agencyId}`,
    CURRENT_SUBSCRIPTION: (agencyId: number | string) => `/agencies/currentSubscription/${agencyId}`,
    PAYMENT_LINKS: (agencyId: number | string) => `/agencies/paymentLinks/${agencyId}`,
    BRANDING: (agencyId: number | string) => `/agencies/${agencyId}/branding`,
  },

  // Plan Endpoints
  PLAN: {
    GET_ALL: "/plan/getAll",
  },

  // Support Endpoints
  SUPPORT: {
    RAISE: (agencyId: number | string, userId: number | string) =>
      `/support/raise?agencyId=${agencyId}&userId=${userId}`,
    MY_QUERIES: (userId: number | string, page: number, size: number) =>
      `/support/my-queries?userId=${userId}&page=${page}&size=${size}`,
    REPLIES: (queryId: number | string, page: number, size: number) =>
      `/support/${queryId}/replies?page=${page}&size=${size}`,
  },

  // Menu Endpoints
  MENU: {
    GET_BY_ROLE: "/menu",
  },

  // University Details Endpoints
  UNIVERSITY_DETAILS: {
    INFO: (universityId: number | string) =>
      `/university-details/info?universityId=${universityId}`,
  },

  // Lookup Endpoints
  LOOKUP: {
    ENROLLMENT_TYPE: "/lookup/enrollment_type",
    PROGRAM_TYPE: "/lookup/program_type",
    HIGHEST_QUALIFICATION: "/lookup/highest_qualification",
    SCORE_TYPE: "/lookup/score_type",
    CATEGORY: "/lookup/category",
  },

  // Applicants Endpoints
  APPLICANTS: {
    OVERVIEW: "/applicants/overview",
    APPLICATIONS_LIST: "/applicants/applicationsList",
    APPLY: "/applicants/apply",
    UPDATE_APPLICATION_STATUS: "/applicants/update-applicationStatus",
    UPDATE_APPLICANT_STATUS: "/applicants/update-applicantStatus",
    STATUS_HISTORY: "/applicants/statusHistory",
    PERSONAL_DETAILS: "/applicants/personal-details",
    GET_PERSONAL_DETAILS: (applicantId: number | string) => `/applicants/personal-details/${applicantId}`,
    UPDATE_PERSONAL_DETAILS: (applicantId: number | string) => `/applicants/personal-details/${applicantId}`,
    APPLICATION_PREFERENCES: (applicantId: number | string) => `/applicants/application-preferences/${applicantId}`,
    GET_APPLICATION_PREFERENCES: (applicantId: number | string) => `/applicants/application-preferences/${applicantId}`,
    UPDATE_APPLICATION_PREFERENCE: (preferenceId: number | string, applicantId: number | string) => `/applicants/application-preferences?applicantId=${applicantId}&preferenceId=${preferenceId}`,
    DELETE_APPLICATION_PREFERENCE: (preferenceId: number | string, applicantId: number | string) => `/applicants/application-preferences?preferenceId=${preferenceId}&applicantId=${applicantId}`,
    COMPLETE_DETAILS: "/applicants/complete-details",
    EDUCATIONAL_DETAILS: "/applicants/educational-details",
    GET_EDUCATIONAL_DETAILS: (applicantId: number | string) => `/applicants/educational-details?applicantId=${applicantId}`,
    UPDATE_EDUCATIONAL_DETAILS: "/applicants/educational-details",
    WORK_EXPERIENCES: (applicantId: number | string) => `/applicants/work-experiences?applicantId=${applicantId}`,
    GET_WORK_EXPERIENCES: (applicantId: number | string) => `/applicants/work-experiences?applicantId=${applicantId}`,
    UPDATE_WORK_EXPERIENCE: (workExperienceId: number | string, applicantId: number | string) => `/applicants/work-experiences?workExperienceId=${workExperienceId}&applicantId=${applicantId}`,
    DELETE_WORK_EXPERIENCE: (workExperienceId: number | string, applicantId: number | string) => `/applicants/work-experiences?workExperienceId=${workExperienceId}&applicantId=${applicantId}`,
    ACHIEVEMENTS: (applicantId: number | string) => `/applicants/achievements?applicantId=${applicantId}`,
    GET_ACHIEVEMENTS: (applicantId: number | string) => `/applicants/achievements?applicantId=${applicantId}`,
    UPDATE_ACHIEVEMENT: (achievementId: number | string, applicantId: number | string) => `/applicants/achievements?achievementId=${achievementId}&applicantId=${applicantId}`,
    DELETE_ACHIEVEMENT: (achievementId: number | string, applicantId: number | string) => `/applicants/achievements?achievementId=${achievementId}&applicantId=${applicantId}`,
    DOCUMENTS: (applicantId: number | string) => `/applicants/documents?applicantId=${applicantId}`,
    APPLICATION_PREFERENCE_DOCUMENTS: (applicantId: number | string, applicationPrefId: number | string) =>
      `/applicants/application-preference-documents?applicantId=${applicantId}&applicationPrefId=${applicationPrefId}`,
    UPLOAD_DOCUMENT: (applicantId: number | string, applicationPrefId?: number | string) => {
      const baseUrl = `/applicants/documents?applicantId=${applicantId}`;
      return applicationPrefId ? `${baseUrl}&applicationPrefId=${applicationPrefId}` : baseUrl;
    },
    DELETE_DOCUMENT: (applicantId: number | string, documentId: number | string) => `/applicants/documents?applicantId=${applicantId}&documentId=${documentId}`,
    VERIFY_DOCUMENT: (applicantId: number | string, documentId: number | string, isVerified: boolean) => `/applicants/verify?applicantId=${applicantId}&documentId=${documentId}&isVerified=${isVerified}`,
    DOWNLOAD_DOCUMENT_URL: (applicantId: number | string, documentId: number | string) => `/applicants/documents/download-url?applicantId=${applicantId}&documentId=${documentId}`,
    VIEW_DOCUMENT_URL: (applicantId: number | string, documentId: number | string) => `/applicants/documents/view?applicantId=${applicantId}&documentId=${documentId}`,
    DOWNLOAD_ZIP_URL: (applicantId: number | string, documentIds: (number | string)[]) => {
      const idsParam = documentIds.join(",");
      return `/applicants/documents/download-zip-url?applicantId=${applicantId}&documentIds=${idsParam}`;
    },
  },

  //   // User Endpoints
  //   USER: {
  //     PROFILE: "/user/profile",
  //     UPDATE_PROFILE: "/user/profile",
  //     LIST: "/user/list",
  //     GET_BY_ID: (id: number | string) => `/user/${id}`,
  //     CREATE: "/user/create",
  //     UPDATE: (id: number | string) => `/user/${id}`,
  //     DELETE: (id: number | string) => `/user/${id}`,
  //   },

  //   // Candidate Endpoints
  //   CANDIDATE: {
  //     LIST: "/candidate/list",
  //     GET_BY_ID: (id: number | string) => `/candidate/${id}`,
  //     CREATE: "/candidate/create",
  //     UPDATE: (id: number | string) => `/candidate/${id}`,
  //     DELETE: (id: number | string) => `/candidate/${id}`,
  //     SEARCH: "/candidate/search",
  //   },

  //   // Application Endpoints
  //   APPLICATION: {
  //     LIST: "/application/list",
  //     GET_BY_ID: (id: number | string) => `/application/${id}`,
  //     CREATE: "/application/create",
  //     UPDATE: (id: number | string) => `/application/${id}`,
  //     DELETE: (id: number | string) => `/application/${id}`,
  //     UPDATE_STATUS: (id: number | string) => `/application/${id}/status`,
  //   },

  //   // Dashboard Endpoints
  //   DASHBOARD: {
  //     STATS: "/dashboard/stats",
  //     RECENT_ACTIVITY: "/dashboard/recent-activity",
  //     CHARTS: "/dashboard/charts",
  //   },

  //   // Settings Endpoints
  //   SETTINGS: {
  //     GET: "/settings",
  //     UPDATE: "/settings",
  //   },

  //   // Common/Utility Endpoints
  //   COMMON: {
  //     UPLOAD_FILE: "/upload",
  //     COUNTRIES: "/common/countries",
  //     STATES: (countryId: number | string) => `/common/states/${countryId}`,
  //     CITIES: (stateId: number | string) => `/common/cities/${stateId}`,
  //   },
} as const;

export default ENDPOINTS;

