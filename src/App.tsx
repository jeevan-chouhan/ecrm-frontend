import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "./constants";
import Spinner from "./assets/Spinner";

// Lazy loaded Pages
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ApplicantTracker = lazy(() => import("./pages/ApplicantTracker"));
const CreateApplicant = lazy(() => import("./pages/ApplicantTracker/CreateApplicant"));
const CountryUniversity = lazy(() => import("./pages/CountryUniversity"));
const DocumentVault = lazy(() => import("./pages/DocumentVault"));
const DocumentDetail = lazy(() => import("./pages/DocumentVault/DocumentDetail/index"));
const AgencyPartner = lazy(() => import("./pages/AgencyPartner"));
const ManageTeam = lazy(() => import("./pages/ManageTeam"));
const ManageTeamView = lazy(() => import("./pages/ManageTeam/View"));
const ReportAnalysis = lazy(() => import("./pages/ReportAnalysis"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Pricing = lazy(() => import("./pages/Pricing"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));

// Lazy loaded Auth Pages
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const OtpVerification = lazy(() => import("./pages/Auth/OtpVerification"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner className="h-12 w-12 animate-spin text-purple-600" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.PRICING} element={<Pricing />} />
        <Route path={ROUTES.TERMS_AND_CONDITIONS} element={<TermsAndConditions />} />

        {/* Auth routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.OTP_VERIFICATION} element={<OtpVerification />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

        {/* Protected routes (for logged-in users) */}
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.APPLICANT_TRACKER} element={<ApplicantTracker />} />
        <Route path={ROUTES.CREATE_APPLICANT} element={<CreateApplicant />} />
        <Route path={ROUTES.COUNTRY_UNIVERSITY} element={<CountryUniversity />} />
        <Route path={ROUTES.DOCUMENT_VAULT} element={<DocumentVault />} />
        <Route path={ROUTES.DOCUMENT_VAULT_DETAIL} element={<DocumentDetail />} />
        <Route path={ROUTES.AGENCY_PARTNER} element={<AgencyPartner />} />
        <Route path={ROUTES.MANAGE_TEAM} element={<ManageTeam />} />
        <Route path={ROUTES.MANAGE_TEAM_VIEW} element={<ManageTeamView />} />
        <Route path={ROUTES.REPORT_ANALYSIS} element={<ReportAnalysis />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
