"use client";

import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "zh" ? "en" : "zh");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center gap-1 sm:gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-xl border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all bg-paper-warm text-deep-teal font-medium tracking-wide"
      title={`切換語言 / Switch Language / 言語切替 / 언어 변경`}
    >
      <span className="text-lg sm:text-xl">{language === "zh" ? "🇹🇼" : "🇺🇸"}</span>
      <span className="text-xs sm:text-sm hidden sm:inline">{language === "zh" ? "中文" : "EN"}</span>
    </button>
  );
}

