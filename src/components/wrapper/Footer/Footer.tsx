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
    <footer className="h-14 bg-white border-t border-slate-200 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-center gap-2">
      {/* Copyright - Centered */}
      <div className="text-sm text-slate-500 text-center">
        © {year} {companyName}. All rights reserved.
      </div>

      {/* Links */}
      {links.length > 0 && (
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline text-slate-300">|</span>
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
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
