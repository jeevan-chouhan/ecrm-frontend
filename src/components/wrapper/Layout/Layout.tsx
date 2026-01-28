import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import {
  Dashboard,
  Applicant,
  Chart,
  University,
  Agency,
  Team,
  Report,
  Settings,
  InfoCircle,
} from "../../../assets";
import { COLORS, ROUTES, APP_CONFIG, getRoleDisplayName } from "../../../constants";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { clearCredentials } from "../../../redux/slices/auth/authSlice";
import { clearMenu } from "../../../redux/slices/menu/menuSlice";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { resetManageTeamState } from "../../../redux/slices/manageTeam/manageTeamSlice";
import { resetDashboardState } from "../../../redux/slices/dashboard/dashboardSlice";
import { resetDocumentVaultState } from "../../../redux/slices/documentVault/documentVaultSlice";
import { resetAgencyPartnerState } from "../../../redux/slices/agencyPartner/agencyPartnerSlice";

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

// Icon mapping - maps API menuIcon to components
const iconMap: Record<string, ReactNode> = {
  DASHBOARD: <Dashboard className="h-5 w-5" />,
  APPLICATION_TRACKER: <Applicant className="h-5 w-5" />,
  COUNTRY_DIRECTORY: <University className="h-5 w-5" />,
  MASTER_LEDGER: <Chart className="h-5 w-5" />,
  AGENCY_PARTNER: <Agency className="h-5 w-5" />,
  MANAGE_TEAM: <Team className="h-5 w-5" />,
  REPORT_ANALYSIS: <Report className="h-5 w-5" />,
  SUPPORT_FEEDBACK: <InfoCircle className="h-5 w-5" />,
  SETTINGS: <Settings className="h-5 w-5" />,
};

// Path mapping - maps menuIcon to routes
const pathMap: Record<string, string> = {
  DASHBOARD: ROUTES.DASHBOARD,
  APPLICATION_TRACKER: ROUTES.APPLICANT_TRACKER,
  COUNTRY_DIRECTORY: ROUTES.COUNTRY_UNIVERSITY,
  MASTER_LEDGER: ROUTES.MASTER_LEDGER,
  AGENCY_PARTNER: ROUTES.AGENCY_PARTNER,
  MANAGE_TEAM: ROUTES.MANAGE_TEAM,
  REPORT_ANALYSIS: ROUTES.REPORT_ANALYSIS,
  SUPPORT_FEEDBACK: ROUTES.SUPPORT_FEEDBACK,
  SETTINGS: ROUTES.SETTINGS,
};

// Display order mapping - maintains menu sequence
const displayOrderMap: Record<string, number> = {
  DASHBOARD: 1,
  APPLICATION_TRACKER: 2,
  COUNTRY_DIRECTORY: 3,
  MASTER_LEDGER: 4,
  AGENCY_PARTNER: 5,
  MANAGE_TEAM: 6,
  REPORT_ANALYSIS: 7,
  SUPPORT_FEEDBACK: 8,
  SETTINGS: 9,
};

// Translation key mapping for menu items
const translationKeyMap: Record<string, string> = {
  "Dashboard": "sidebar.dashboard",
  "Application Tracker": "sidebar.applicationTracker",
  "Country & Directory": "sidebar.countryUniversity",
  "Country & University Directory": "sidebar.countryUniversity",
  "Master Ledger": "sidebar.masterLedger",
  "Agency Partner": "sidebar.agencyPartner",
  "Manage Team": "sidebar.manageTeam",
  "Report & Analysis": "sidebar.reportAnalysis",
  "Support & Feedback": "sidebar.supportFeedback",
  "Settings": "sidebar.settings",
};

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
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get user data and menu items from Redux store
  const { user } = useAppSelector((state) => state.auth);
  const { items: menuItems } = useAppSelector((state) => state.menu);
  
  // Sort menu items by displayOrderMap to maintain proper sequence
  const sortedMenuItems = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    return [...menuItems].sort((a, b) => {
      const orderA = displayOrderMap[a.menuIcon] ?? 999;
      const orderB = displayOrderMap[b.menuIcon] ?? 999;
      return orderA - orderB;
    });
  }, [menuItems]);
  
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
    
    // Clear menu state
    dispatch(clearMenu());
    
    // Reset manageTeam, dashboard, documentVault and agencyPartner state on logout
    dispatch(resetManageTeamState());
    dispatch(resetDashboardState());
    dispatch(resetDocumentVaultState());
    dispatch(resetAgencyPartnerState());
    
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
    // Reset documentVault state if navigating away from Application Tracker Documents routes
    if (!path.includes("/application-tracker/documents/")) {
      dispatch(resetDocumentVaultState());
    }
    // Reset agencyPartner state if navigating away from Agency Partner
    if (path !== ROUTES.AGENCY_PARTNER) {
      dispatch(resetAgencyPartnerState());
    }
  };

  // Check if a path is active based on menuIcon
  const isPathActive = (menuIcon: string): boolean => {
    const path = pathMap[menuIcon];
    if (!path) return false;

    // Special handling for Dashboard with applicant detail
    if (menuIcon === "DASHBOARD") {
      return location.pathname === ROUTES.DASHBOARD || (isApplicantDetailPage && isFromDashboard);
    }
    // Special handling for Application Tracker
    if (menuIcon === "APPLICATION_TRACKER") {
      return (location.pathname.startsWith(ROUTES.APPLICANT_TRACKER) || location.pathname.startsWith("/applicant-tracker")) && !(isApplicantDetailPage && isFromDashboard);
    }
    // For other routes, check if current path starts with the menu path
    return location.pathname.startsWith(path);
  };

  // Convert API menu items to sidebar items
  const sidebarItems = useMemo(() => {
    return sortedMenuItems.map((item) => {
      const path = pathMap[item.menuIcon] || ROUTES.DASHBOARD;
      return {
        label: t(translationKeyMap[item.menuName] || item.menuName, item.menuName),
        path: path,
        icon: iconMap[item.menuIcon] || <Dashboard className="h-5 w-5" />,
        isActive: isPathActive(item.menuIcon),
      };
    });
  }, [sortedMenuItems, t, location.pathname, isApplicantDetailPage, isFromDashboard]);

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
