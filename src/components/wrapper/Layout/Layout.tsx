import { useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import {
  Dashboard,
  Applicant,
  University,
  Document,
  Agency,
  Team,
  Report,
  Settings,
} from "../../../assets";
import { COLORS, ROUTES, APP_CONFIG } from "../../../constants";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { clearCredentials } from "../../../redux/slices/auth/authSlice";
import { addToast } from "../../../redux/slices/toast/toastSlice";

interface LayoutProps {
  children: ReactNode;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
}

const Layout = ({
  children,
  userName,
  userRole,
  userAvatar,
  notificationCount = 0,
  onNotificationClick,
  onProfileClick,
  onLogoutClick,
}: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get user data from Redux store
  const { user } = useAppSelector((state) => state.auth);
  
  // Use Redux user data or props
  const displayName = userName || user?.name || "Admin";
  const displayRole = userRole || user?.role || "User";

  // Handle logout - clear localStorage and Redux state
  const handleLogout = () => {
    // Clear Redux auth state (this also clears localStorage)
    dispatch(clearCredentials());
    
    // Show logout success toast
    dispatch(
      addToast({
        type: "success",
        message: "Logged out successfully",
      })
    );
    
    // Call optional callback
    onLogoutClick?.();
    
    // Navigate to login page
    navigate(ROUTES.LOGIN);
  };

  // Check if we came from Dashboard (for applicant detail view)
  const locationState = location.state as { from?: string } | null;
  const isFromDashboard = locationState?.from === "dashboard";
  const isApplicantDetailPage = location.pathname.startsWith("/applicant-tracker") && location.pathname !== ROUTES.APPLICANT_TRACKER;

  const sidebarItems = [
    {
      label: "Dashboard",
      path: ROUTES.DASHBOARD,
      icon: <Dashboard className="h-5 w-5" />,
      isActive: location.pathname === ROUTES.DASHBOARD || (isApplicantDetailPage && isFromDashboard),
    },
    {
      label: "Application Tracker",
      path: ROUTES.APPLICANT_TRACKER,
      icon: <Applicant className="h-5 w-5" />,
      isActive: (location.pathname.startsWith(ROUTES.APPLICANT_TRACKER) || location.pathname.startsWith("/applicant-tracker")) && !(isApplicantDetailPage && isFromDashboard),
    },
    {
      label: "Country & University Directory",
      path: ROUTES.COUNTRY_UNIVERSITY,
      icon: <University className="h-5 w-5" />,
      isActive: location.pathname === ROUTES.COUNTRY_UNIVERSITY,
    },
    {
      label: "Document Vault",
      path: ROUTES.DOCUMENT_VAULT,
      icon: <Document className="h-5 w-5" />,
      isActive: location.pathname.startsWith(ROUTES.DOCUMENT_VAULT),
    },
    {
      label: "Agency Partner",
      path: ROUTES.AGENCY_PARTNER,
      icon: <Agency className="h-5 w-5" />,
      isActive: location.pathname === ROUTES.AGENCY_PARTNER,
    },
    {
      label: "Manage Team",
      path: ROUTES.MANAGE_TEAM,
      icon: <Team className="h-5 w-5" />,
      isActive: location.pathname.startsWith(ROUTES.MANAGE_TEAM),
    },
    {
      label: "Report & Analysis",
      path: ROUTES.REPORT_ANALYSIS,
      icon: <Report className="h-5 w-5" />,
      isActive: location.pathname === ROUTES.REPORT_ANALYSIS,
    },
    {
      label: "Settings",
      path: ROUTES.SETTINGS,
      icon: <Settings className="h-5 w-5" />,
      isActive: location.pathname === ROUTES.SETTINGS,
    },
  ];

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Sidebar */}
      <Sidebar
        logoText={APP_CONFIG.name}
        items={sidebarItems}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          userName={displayName}
          userRole={displayRole}
          userAvatar={userAvatar}
          notificationCount={notificationCount}
          showMenuButton={true}
          onMenuClick={() => setMobileMenuOpen(true)}
          onNotificationClick={onNotificationClick}
          onProfileClick={onProfileClick}
          onLogoutClick={handleLogout}
        />

        {/* Page Content */}
        <main 
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </main>

        {/* Footer */}
        <Footer companyName={APP_CONFIG.name} />
      </div>
    </div>
  );
};

export default Layout;
