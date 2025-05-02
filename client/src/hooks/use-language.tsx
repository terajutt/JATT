import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<string>(() => {
    // Initialize with saved language or default to English
    return localStorage.getItem("language") || "en";
  });

  useEffect(() => {
    // Set the initial language
    i18n.changeLanguage(language);
  }, [i18n]);

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    
    // Set document language attribute
    document.documentElement.lang = lang;

    // Update font for Punjabi if needed
    if (lang === "pa") {
      document.documentElement.classList.add("punjabi-font");
    } else {
      document.documentElement.classList.remove("punjabi-font");
    }
  };

  const value = {
    language,
    setLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
