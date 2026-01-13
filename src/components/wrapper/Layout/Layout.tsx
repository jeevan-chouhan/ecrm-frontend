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
  InfoCircle,
} from "../../../assets";
import { COLORS, ROUTES, APP_CONFIG, getRoleDisplayName } from "../../../constants";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { clearCredentials } from "../../../redux/slices/auth/authSlice";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { resetManageTeamState } from "../../../redux/slices/manageTeam/manageTeamSlice";
import { resetDashboardState } from "../../../redux/slices/dashboard/dashboardSlice";
import { resetDocumentVaultState } from "../../../redux/slices/documentVault/documentVaultSlice";

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
  const displayName = userName || user?.name;
  
  // Format role - show "Primary Admin" if isPrimaryAdmin is true, otherwise use getRoleDisplayName
  const getFormattedRole = () => {
    if (userRole) return userRole;
    if (user?.isPrimaryAdmin) return "Primary Admin";
    if (user?.role) return getRoleDisplayName(user.role);
    return "User";
  };
  const displayRole = getFormattedRole();

  // Handle logout - clear localStorage and Redux state
  const handleLogout = () => {
    // Clear Redux auth state (this also clears localStorage)
    dispatch(clearCredentials());
    
    // Reset manageTeam, dashboard and documentVault state on logout
    dispatch(resetManageTeamState());
    dispatch(resetDashboardState());
    dispatch(resetDocumentVaultState());
    
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
  // Handle sidebar item click - reset state when navigating away
  const handleSidebarItemClick = (path: string) => {
    // Reset manageTeam state if navigating away from ManageTeam routes
    if (!path.startsWith(ROUTES.MANAGE_TEAM)) {
      dispatch(resetManageTeamState());
    }
    // Reset dashboard state if navigating away from Dashboard
    if (path !== ROUTES.DASHBOARD) {
      dispatch(resetDashboardState());
    }
    // Reset documentVault state if navigating away from DocumentVault routes
    if (!path.startsWith(ROUTES.DOCUMENT_VAULT)) {
      dispatch(resetDocumentVaultState());
    }
  };

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
      label: "Support & Feedback",
      path: ROUTES.SUPPORT_FEEDBACK,
      icon: <InfoCircle className="h-5 w-5" />,
      isActive: location.pathname === ROUTES.SUPPORT_FEEDBACK,
    },
    {
      label: "Settings",
      path: ROUTES.SETTINGS,
      icon: <Settings className="h-5 w-5" />,
      isActive: location.pathname.startsWith(ROUTES.SETTINGS),
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
        onItemClick={handleSidebarItemClick}
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
