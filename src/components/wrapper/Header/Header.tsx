import { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Logout, Notification, Menu, Settings } from "../../../assets";

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
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
      {/* Left side - Menu button for mobile */}
      <div className="flex items-center">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Right side - Notification and Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notification Icon */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Notification className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            {/* Avatar */}
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center border-2 border-indigo-200">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-indigo-600" />
              )}
            </div>

            {/* Name and Role - Hidden on small screens */}
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-slate-700">
                  {userName}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <span className="text-xs text-indigo-600 font-medium">
                {userRole}
              </span>
            </div>

            {/* Chevron for mobile */}
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 sm:hidden ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
              {/* Mobile: Show user info */}
              <div className="sm:hidden px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-700">{userName}</p>
                <p className="text-xs text-indigo-600">{userRole}</p>
              </div>
              {dropdownItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick?.();
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2.5 flex items-center gap-3
                    text-sm text-slate-700 hover:bg-slate-50
                    transition-colors
                    ${item.label === "Logout" ? "text-red-600 hover:bg-red-50" : ""}
                  `}
                >
                  <span className={item.label === "Logout" ? "text-red-500" : "text-slate-400"}>
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
