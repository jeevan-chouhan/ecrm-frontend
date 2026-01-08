import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, Close, LogoImage } from "../../../assets";
import { COLORS, componentSpecs, APP_CONFIG } from "../../../constants";
import Button from "../../Button/Button";

interface SidebarItem {
  label: string;
  icon?: ReactNode;
  path?: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  logo?: ReactNode;
  logoText?: string;
  items?: SidebarItem[];
  footer?: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onItemClick?: (path: string) => void; // Callback when sidebar item is clicked
}

const Sidebar = ({
  logo,
  logoText = APP_CONFIG.name,
  items = [],
  footer,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
  onItemClick,
}: SidebarProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <div className="relative">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            h-screen
            flex flex-col
            transition-all duration-300
            ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          style={{
            width: collapsed ? componentSpecs.sidebar.collapsedWidth : componentSpecs.sidebar.width,
            minWidth: collapsed ? componentSpecs.sidebar.collapsedWidth : componentSpecs.sidebar.width,
            backgroundColor: COLORS.surface,
            borderRight: `1px solid ${COLORS.border}`,
          }}
        >
          {/* Logo */}
          <div
            className="h-16 flex items-center px-4"
            style={{ borderBottom: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center gap-3">
              {logo || (
                <>
                  <img
                    src={LogoImage}
                    alt="AgencyOS Logo"
                    className="h-9 w-9 rounded-lg object-contain shrink-0"
                  />
                  {!collapsed && (
                    <span
                      className="text-lg font-bold whitespace-nowrap"
                      style={{ color: COLORS.textDark }}
                    >
                      {logoText}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              icon={<Close className="h-5 w-5" style={{ color: COLORS.textMuted }} />}
              onClick={onMobileClose}
              className="lg:hidden ml-auto"
            />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {items.map((item, index) => {
                const isHovered = hoveredIndex === index;
                const isActive = item.isActive;

                // Use NavLink for items with path
                  if (item.path) {
                  return (
                    <li key={index}>
                      <NavLink
                        to={item.path}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => {
                          onMobileClose?.();
                          onItemClick?.(item.path!);
                        }}
                        title={collapsed ? item.label : undefined}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-full
                          text-sm font-medium
                          transition-all duration-150
                          ${collapsed ? "justify-center" : ""}
                        `}
                        style={{
                          backgroundColor: isActive
                            ? COLORS.accent
                            : isHovered
                            ? COLORS.surfaceHover
                            : "transparent",
                          color: isActive ? COLORS.textWhite : COLORS.textDark,
                          textDecoration: "none",
                        }}
                      >
                        {item.icon && (
                          <span
                            className="shrink-0"
                            style={{
                              color: isActive ? COLORS.textWhite : COLORS.accent,
                            }}
                          >
                            {item.icon}
                          </span>
                        )}
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </li>
                  );
                }

                // Fallback to button for items without path
                return (
                  <li key={index}>
                    <Button
                      variant={isActive ? "accent" : "ghost"}
                      size="sm"
                      fullWidth
                      leftIcon={item.icon ? (
                        <span
                          className="shrink-0"
                          style={{
                            color: isActive ? COLORS.textWhite : COLORS.accent,
                          }}
                        >
                          {item.icon}
                        </span>
                      ) : undefined}
                      onClick={item.onClick}
                      title={collapsed ? item.label : undefined}
                      className={collapsed ? "justify-center" : "justify-start"}
                      style={{
                        backgroundColor: isActive
                          ? COLORS.accent
                          : isHovered
                          ? COLORS.surfaceHover
                          : "transparent",
                        color: isActive ? COLORS.textWhite : COLORS.textDark,
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {!collapsed && item.label}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          {footer && !collapsed && (
            <div className="p-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              {footer}
            </div>
          )}

          {/* Desktop Collapse Button - Positioned at right edge, centered with header */}
          <Button
            variant="outline"
            size="sm"
            rounded
            icon={collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            onClick={onToggleCollapse}
            className="!hidden lg:!flex absolute -right-3 h-6 w-6 shadow-md z-10"
            style={{
              top: "20px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
              color: COLORS.accent,
              padding: "2px",
            }}
          />
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
