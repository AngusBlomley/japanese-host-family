import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ja from "@/locales/ja.json";

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem("language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Listen for language changes
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
});

export default i18n;
