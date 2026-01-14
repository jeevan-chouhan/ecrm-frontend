import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./constants";
import { ProtectedRoute, PublicRoute } from "./guards";
import { GlobalLoader } from "./components";

// ==========================================
// Lazy Loaded Pages
// ==========================================

// Public Pages
const Home = lazy(() => import("./pages/Home"));
const Pricing = lazy(() => import("./pages/Pricing"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));

// Auth Pages
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const OtpVerification = lazy(() => import("./pages/Auth/OtpVerification"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));

// Error Pages
const NotFound = lazy(() => import("./pages/NotFound"));

// Protected Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ApplicantTracker = lazy(() => import("./pages/ApplicantTracker"));
const CreateApplicant = lazy(() => import("./pages/ApplicantTracker/CreateApplicant"));
const ApplicantDetailView = lazy(() => import("./pages/ApplicantTracker/ApplicantDetail"));
const CountryUniversity = lazy(() => import("./pages/CountryUniversity"));
const DocumentVault = lazy(() => import("./pages/DocumentVault"));
const DocumentDetail = lazy(() => import("./pages/DocumentVault/DocumentDetail/index"));
const AgencyPartner = lazy(() => import("./pages/AgencyPartner"));
const ManageTeam = lazy(() => import("./pages/ManageTeam"));
const ManageTeamAdd = lazy(() => import("./pages/ManageTeam/AddMember"));
const ManageTeamView = lazy(() => import("./pages/ManageTeam/View"));
const ReportAnalysis = lazy(() => import("./pages/ReportAnalysis"));
const Settings = lazy(() => import("./pages/Settings"));
const SupportFeedback = lazy(() => import("./pages/SupportFeedback"));
const Profile = lazy(() => import("./pages/Profile"));

// ==========================================
// Route Configuration
// ==========================================

interface RouteConfig {
  path: string;
  element: ReactNode;
}

// Public routes - Redirect to dashboard if logged in
// (Home, Pricing, Auth pages - only for non-authenticated users)
const publicRoutes: RouteConfig[] = [
  { path: ROUTES.HOME, element: <Home /> },
  { path: ROUTES.PRICING, element: <Pricing /> },
  { path: ROUTES.TERMS_AND_CONDITIONS, element: <TermsAndConditions /> },
  { path: ROUTES.LOGIN, element: <Login /> },
  { path: ROUTES.REGISTER, element: <Register /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
  { path: ROUTES.OTP_VERIFICATION, element: <OtpVerification /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPassword /> },
];

// Protected routes - Require authentication
const protectedRoutes: RouteConfig[] = [
  { path: ROUTES.DASHBOARD, element: <Dashboard /> },
  { path: ROUTES.APPLICANT_TRACKER, element: <ApplicantTracker /> },
  { path: ROUTES.CREATE_APPLICANT, element: <CreateApplicant /> },
  { path: ROUTES.APPLICANT_DETAIL, element: <ApplicantDetailView /> },
  { path: ROUTES.COUNTRY_UNIVERSITY, element: <CountryUniversity /> },
  { path: ROUTES.DOCUMENT_VAULT, element: <DocumentVault /> },
  { path: ROUTES.DOCUMENT_VAULT_DETAIL, element: <DocumentDetail /> },
  { path: ROUTES.AGENCY_PARTNER, element: <AgencyPartner /> },
  { path: ROUTES.MANAGE_TEAM, element: <ManageTeam /> },
  { path: ROUTES.MANAGE_TEAM_ADD, element: <ManageTeamAdd /> },
  { path: ROUTES.MANAGE_TEAM_EDIT, element: <ManageTeamAdd /> },
  { path: ROUTES.MANAGE_TEAM_VIEW, element: <ManageTeamView /> },
  { path: ROUTES.REPORT_ANALYSIS, element: <ReportAnalysis /> },
  { path: ROUTES.SETTINGS, element: <Settings /> },
  { path: ROUTES.SETTINGS_PRICING, element: <Pricing /> },
  { path: ROUTES.SUPPORT_FEEDBACK, element: <SupportFeedback /> },
  { path: ROUTES.PROFILE, element: <Profile /> },
];

// ==========================================
// App Component
// ==========================================

function App() {
  return (
    <Suspense fallback={<GlobalLoader forceShow />}>
      <Routes>
        {/* Public routes - Redirect to dashboard if logged in */}
        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={<PublicRoute>{element}</PublicRoute>} />
        ))}

        {/* Protected routes - Require authentication */}
        {protectedRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
        ))}

        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
