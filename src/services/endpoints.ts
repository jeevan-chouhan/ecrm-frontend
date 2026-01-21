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
  },

  // Agency Endpoints
  AGENCIES: {
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

