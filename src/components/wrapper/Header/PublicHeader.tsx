import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES, COLORS, APP_CONFIG } from "../../../constants";
import { Menu, Close } from "../../../assets";
import Button from "../../Button/Button";

interface PublicHeaderProps {
  onHomeClick?: () => void;
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  onPricingClick?: () => void;
}

const PublicHeader = ({
  onHomeClick,
  onRegisterClick,
  onLoginClick,
  onPricingClick,
}: PublicHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Home", onClick: onHomeClick, href: ROUTES.HOME },
    { label: "Login", onClick: onLoginClick, href: ROUTES.LOGIN },
    { label: "Pricing", onClick: onPricingClick, href: ROUTES.PRICING },
    { label: "Register Agency", onClick: onRegisterClick, href: ROUTES.REGISTER },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header
      className="h-16 px-4 md:px-8 lg:px-12 flex items-center justify-between fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <span
          className="text-lg md:text-xl font-bold tracking-tight"
          style={{
            color: COLORS.textDark,
          }}
        >
          {APP_CONFIG.name}
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            onClick={item.onClick}
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{
              color: isActive(item.href) ? COLORS.accent : COLORS.textDark,
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        icon={mobileMenuOpen ? (
          <Close className="h-6 w-6" style={{ color: COLORS.textDark }} />
        ) : (
          <Menu className="h-6 w-6" style={{ color: COLORS.textDark }} />
        )}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden"
      />

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          className="absolute top-16 left-0 right-0 md:hidden py-4 px-4"
          style={{
            backgroundColor: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => {
                  item.onClick?.();
                  setMobileMenuOpen(false);
                }}
                className="py-3 px-4 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: isActive(item.href) ? COLORS.accent : COLORS.textDark,
                  backgroundColor: isActive(item.href) ? `${COLORS.accent}10` : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
