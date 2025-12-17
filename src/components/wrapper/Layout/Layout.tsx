import { useState } from "react";
import type { ReactNode } from "react";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import { User, Settings, Dashboard } from "../../../assets";
import { colors } from "../../../constants";

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
  userName = "Admin",
  userRole = "Abroad Agency",
  userAvatar,
  notificationCount = 0,
  onNotificationClick,
  onProfileClick,
  onLogoutClick,
}: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarItems = [
    {
      label: "Dashboard",
      isActive: true,
      icon: <Dashboard className="h-5 w-5" />,
    },
    {
      label: "Users",
      icon: <User className="h-5 w-5" />,
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: colors.background }}
    >
      {/* Sidebar */}
      <Sidebar
        logoText="E-CRM"
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
          userName={userName}
          userRole={userRole}
          userAvatar={userAvatar}
          notificationCount={notificationCount}
          showMenuButton={true}
          onMenuClick={() => setMobileMenuOpen(true)}
          onNotificationClick={onNotificationClick}
          onProfileClick={onProfileClick}
          onLogoutClick={onLogoutClick}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        {/* Footer */}
        <Footer companyName="E-CRM" />
      </div>
    </div>
  );
};

export default Layout;
