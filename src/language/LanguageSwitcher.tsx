import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { languages, changeLanguage } from "./index";
import { ChevronDown } from "../assets";
import { COLORS } from "../constants";
import Button from "../components/Button/Button";

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
          <Button
            key={lang.code}
            variant={i18n.language === lang.code ? "accent" : "ghost"}
            size="sm"
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.code.toUpperCase()}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        rightIcon={
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        }
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: isOpen ? COLORS.surfaceHover : "transparent",
          color: COLORS.textDark,
        }}
      >
        {showLabel ? currentLanguage?.nativeName : currentLanguage?.code.toUpperCase()}
      </Button>

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
            <Button
              key={lang.code}
              variant="ghost"
              size="sm"
              fullWidth
              rightIcon={i18n.language === lang.code ? (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS.accent }}
                />
              ) : undefined}
              onClick={() => handleLanguageChange(lang.code)}
              className="justify-between"
              style={{
                backgroundColor:
                  i18n.language === lang.code
                    ? COLORS.surfaceHover
                    : "transparent",
                color: COLORS.textDark,
                borderRadius: 0,
              }}
            >
              {lang.nativeName}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

