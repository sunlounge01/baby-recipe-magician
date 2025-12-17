"use client";

import { useLanguage, Language } from "../context/LanguageContext";

const languages: { code: Language; flag: string; name: string }[] = [
  { code: "zh", flag: "🇹🇼", name: "繁體中文" },
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const cycleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.code === language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code);
  };

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <button
      onClick={cycleLanguage}
      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all bg-paper-warm text-deep-teal font-medium tracking-wide"
      title={`切換語言 / Switch Language / 言語切替 / 언어 변경`}
    >
      <span className="text-lg sm:text-xl">{currentLang.flag}</span>
      <span className="text-xs sm:text-sm hidden sm:inline">{currentLang.name}</span>
    </button>
  );
}

