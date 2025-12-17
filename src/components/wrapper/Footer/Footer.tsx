import { colors } from "../../../constants";

interface FooterProps {
  companyName?: string;
  year?: number;
  links?: { label: string; href: string }[];
}

const Footer = ({
  companyName = "E-CRM",
  year = new Date().getFullYear(),
  links = [],
}: FooterProps) => {
  return (
    <footer
      className="h-14 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-center gap-2"
      style={{
        backgroundColor: colors.surface,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      {/* Copyright - Centered */}
      <div
        className="text-sm text-center"
        style={{ color: colors.textMuted, fontFamily: "'Inter', sans-serif" }}
      >
        © {year} {companyName}. All rights reserved.
      </div>

      {/* Links */}
      {links.length > 0 && (
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline" style={{ color: colors.border }}>
            |
          </span>
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm transition-colors"
              style={{ color: colors.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textMuted;
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </footer>
  );
};

export default Footer;
