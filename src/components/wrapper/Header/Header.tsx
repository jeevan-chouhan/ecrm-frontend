import { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Logout, Notification, Menu, Settings } from "../../../assets";
import { colors } from "../../../constants";
import { LanguageSwitcher } from "../../../language";
import PublicHeader from "./PublicHeader";

interface ProfileDropdownItem {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface HeaderProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  isLoggedIn?: boolean;
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  onPricingClick?: () => void;
}

const Header = ({
  userName = "Admin",
  userRole = "Abroad Agency",
  userAvatar,
  notificationCount = 0,
  onNotificationClick,
  onProfileClick,
  onLogoutClick,
  onMenuClick,
  showMenuButton = false,
  isLoggedIn = true,
  onRegisterClick,
  onLoginClick,
  onPricingClick,
}: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Render public header for non-logged in users
  if (!isLoggedIn) {
    return (
      <PublicHeader
        onRegisterClick={onRegisterClick}
        onLoginClick={onLoginClick}
        onPricingClick={onPricingClick}
      />
    );
  }

  const dropdownItems: ProfileDropdownItem[] = [
    {
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      onClick: onProfileClick,
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: onProfileClick,
    },
    {
      label: "Logout",
      icon: <Logout className="h-4 w-4" />,
      onClick: onLogoutClick,
    },
  ];

  return (
    <header
      className="h-16 px-4 md:px-6 flex items-center justify-between"
      style={{
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Left side - Menu button for mobile */}
      <div className="flex items-center">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg transition-colors lg:hidden"
            style={{ color: colors.textMuted }}
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Right side - Language, Notification and Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Switcher */}
        <LanguageSwitcher variant="dropdown" showLabel={false} />

        {/* Notification Icon */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: colors.textMuted }}
        >
          <Notification className="h-5 w-5" />
          {notificationCount > 0 && (
            <span
              className="absolute top-1 right-1 h-4 w-4 text-xs font-medium rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.error, color: colors.textWhite }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 rounded-lg px-2 py-1.5 transition-colors"
            style={{ backgroundColor: isDropdownOpen ? colors.surfaceHover : "transparent" }}
          >
            {/* Avatar */}
            <div
              className="h-9 w-9 md:h-10 md:w-10 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: `${colors.accent}20`,
                border: `2px solid ${colors.accent}40`,
              }}
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" style={{ color: colors.accent }} />
              )}
            </div>

            {/* Name and Role - Hidden on small screens */}
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  {userName}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  style={{ color: colors.textMuted }}
                />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: colors.accent }}
              >
                {userRole}
              </span>
            </div>

            {/* Chevron for mobile */}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 sm:hidden ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              style={{ color: colors.textMuted }}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-lg py-1 z-50"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Mobile: Show user info */}
              <div
                className="sm:hidden px-4 py-2"
                style={{ borderBottom: `1px solid ${colors.border}` }}
              >
                <p className="text-sm font-medium" style={{ color: colors.textDark }}>
                  {userName}
                </p>
                <p className="text-xs" style={{ color: colors.accent }}>
                  {userRole}
                </p>
              </div>
              {dropdownItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick?.();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors"
                  style={{
                    color: item.label === "Logout" ? colors.error : colors.textDark,
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      item.label === "Logout" ? `${colors.error}10` : colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ color: item.label === "Logout" ? colors.error : colors.textMuted }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
