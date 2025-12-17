"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "zh" | "en" | "ja" | "ko";

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
    buttons: { save: "收藏食譜", cooked: "我煮了這個", youtube: "影片教學", google: "Google 搜尋", regenerate: "🔄 都不喜歡，再換一組" },
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
      analyzing: "🔍 分析營養中...",
      save_success: "紀錄已儲存！",
      save_error: "儲存失敗，可能是 LocalStorage 空間不足",
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
    }
  },
  en: {
    greeting: "Hi, [Name], what would you like to eat today?",
    tabs: { chinese: "Chinese", western: "Western", japanese: "Japanese" },
    buttons: { save: "Save", cooked: "Cooked", youtube: "Watch Video", google: "Search", regenerate: "🔄 Regenerate" },
    labels: { serving: "Serving", adult_menu: "👩‍🍳 For Adults", parallel: "Parallel Cooking", remix: "Tasty Remix", consumption: "How much did baby eat?", actual_intake: "Actual Intake" },
    nutrients: { protein: "Protein", calcium: "Calcium", iron: "Iron", vitamin_c: "Vit C" },
    placeholders: { input: "Enter ingredients (e.g., Chicken, Pumpkin...)", manual_name: "Meal Name", manual_save: "Log Meal" },
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
      analyzing: "🔍 Analyzing nutrition...",
      save_success: "Record saved!",
      save_error: "Save failed, LocalStorage may be full",
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
      subtitle: "Making baby food is as simple as magic!"
    }
  },
  ja: {
    greeting: "こんにちは、[Name] ちゃん、今日は何を食べたい？",
    tabs: { chinese: "中華風", western: "洋風", japanese: "和風" },
    buttons: { save: "保存", cooked: "作った", youtube: "動画", google: "検索", regenerate: "🔄 他のレシピを見る" },
    labels: { serving: "分量", adult_menu: "👩‍🍳 大人用メニュー", parallel: "大人用アレンジ (食材流用)", remix: "味変リメイク", consumption: "どれくらい食べましたか？", actual_intake: "実際の摂取量" },
    nutrients: { protein: "タンパク質", calcium: "カルシウム", iron: "鉄分", vitamin_c: "ビタミンC" },
    placeholders: { input: "食材を入力 (例: 鶏肉, かぼちゃ...)", manual_name: "料理名", manual_save: "記録" },
    modal: {
      manual_title: "➕ 手動登録",
      auto_title: "素晴らしい！この食事を記録 📸",
      meal_name: "料理名",
      date: "日付",
      meal_type: "食事タイプ",
      photo: "写真",
      photo_optional: "(任意)",
      rating: "赤ちゃんの評価",
      rating_optional: "(任意)",
      note: "メモ",
      note_optional: "(任意)",
      cancel: "キャンセル",
      save: "保存",
      analyzing: "🔍 栄養分析中...",
      save_success: "記録が保存されました！",
      save_error: "保存に失敗しました。LocalStorageの容量が不足している可能性があります",
      name_required: "料理名を入力してください"
    },
    meal_types: {
      breakfast: "朝食",
      lunch: "昼食",
      snack: "おやつ",
      dinner: "夕食"
    },
    hero: {
      title: "幼児食の魔法使い ✨",
      subtitle: "Toddler Recipe Magician"
    }
  },
  ko: {
    greeting: "안녕하세요, [Name] 님, 오늘 무엇을 먹을까요?",
    tabs: { chinese: "중식", western: "양식", japanese: "일식" },
    buttons: { save: "저장", cooked: "완료", youtube: "영상", google: "검색", regenerate: "🔄 다른 레시피 보기" },
    labels: { serving: "분량", adult_menu: "👩‍🍳 어른용 메뉴", parallel: "어른용 (재료 공유)", remix: "맛있는 리믹스", consumption: "아기가 얼마나 먹었나요?", actual_intake: "실제 섭취량" },
    nutrients: { protein: "단백질", calcium: "칼슘", iron: "철분", vitamin_c: "비타민C" },
    placeholders: { input: "재료 입력 (예: 닭고기, 호박...)", manual_name: "음식 이름", manual_save: "기록" },
    modal: {
      manual_title: "➕ 수동 입력",
      auto_title: "훌륭해요! 이 식사를 기록하세요 📸",
      meal_name: "음식 이름",
      date: "날짜",
      meal_type: "식사 유형",
      photo: "사진",
      photo_optional: "(선택사항)",
      rating: "아기 평가",
      rating_optional: "(선택사항)",
      note: "메모",
      note_optional: "(선택사항)",
      cancel: "취소",
      save: "저장",
      analyzing: "🔍 영양 분석 중...",
      save_success: "기록이 저장되었습니다!",
      save_error: "저장 실패, LocalStorage 공간이 부족할 수 있습니다",
      name_required: "음식 이름을 입력하세요"
    },
    meal_types: {
      breakfast: "아침식사",
      lunch: "점심식사",
      snack: "간식",
      dinner: "저녁식사"
    },
    hero: {
      title: "유아식 마법사 ✨",
      subtitle: "Toddler Recipe Magician"
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language;
      if (saved && ["zh", "en", "ja", "ko"].includes(saved)) {
        return saved;
      }
    }
    return "zh";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: translations[language],
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

