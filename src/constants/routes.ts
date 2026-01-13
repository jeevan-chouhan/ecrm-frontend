// Route paths configuration
export const ROUTES = {
  // Public routes
  HOME: "/",
  PRICING: "/pricing",
  TERMS_AND_CONDITIONS: "/terms-and-conditions",

  // Auth routes
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  OTP_VERIFICATION: "/otp-verification",
  RESET_PASSWORD: "/reset-password",

  // Protected routes (logged-in users)
  DASHBOARD: "/dashboard",
  APPLICANT_TRACKER: "/application-tracker",
  CREATE_APPLICANT: "/application-tracker/create",
  APPLICANT_DETAIL: "/applicant-tracker/:applicantId",
  COUNTRY_UNIVERSITY: "/country-university-directory",
  DOCUMENT_VAULT: "/document-vault",
  DOCUMENT_VAULT_DETAIL: "/document-vault/:applicantId",
  AGENCY_PARTNER: "/agency-partner",
  MANAGE_TEAM: "/manage-team",
  MANAGE_TEAM_ADD: "/manage-team/add",
  MANAGE_TEAM_EDIT: "/manage-team/edit/:memberId",
  MANAGE_TEAM_VIEW: "/manage-team/:memberId",
  REPORT_ANALYSIS: "/report-analysis",
  SETTINGS: "/settings",
  SETTINGS_PRICING: "/settings/pricing",
  SUPPORT_FEEDBACK: "/support-feedback",
  PROFILE: "/profile",
} as const;

// Type for route keys
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
