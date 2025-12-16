import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Close } from "../../../assets";

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
}

const Sidebar = ({
  logo,
  logoText = "E-CRM",
  items = [],
  footer,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) => {
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          h-screen bg-slate-900 text-white
          flex flex-col
          transition-all duration-300
          ${collapsed ? "lg:w-20" : "lg:w-64"}
          ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {logo || (
              <>
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                  E
                </div>
                {!collapsed && (
                  <span className="text-lg font-semibold whitespace-nowrap">
                    {logoText}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
          >
            <Close className="h-5 w-5" />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={index}>
                <button
                  onClick={item.onClick}
                  title={collapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium
                    transition-colors duration-150
                    ${collapsed ? "justify-center" : ""}
                    ${
                      item.isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  {item.icon && (
                    <span className="shrink-0">{item.icon}</span>
                  )}
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {footer && !collapsed && (
          <div className="p-4 border-t border-slate-700">{footer}</div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
