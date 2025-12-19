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
  APPLICANT_TRACKER: "/applicant-tracker",
  CREATE_APPLICANT: "/applicant-tracker/create",
  COUNTRY_UNIVERSITY: "/country-university-directory",
  DOCUMENT_VAULT: "/document-vault",
  DOCUMENT_VAULT_DETAIL: "/document-vault/:applicantId",
  AGENCY_PARTNER: "/agency-partner",
  MANAGE_TEAM: "/manage-team",
  REPORT_ANALYSIS: "/report-analysis",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;

// Type for route keys
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
