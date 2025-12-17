import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translations
import en from "./locales/en.json";
import hi from "./locales/hi.json";

// Language resources
const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
};

// Available languages
export const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
];

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem("language") || "en";

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "en",
  debug: false,
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
  react: {
    useSuspense: false,
  },
});

// Function to change language
export const changeLanguage = (languageCode: string) => {
  i18n.changeLanguage(languageCode);
  localStorage.setItem("language", languageCode);
};

// Function to get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

export default i18n;

// Export LanguageSwitcher component
export { default as LanguageSwitcher } from "./LanguageSwitcher";

