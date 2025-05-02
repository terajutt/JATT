import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import pa from "./translations/pa.json";

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      pa: {
        translation: pa
      }
    },
    lng: localStorage.getItem("language") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
