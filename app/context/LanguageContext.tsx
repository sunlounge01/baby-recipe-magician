"use client";

import { createContext, useContext, useState, ReactNode } from "react";

const SUPPORTED_LANGUAGES = ["zh", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

interface Translations {
  greeting: string;
  tabs: {
    chinese: string;
    western: string;
    japanese: string;
  };
  buttons: {
    save: string;
    cooked: string;
    youtube: string;
    google: string;
    regenerate: string;
    settings?: string;
  };
  labels: {
    serving: string;
    adult_menu: string;
    parallel: string;
    remix: string;
    consumption: string;
    actual_intake: string;
  };
  nutrients: {
    protein: string;
    calcium: string;
    iron: string;
    vitamin_c: string;
  };
  placeholders: {
    input: string;
    manual_name: string;
    manual_save: string;
  };
  welcome: {
    title: string;
    text: string;
    skip: string;
    start: string;
  };
  modal: {
    manual_title: string;
    auto_title: string;
    meal_name: string;
    date: string;
    meal_type: string;
    photo: string;
    photo_optional: string;
    rating: string;
    rating_optional: string;
    note: string;
    note_optional: string;
    cancel: string;
    save: string;
    analyzing: string;
    save_success: string;
    save_error: string;
    name_required: string;
  };
  meal_types: {
    breakfast: string;
    lunch: string;
    snack: string;
    dinner: string;
  };
  hero: {
    title: string;
    subtitle: string;
  };
}

const translations: Record<Language, Translations> = {
  zh: {
    greeting: "Hi, [Name] 今天想吃什麼呢？",
    tabs: { chinese: "中式", western: "西式", japanese: "日式" },
    buttons: { save: "收藏食譜", cooked: "我煮了這個", youtube: "影片教學", google: "Google 搜尋", regenerate: "🔄 都不喜歡，再換一組", settings: "設定" },
    labels: { serving: "份量", adult_menu: "👩‍🍳 同場加映：大人吃什麼？", parallel: "平行料理 (食材沿用)", remix: "美味加工 (口味升級)", consumption: "寶寶吃了多少？", actual_intake: "實際攝取" },
    nutrients: { protein: "蛋白質", calcium: "鈣質", iron: "鐵質", vitamin_c: "維生素C" },
    placeholders: { input: "輸入食材 (如: 雞肉, 南瓜...)", manual_name: "餐點名稱", manual_save: "紀錄" },
    modal: {
      manual_title: "➕ 手動補登",
      auto_title: "太棒了！紀錄這一餐 📸",
      meal_name: "菜名",
      date: "日期",
      meal_type: "餐別",
      photo: "照片",
      photo_optional: "(選填)",
      rating: "寶寶喜愛度",
      rating_optional: "(選填)",
      note: "心得筆記",
      note_optional: "(選填)",
      cancel: "取消",
      save: "儲存",
      analyzing: "🔍 魔法偵測中...",
      save_success: "你太棒了！日曆現在變得超級順手，魔法師也覺得很舒服！",
      save_error: "哎呀，魔法失手，再試一次！",
      name_required: "請輸入菜名"
    },
    meal_types: {
      breakfast: "早餐",
      lunch: "午餐",
      snack: "下午茶",
      dinner: "晚餐"
    },
    hero: {
      title: "幼兒食譜魔法師 ✨",
      subtitle: "Toddler Recipe Magician"
    },
    welcome: { title: "歡迎來到 幼兒食譜魔法師 ✨", text: "輸入 Email，獲得更多育兒營養資訊！", skip: "先略過，直接開始", start: "開始使用" }
  },
  en: {
    greeting: "Hi, [Name], what would you like to eat today?",
    tabs: { chinese: "Chinese", western: "Western", japanese: "Japanese" },
    buttons: { save: "Save", cooked: "Cooked", youtube: "Watch Video", google: "Search", regenerate: "🔄 Regenerate", settings: "Settings" },
    labels: { serving: "Serving", adult_menu: "👩‍🍳 For Adults", parallel: "Parallel Cooking", remix: "Tasty Remix", consumption: "How much did baby eat?", actual_intake: "Intake" },
    nutrients: { protein: "Protein", calcium: "Calcium", iron: "Iron", vitamin_c: "Vit C" },
    placeholders: { input: "Enter ingredients (e.g., Chicken...)", manual_name: "Meal Name", manual_save: "Log Meal" },
    modal: {
      manual_title: "➕ Manual Entry",
      auto_title: "Great! Log this meal 📸",
      meal_name: "Meal Name",
      date: "Date",
      meal_type: "Meal Type",
      photo: "Photo",
      photo_optional: "(Optional)",
      rating: "Baby's Rating",
      rating_optional: "(Optional)",
      note: "Notes",
      note_optional: "(Optional)",
      cancel: "Cancel",
      save: "Save",
      analyzing: "🔍 Magic is checking...",
      save_success: "You are awesome! Saved!",
      save_error: "Oops, magic fizzled. Try again!",
      name_required: "Please enter meal name"
    },
    meal_types: {
      breakfast: "Breakfast",
      lunch: "Lunch",
      snack: "Snack",
      dinner: "Dinner"
    },
    hero: {
      title: "Toddler Recipe Magician ✨",
      subtitle: "Making baby food is as simple as magic"
    },
    welcome: { title: "Welcome to Recipe Magician ✨", text: "Enter Email to unlock AI nutrition tips!", skip: "Skip for now", start: "Get Started" }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 初始狀態設為 zh，實際偵測在 useEffect 中執行（避免 Hydration Mismatch）
  const [language, setLanguage] = useState<Language>("zh");

  // 在 Client Side 執行語言偵測，避免 Hydration Mismatch
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("language");
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      setLanguage(saved as Language);
      return;
    }

    // 若存的是舊的 ja/ko，回退成 zh
    if (saved) {
      localStorage.setItem("language", "zh");
      setLanguage("zh");
      return;
    }

    // 如果 localStorage 沒有紀錄，檢查 navigator.language
    const browserLang = navigator.language || navigator.languages?.[0] || "en";
    const detectedLang = browserLang.toLowerCase().startsWith("zh") ? "zh" : "en";
    
    setLanguage(detectedLang);
    localStorage.setItem("language", detectedLang);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : "zh";
    setLanguage(safeLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", safeLang);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: translations[language] ?? translations["zh"],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

