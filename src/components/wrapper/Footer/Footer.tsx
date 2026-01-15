import { useTranslation } from "react-i18next";
import { COLORS, APP_CONFIG } from "../../../constants";

interface FooterProps {
  companyName?: string;
  year?: number;
  links?: { label: string; href: string }[];
}

const Footer = ({
  companyName = APP_CONFIG.name,
  year = new Date().getFullYear(),
  links = [],
}: FooterProps) => {
  const { t } = useTranslation();

  return (
    <footer
      className="h-14 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-center gap-2"
      style={{
        backgroundColor: COLORS.surface,
        borderTop: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Copyright - Centered */}
      <div
        className="text-sm text-center"
        style={{ color: COLORS.textMuted }}
      >
        {t("footer.copyright", "© {{year}} {{company}}. All Rights Reserved.", { year, company: companyName })}
      </div>

      {/* Links */}
      {links.length > 0 && (
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline" style={{ color: COLORS.border }}>
            |
          </span>
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm transition-colors"
              style={{ color: COLORS.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textMuted;
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
