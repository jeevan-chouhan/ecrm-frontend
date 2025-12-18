// Route paths configuration
export const ROUTES = {
  // Public routes
  HOME: "/",
  PRICING: "/pricing",

  // Auth routes
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Protected routes (logged-in users)
  DASHBOARD: "/dashboard",
  APPLICANT_TRACKER: "/applicant-tracker",
  CREATE_APPLICANT: "/applicant-tracker/create",
  COUNTRY_UNIVERSITY: "/country-university-directory",
  DOCUMENT_VAULT: "/document-vault",
  AGENCY_PARTNER: "/agency-partner",
  MANAGE_TEAM: "/manage-team",
  REPORT_ANALYSIS: "/report-analysis",
  SETTINGS: "/settings",
} as const;

// Type for route keys
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
