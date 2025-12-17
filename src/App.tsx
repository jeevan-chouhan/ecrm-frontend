import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "./constants";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ApplicantTracker from "./pages/ApplicantTracker";
import CreateApplicant from "./pages/ApplicantTracker/CreateApplicant";
import CountryUniversity from "./pages/CountryUniversity";
import DocumentVault from "./pages/DocumentVault";
import AgencyPartner from "./pages/AgencyPartner";
import ManageTeam from "./pages/ManageTeam";
import ReportAnalysis from "./pages/ReportAnalysis";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";

// Auth Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.PRICING} element={<Pricing />} />

        {/* Auth routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

        {/* Protected routes (for logged-in users) */}
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.APPLICANT_TRACKER} element={<ApplicantTracker />} />
        <Route path={ROUTES.CREATE_APPLICANT} element={<CreateApplicant />} />
        <Route path={ROUTES.COUNTRY_UNIVERSITY} element={<CountryUniversity />} />
        <Route path={ROUTES.DOCUMENT_VAULT} element={<DocumentVault />} />
        <Route path={ROUTES.AGENCY_PARTNER} element={<AgencyPartner />} />
        <Route path={ROUTES.MANAGE_TEAM} element={<ManageTeam />} />
        <Route path={ROUTES.REPORT_ANALYSIS} element={<ReportAnalysis />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
