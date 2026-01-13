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
    REGISTER: "users/register",
    UPDATE: "/users/update-userDetails",
    UPDATE_STATUS: "/users/update-userStatus",
  },

  // Agency Endpoints
  AGENCIES: {
    COUNTRIES: "/agencies/countries",
    UNIVERSITIES: "/agencies/universities",
    ADMINS: "/agencies/admins",
    MANAGERS: "/agencies/managers",
    COUNSELORS: "/agencies/counselors",
  },

  // Applicants Endpoints
  APPLICANTS: {
    OVERVIEW: "/applicants/overview",
    APPLICATIONS_LIST: "/applicants/applicationsList",
    APPLY: "/applicants/apply",
    UPDATE_APPLICATION_STATUS: "/applicants/update-applicationStatus",
    STATUS_HISTORY: "/applicants/statusHistory",
    PERSONAL_DETAILS: "/applicants/personal-details",
    GET_PERSONAL_DETAILS: (applicantId: number | string) => `/applicants/personal-details/${applicantId}`,
    UPDATE_PERSONAL_DETAILS: (applicantId: number | string) => `/applicants/personal-details/${applicantId}`,
    APPLICATION_PREFERENCES: (applicantId: number | string) => `/applicants/application-preferences/${applicantId}`,
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

