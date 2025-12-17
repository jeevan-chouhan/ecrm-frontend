import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { languages, changeLanguage } from "./index";
import { ChevronDown } from "../assets";
import { COLORS } from "../constants";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "buttons";
  showLabel?: boolean;
}

const LanguageSwitcher = ({
  variant = "dropdown",
  showLabel = true,
}: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === "buttons") {
    return (
      <div className="flex items-center gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              backgroundColor:
                i18n.language === lang.code ? COLORS.accent : "transparent",
              color:
                i18n.language === lang.code
                  ? COLORS.textWhite
                  : COLORS.textMuted,
            }}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
        style={{
          backgroundColor: isOpen ? COLORS.surfaceHover : "transparent",
          color: COLORS.textDark,
        }}
      >
        <span className="text-sm font-medium">
          {showLabel ? currentLanguage?.nativeName : currentLanguage?.code.toUpperCase()}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-40 rounded-lg py-1 z-50"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between"
              style={{
                backgroundColor:
                  i18n.language === lang.code
                    ? COLORS.surfaceHover
                    : "transparent",
                color: COLORS.textDark,
              }}
              onMouseEnter={(e) => {
                if (i18n.language !== lang.code) {
                  e.currentTarget.style.backgroundColor = COLORS.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (i18n.language !== lang.code) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span>{lang.nativeName}</span>
              {i18n.language === lang.code && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS.accent }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

