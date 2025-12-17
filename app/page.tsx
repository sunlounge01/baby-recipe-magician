"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Globe, Keyboard, Mic, Camera, ChefHat, Loader2, CheckCircle2, CheckCircle, Youtube, Search, Calendar, Heart, Clock, Settings as SettingsIcon } from "lucide-react";
import CollectionModal from "./components/CollectionModal";
import CompleteMealModal from "./components/CompleteMealModal";
import HeroSection from "./components/HeroSection";
import LanguageSwitcher from "./components/LanguageSwitcher";
import WelcomeModal from "./components/WelcomeModal";
import { useLanguage } from "./context/LanguageContext";
import { supabase } from "../lib/supabaseClient";

type Mode = "strict" | "creative" | "shopping";

interface UserProfile {
  nickname?: string;
  birthday?: string;
  allergies?: string[];
  dietPreference?: string;
  cookingTools?: string[];
  guest?: boolean;
  email?: string;
}

export default function Home() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const tr = (zh: string, en: string) => (language === "en" ? en : zh);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [babies, setBabies] = useState<Array<{ id: number; name: string; months_old: number | null }>>([]);
  const [selectedBabyIds, setSelectedBabyIds] = useState<number[]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>("strict");
  const [inputText, setInputText] = useState("");
  const [selectedTool, setSelectedTool] = useState("any");
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [inputMethod, setInputMethod] = useState<"keyboard" | "mic" | "camera">("keyboard");
  const [isCompleteMealModalOpen, setIsCompleteMealModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsBirthday, setSettingsBirthday] = useState("");

  const uiText = {
    diary: tr("飲食日記", "Diary"),
    cookingNow: tr("魔法進行中...", "Cooking..."),
    cookMagic: tr("變出魔法食譜", "Generate Recipe"),
    ingredients: tr("食材清單", "Ingredients"),
    steps: tr("料理步驟", "Steps"),
    nutrition: tr("營養資訊", "Nutrition"),
    nutritionTags: tr("營養標籤", "Nutrition Tags"),
    tip: tr("營養師小語", "Dietitian Note"),
    micronutrients: tr("微量營養素", "Micronutrients"),
    adults: language === "en" ? "👩‍🍳 For Adults" : (t.labels.adult_menu || "👩‍🍳 同場加映：大人吃什麼？"),
    stepsLabel: tr("料理步驟：", "Steps:"),
    imageBtn: tr("圖片", "Images"),
    defaultSearch: tr("幼兒食譜", "toddler recipe"),
    errApi: tr("哎呀，小魔法累了 (API)！", "Oops, magic tired (API)!"),
    errGenerate: tr("魔法失手，再試一次！", "Spell fizzled, try again!"),
    retryLater: tr("再等等，魔法師補充能量中", "Give me a sec to recharge magic"),
    netRetry: tr("檢查網路後再試一次唷", "Check your internet and retry"),
    ageFallback: tr("適合幼兒", "Toddler-friendly"),
  };

  // 計算年齡
  const calculateAge = (birthday: string): string => {
    if (!birthday) return "";
    const birth = new Date(birthday);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return language === "en" ? `${months} mo` : `${months}個月`;
    } else if (months === 0) {
      return language === "en" ? `${years} yr` : `${years}歲`;
    } else {
      return language === "en" ? `${years} yr ${months} mo` : `${years}歲${months}個月`;
    }
  };

  const getMonthsFromBirthday = (birthday?: string | null) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const today = new Date();
    let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (today.getDate() < birth.getDate()) months -= 1;
    return Math.max(months, 0);
  };

  const selectedBabies = useMemo(
    () => babies.filter((b) => selectedBabyIds.includes(b.id)),
    [babies, selectedBabyIds]
  );
  const selectedBabyCount = Math.max(selectedBabies.length, 1);
  const activeBabyMonths = useMemo(() => {
    const monthsList = selectedBabies
      .map((b) => (typeof b.months_old === "number" ? b.months_old : null))
      .filter((v) => v !== null) as number[];
    if (monthsList.length > 0) return Math.min(...monthsList);
    const fallback = getMonthsFromBirthday(userProfile?.birthday || null);
    return fallback ?? undefined;
  }, [selectedBabies, userProfile?.birthday]);

  const loadBabiesFromSupabase = async (email: string) => {
    if (!supabase || !email) return;
    const getUserIdByEmail = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      if (error) return null;
      return data?.id as string;
    };

    let uid = userId;
    if (!uid) {
      uid = await getUserIdByEmail();
      if (uid) {
        setUserId(uid);
        if (typeof window !== "undefined") localStorage.setItem("userId", uid);
      }
    }
    if (!uid) return;

    const { data, error } = await supabase
      .from("babies")
      .select("*")
      .eq("user_id", uid)
      .order("id", { ascending: true });
    if (!error && data) {
      setBabies(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("babies", JSON.stringify(data));
        if (!localStorage.getItem("activeBabyIds") && data.length > 0) {
          localStorage.setItem("activeBabyIds", JSON.stringify([data[0].id]));
        }
      }
      if (selectedBabyIds.length === 0 && data.length > 0) {
        setSelectedBabyIds([data[0].id]);
      }
    }
  };

  const scaleAmount = (amount: string) => {
    const match = amount.match(/([\d.]+)/);
    if (!match) return selectedBabyCount > 1 ? `${amount} x${selectedBabyCount}` : amount;
    const value = parseFloat(match[1]) * selectedBabyCount;
    const unit = amount.slice(match.index! + match[1].length).trim();
    const numStr = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    return `${numStr}${unit ? ` ${unit}` : ""}`;
  };

  const formatIngredientEntry = (ing: any) => {
    if (typeof ing === "string") {
      return selectedBabyCount > 1 ? `${ing} x${selectedBabyCount}` : ing;
    }
    if (!ing) return "";
    const amt = ing.amount ? scaleAmount(ing.amount) : "";
    return `${ing.name || ""}${amt ? ` ${amt}` : ""}`.trim();
  };

  const toggleBaby = (id: number, name?: string) => {
    setSelectedBabyIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((b) => b !== id) : [...prev, id];
      const final = next.length > 0 ? next : [id];
      if (!exists) {
        alert(`現在是 ${name || "寶寶"} 的用餐時間囉！`);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("activeBabyIds", JSON.stringify(final));
      }
      return final;
    });
  };

  // 路由保護：檢查 userProfile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('userProfile');
      const storedEmail = localStorage.getItem('userEmail');
      const storedUserId = localStorage.getItem('userId');
      const storedBabies = localStorage.getItem('babies');

      if (!storedProfile && !storedEmail) {
        router.push('/onboarding');
        return;
      }

      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          setUserProfile(profile);
          if (profile.email) setUserEmail(profile.email);
        } catch (error) {
          console.error('解析 userProfile 失敗:', error);
        }
      }
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
      if (storedUserId) {
        setUserId(storedUserId);
      }
      if (storedBabies) {
        try {
          const parsed = JSON.parse(storedBabies);
          setBabies(parsed);
          if (parsed.length > 0 && selectedBabyIds.length === 0) {
            const storedActive = localStorage.getItem("activeBabyIds");
            if (storedActive) {
              const ids = JSON.parse(storedActive);
              setSelectedBabyIds(ids);
            } else {
              setSelectedBabyIds([parsed[0].id]);
            }
          }
        } catch (e) {
          console.error("解析 babies 失敗", e);
        }
      }
    }
  }, [router]);

  useEffect(() => {
    if (userEmail) {
      loadBabiesFromSupabase(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const visited = localStorage.getItem('hasVisited');
    if (visited !== 'true') {
      setShowWelcome(true);
    }
  }, []);

  const modes = [
    {
      id: "strict" as Mode,
      title: tr("現在就要煮 ❤️‍🔥", "Cook now ❤️‍🔥"),
      subtitle: tr("只使用現有食材", "Use only current ingredients"),
      placeholder: tr("現在桌上有什麼食材？例如：高麗菜、絞肉...", "What ingredients do you have? e.g., cabbage, minced pork..."),
    },
    {
      id: "creative" as Mode,
      title: tr("發揮創意 💭", "Be creative 💭"),
      subtitle: tr("彈性加入常見食材或佐料", "Add common items flexibly"),
      placeholder: tr("冰箱剩什麼？例如：高麗菜、吻仔魚...", "What's left in the fridge? e.g., cabbage, whitebait..."),
    },
    {
      id: "shopping" as Mode,
      title: tr("採買靈感 🛒", "Shopping inspo 🛒"),
      subtitle: tr("輸入想吃的，規劃完整採買清單", "Tell us what you crave; we'll list full shopping items"),
      placeholder: tr("想讓寶寶吃什麼口味？例如：南瓜濃湯...", "What flavor for baby? e.g., pumpkin soup..."),
    },
  ];


  const cookingTools = [
    { value: "any", label: tr("不限工具", "Any tool") },
    { value: "rice-cooker", label: tr("電鍋 (最推薦)", "Rice cooker (recommended)") },
    { value: "pan", label: tr("平底鍋", "Pan") },
    { value: "pot", label: tr("燉鍋", "Pot") },
    { value: "oven", label: tr("烤箱", "Oven") },
  ];

  const currentMode = modes.find((m) => m.id === selectedMode)!;

  interface NutritionInfo {
    calories: number;
    tags: string[];
    benefit: string;
    macros: {
      protein: string;
      carbs: string;
      fat: string;
    };
    micronutrients?: {
      calcium: string;
      iron: string;
      vitamin_c: string;
    };
  }

  // 新的資料結構：支援多道食譜
  interface RecipeItem {
    style: "中式" | "西式" | "日式";
    title: string;
    ingredients: Array<{ name: string; amount: string }> | string[]; // 支援新舊格式
    nutrition: NutritionInfo;
    serving_info: string;
    steps: string[];
    time: string;
    adults_menu?: {
      parallel: {
        title: string;
        desc: string;
        steps: string[];
      };
      remix: {
        title: string;
        desc: string;
        steps: string[];
      };
    };
    searchKeywords: string;
  }

  const [recipesData, setRecipesData] = useState<{ recipes: RecipeItem[] } | null>(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  
  // 向後相容：保留舊的 recipeResult
  const [recipeResult, setRecipeResult] = useState<{
    name: string;
    age: string;
    time?: string;
    nutrition: NutritionInfo | string[] | string;
    ingredients: string[];
    steps: string[];
    searchKeywords: string;
  } | null>(null);

  const handleGenerateRecipe = async () => {
    console.log('開始呼叫 API...', { ingredients: inputText, mode: selectedMode, tool: selectedTool });
    setIsLoading(true);
    setShowResult(false);

    try {
      // 呼叫 API 生成食譜
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: inputText,
          mode: selectedMode,
          tool: selectedTool,
          language: language,
          age: activeBabyMonths,
        }),
      });

      console.log('API 回應狀態:', response.status, response.ok);

      // 檢查回應狀態
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `${uiText.errApi}: ${response.status}` }));
        const errorMessage = errorData.error || `${uiText.errApi}: ${response.status}`;
        console.error('API error:', errorMessage);
        alert(`${uiText.errApi}: ${errorMessage}`);
        
        // 處理 nutrition 資料
        let errorNutrition: NutritionInfo | string[] | string;
        if (typeof errorData.nutrition === 'object' && errorData.nutrition !== null && 'calories' in errorData.nutrition) {
          errorNutrition = errorData.nutrition;
        } else {
          errorNutrition = typeof errorData.nutrition === 'string' ? [errorData.nutrition] : [errorData.nutrition || tr("發生錯誤", "Error")];
        }
        
        // 即使錯誤也顯示結果（如果有部分資料）
        setRecipeResult({
          name: errorData.title || uiText.errGenerate,
          age: uiText.retryLater,
          nutrition: errorNutrition,
          ingredients: errorData.ingredients || [],
          steps: errorData.steps || [],
          searchKeywords: errorData.searchKeywords || "",
        });
        setIsLoading(false);
        setShowResult(true);
        return;
      }

      const data = await response.json();
      console.log('收到 API 資料:', data);

      // 檢查是否為新格式（recipes 陣列）
      if (data.recipes && Array.isArray(data.recipes) && data.recipes.length > 0) {
        // 新格式：多道食譜
        console.log('收到新格式資料（多道食譜）:', data.recipes.length, '道');
        setRecipesData(data);
        setSelectedRecipeIndex(0); // 預設選第一道
        
        // 轉換為舊格式以保持相容性（使用第一道食譜）
        const firstRecipe = data.recipes[0];
        const ingredientsArray = Array.isArray(firstRecipe.ingredients) 
          ? firstRecipe.ingredients.map((ing: any) => formatIngredientEntry(ing))
          : [];
        
        setRecipeResult({
          name: firstRecipe.title,
          age: firstRecipe.serving_info || uiText.ageFallback,
          time: firstRecipe.time || tr("20 分鐘", "20 mins"),
          nutrition: firstRecipe.nutrition,
          ingredients: ingredientsArray,
          steps: firstRecipe.steps || [],
          searchKeywords: firstRecipe.searchKeywords || firstRecipe.title || "",
        });
      } else if (data.error) {
        // 處理錯誤情況
        console.log('API 回傳錯誤:', data.error);
        let nutritionData: NutritionInfo | string[] | string;
        if (typeof data.nutrition === 'object' && data.nutrition !== null && 'calories' in data.nutrition) {
          nutritionData = data.nutrition as NutritionInfo;
        } else {
          nutritionData = {
            calories: 0,
            tags: [],
            benefit: data.error,
            macros: { protein: "0g", carbs: "0g", fat: "0g" }
          };
        }
        setRecipeResult({
          name: data.title || tr("無法生成食譜", "Unable to generate recipe"),
          age: tr("請重新輸入", "Please re-enter"),
          nutrition: nutritionData,
          ingredients: data.ingredients || [],
          steps: data.steps || [],
          searchKeywords: data.searchKeywords || "",
        });
        setRecipesData(null);
      } else {
        // 舊格式：單一道食譜（向後相容）
        console.log('收到舊格式資料（單一道食譜）');
        let nutritionData: NutritionInfo | string[] | string;
        if (typeof data.nutrition === 'object' && data.nutrition !== null && 'calories' in data.nutrition) {
          nutritionData = data.nutrition as NutritionInfo;
        } else if (Array.isArray(data.nutrition)) {
          nutritionData = data.nutrition;
        } else if (typeof data.nutrition === 'string') {
          nutritionData = [data.nutrition];
        } else {
          nutritionData = {
            calories: 200,
            tags: [tr("營養均衡", "Balanced")],
            benefit: tr("營養均衡的幼兒餐點", "A balanced toddler meal"),
            macros: { protein: "10g", carbs: "25g", fat: "8g" }
          };
        }
        
        setRecipeResult({
          name: data.title || tr("幼兒食譜", "Toddler recipe"),
          age: uiText.ageFallback,
          time: data.time || tr("20 分鐘", "20 mins"),
          nutrition: nutritionData,
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
          steps: Array.isArray(data.steps) ? data.steps : [],
          searchKeywords: data.searchKeywords || data.title || "",
        });
        setRecipesData(null);
      }

      setIsLoading(false);
      setShowResult(true);
    } catch (error) {
      console.error(tr("生成食譜失敗:", "Generate recipe failed:"), error);
      const errorMessage = error instanceof Error ? error.message : tr("未知錯誤", "Unknown error");
      alert(`${uiText.errGenerate}: ${errorMessage}`);
      
      setIsLoading(false);
      setShowResult(true);
      // 使用預設錯誤訊息
      setRecipeResult({
        name: uiText.errGenerate,
        age: uiText.retryLater,
        nutrition: {
          calories: 0,
          tags: [],
          benefit: uiText.retryLater,
          macros: {
            protein: "0g",
            carbs: "0g",
            fat: "0g"
          }
        },
        ingredients: [],
        steps: [uiText.netRetry],
        searchKeywords: "",
      });
    }
  };

  const handleMicClick = () => {
    console.log("語音功能開發中");
    setInputMethod("mic");
  };

  const handleCameraClick = () => {
    console.log("影像辨識開發中");
    setInputMethod("camera");
  };

  const handleKeyboardClick = () => {
    setInputMethod("keyboard");
  };


  // 紙張材質背景（使用 SVG 數據 URI 模擬）
  const paperTexture = "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23FFFBF0'/%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E";

  // 卡片材質背景（使用 SVG 數據 URI 模擬）
  const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";

  return (
    <div 
      className="min-h-screen bg-repeat bg-cover flex flex-col"
      style={{
        backgroundImage: `url("${paperTexture}")`,
        backgroundSize: '200px 200px',
      }}
    >
      {/* 頂部導航列 - 手繪風格 */}
      <nav className="sticky top-0 z-50 border-b-2 border-dashed border-moss-green/30 backdrop-blur-sm bg-paper-light/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* 左側：App 名稱與 Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-2 sm:p-2.5 bg-deep-teal rounded-xl sm:rounded-2xl flex-shrink-0">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-ink-dark tracking-wide font-sans truncate">
                  {t.hero.title}
                </h1>
                <p className="text-xs text-ink-light font-sans hidden sm:block">{t.hero.subtitle}</p>
              </div>
            </div>

            {/* 右側：日曆連結與語言切換選單 */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all"
                style={{
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                }}
              >
                <SettingsIcon className="w-4 h-4 text-ink-dark" />
                <span className="text-xs sm:text-sm font-medium text-ink-dark tracking-wide hidden sm:inline">
                  {t.buttons.settings || tr("設定", "Settings")}
                </span>
              </button>
              <button
                onClick={() => router.push('/calendar')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all"
                style={{
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                }}
              >
                <Calendar className="w-4 h-4 text-ink-dark" />
                <span className="text-xs sm:text-sm font-medium text-ink-dark tracking-wide hidden sm:inline">
                  {uiText.diary}
                </span>
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容區 */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Hero Section */}
        <HeroSection />

        {/* 用戶資訊顯示 - 移到 Hero Section 之後 */}
        {userProfile && !userProfile.guest && userProfile.nickname && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg sm:text-xl font-medium text-ink-dark tracking-wide font-sans">
                {t.greeting.replace("[Name]", userProfile.nickname || "")}
              </p>
            </div>
          </div>
        )}

        {/* 多寶寶切換 */}
        {babies.length > 0 && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <div className="rounded-2xl border-2 border-dashed border-moss-green/30 p-4 bg-white shadow-sm shadow-moss-green/10"
              style={{ backgroundImage: `url("${cardTexture}")`, backgroundSize: 'cover' }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-base font-semibold text-ink-dark">
                  {tr("選擇用餐的寶寶", "Pick babies for this meal")}
                </div>
                <button
                  onClick={() => router.push("/settings")}
                  className="text-sm text-deep-teal underline"
                >
                  {tr("新增寶寶", "Add baby")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {babies.map((b) => {
                  const active = selectedBabyIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleBaby(b.id, b.name)}
                      className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        active
                          ? "bg-deep-teal text-white border-deep-teal"
                          : "bg-white text-ink-dark border-dashed border-moss-green/30 hover:border-deep-teal"
                      }`}
                      style={!active ? { backgroundImage: `url("${cardTexture}")`, backgroundSize: 'cover' } : {}}
                    >
                      {b.name} {b.months_old ? `(${b.months_old}m)` : ""}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ink-light mt-2">
                {tr("選中寶寶數量會放大份量（食材克數乘上選中數）", "Selected babies will scale ingredients (x count)")}
              </p>
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 模式選擇 Tabs - 卡片紙風格 */}
        <div 
          className="mb-8 p-4 sm:p-5 rounded-[2rem] border-2 border-dashed border-stone-400/50 shadow-lg shadow-stone-300/50"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {modes.map((mode, index) => (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  setShowResult(false);
                }}
                className={`px-4 py-4 sm:px-5 sm:py-5 rounded-2xl transition-all text-left border-2 ${
                  selectedMode === mode.id
                    ? "bg-mustard-yellow text-ink-dark border-rust-orange shadow-md"
                    : "border-moss-green/30 hover:border-mustard-yellow"
                }`}
                style={selectedMode !== mode.id ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
              >
                <div className="font-bold text-base sm:text-lg mb-1 tracking-wide text-ink-dark font-sans">
                  {mode.title}
                </div>
                <div
                  className={`text-xs sm:text-sm ${
                    selectedMode === mode.id ? "text-white/90" : "text-ink-light"
                  }`}
                >
                  {mode.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 智慧輸入區卡片 - 剪貼簿風格 */}
        <div 
          className="p-6 sm:p-8 rounded-[2rem] border-2 border-dashed border-stone-400/50 mb-8 shadow-lg shadow-stone-300/50"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={currentMode.placeholder}
              className="w-full h-40 sm:h-48 p-5 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none resize-none text-ink-dark placeholder-ink-light/50 transition-all tracking-wide font-sans"
              style={{ 
                backgroundImage: `url("${cardTexture}")`,
                backgroundSize: 'cover',
              }}
            />

            {/* 輸入方式工具列 */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={handleKeyboardClick}
                className={`p-2.5 rounded-xl transition-all border-2 ${
                  inputMethod === "keyboard"
                    ? "bg-deep-teal text-white border-moss-green"
                    : "border-dashed border-moss-green/30 hover:border-deep-teal"
                }`}
                style={inputMethod !== "keyboard" ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
                title={tr("鍵盤輸入", "Keyboard")}
              >
                <Keyboard className="w-4 h-4" />
              </button>
              <button
                onClick={handleMicClick}
                className={`p-2.5 rounded-xl transition-all border-2 ${
                  inputMethod === "mic"
                    ? "bg-deep-teal text-white border-moss-green"
                    : "border-dashed border-moss-green/30 hover:border-deep-teal"
                }`}
                style={inputMethod !== "mic" ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
                title={tr("語音輸入", "Voice")}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleCameraClick}
                className={`p-2.5 rounded-xl transition-all border-2 ${
                  inputMethod === "camera"
                    ? "bg-deep-teal text-white border-moss-green"
                    : "border-dashed border-moss-green/30 hover:border-deep-teal"
                }`}
                style={inputMethod !== "camera" ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
                title={tr("影像辨識", "Camera")}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 其他選項：烹飪工具 */}
          <div className="mt-6">
            <label className="block text-base font-semibold text-ink-dark mb-3 tracking-wide">
              {tr("烹飪工具", "Cooking tool")} <span className="text-ink-light text-sm font-normal">({tr("選填", "Optional")})</span>
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none text-ink-dark transition-all tracking-wide font-sans"
              style={{ 
                backgroundImage: `url("${cardTexture}")`,
                backgroundSize: 'cover',
              }}
            >
              {cookingTools.map((tool) => (
                <option key={tool.value} value={tool.value}>
                  {tool.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 執行按鈕 - 蠟筆塗鴉風格 */}
        <button
          onClick={handleGenerateRecipe}
          disabled={isLoading}
          className="w-full py-5 sm:py-6 text-white rounded-[2rem] font-bold text-lg sm:text-xl border-4 border-dashed border-orange-300 hover:scale-105 active:scale-100 transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mb-8 tracking-wide shadow-lg shadow-stone-300/50 font-sans"
          style={{ 
            backgroundColor: 'var(--color-deep-teal)',
            borderRadius: '1.5rem 0.8rem 1.5rem 0.8rem', // 不規則圓角
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{uiText.cookingNow}</span>
            </>
          ) : (
            <>
              <span className="text-2xl">✨</span>
              <span>{uiText.cookMagic}</span>
            </>
          )}
        </button>

        {/* 結果顯示區 - 手寫筆記風格 */}
        {showResult && recipeResult && (
          <div 
            className="p-6 sm:p-8 rounded-[2rem] border-2 border-dashed border-moss-green/30 animate-in fade-in slide-in-from-bottom-4 shadow-lg shadow-moss-green/20"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            {/* 風格選擇器（如果有多道食譜） */}
            {recipesData && recipesData.recipes.length > 1 && (
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pb-2">
                  {recipesData.recipes.map((recipe, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedRecipeIndex(idx);
                        const selectedRecipe = recipesData.recipes[idx];
                        const ingredientsArray = Array.isArray(selectedRecipe.ingredients)
                          ? selectedRecipe.ingredients.map((ing: any) => formatIngredientEntry(ing))
                          : [];
                        setRecipeResult({
                          name: selectedRecipe.title,
                          age: selectedRecipe.serving_info || uiText.ageFallback,
                          time: selectedRecipe.time || tr("20 分鐘", "20 mins"),
                          nutrition: selectedRecipe.nutrition,
                          ingredients: ingredientsArray,
                          steps: selectedRecipe.steps || [],
                          searchKeywords: selectedRecipe.searchKeywords || selectedRecipe.title || "",
                        });
                      }}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all tracking-wide whitespace-nowrap ${
                        selectedRecipeIndex === idx
                          ? 'bg-deep-teal text-white border-2 border-deep-teal'
                          : 'bg-white text-ink-dark border-2 border-dashed border-moss-green/30 hover:border-deep-teal'
                      }`}
                      style={selectedRecipeIndex !== idx ? {
                        backgroundImage: `url("${cardTexture}")`,
                        backgroundSize: 'cover',
                      } : {}}
                    >
                      {recipe.style} {recipe.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 菜名 + Google 圖片搜尋 */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                {recipesData && recipesData.recipes[selectedRecipeIndex] && (
                  <div className="mb-2">
                    <span className="px-3 py-1 bg-mustard-yellow/30 text-moss-green rounded-full text-sm font-semibold">
                      {recipesData.recipes[selectedRecipeIndex].style}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl sm:text-3xl font-bold text-ink-dark tracking-wide font-sans">
                  {recipeResult.name}
                </h3>
                {recipesData && recipesData.recipes[selectedRecipeIndex]?.serving_info && (
                  <p className="text-sm text-ink-light mt-1">
                    {recipesData.recipes[selectedRecipeIndex].serving_info}
                  </p>
                )}
              </div>
              {recipeResult.searchKeywords && (
                <a
                  href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(recipeResult.searchKeywords || uiText.defaultSearch)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-300/50 hover:scale-105 active:scale-100 border-2 border-blue-700 tracking-wide flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm">{uiText.imageBtn}</span>
                </a>
              )}
            </div>

            {/* 準備時間 */}
            {recipeResult.time && (
              <div className="mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-ink-dark" />
                <span className="text-lg text-ink-dark font-semibold tracking-wide font-sans">
                  ⏱️ {recipeResult.time}
                </span>
              </div>
            )}


            {/* 食材清單 */}
            <div className="mb-8">
              <h4 className="text-xl font-bold text-ink-dark mb-4 tracking-wide font-sans">
                {uiText.ingredients}
              </h4>
              <ul className="space-y-3 pl-2">
                {recipeResult.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-ink-dark text-base tracking-wide">
                    <div className="w-2 h-2 bg-deep-teal rounded-full border border-moss-green" />
                    <span className="font-sans">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 料理步驟 */}
            <div>
              <h4 className="text-xl font-bold text-ink-dark mb-4 tracking-wide font-sans">
                {uiText.steps}
              </h4>
              <ol className="space-y-4 pl-2">
                {recipeResult.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-deep-teal text-white rounded-full flex items-center justify-center font-bold text-base border-2 border-moss-green">
                      {idx + 1}
                    </div>
                    <p className="text-ink-dark leading-relaxed pt-1 text-base tracking-wide font-sans">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* 營養資訊卡片 */}
            {typeof recipeResult.nutrition === 'object' && recipeResult.nutrition !== null && 'calories' in recipeResult.nutrition && (
              <div 
                className="mt-10 mb-8 p-6 rounded-2xl border-2 border-dashed border-moss-green/30 shadow-lg shadow-moss-green/20"
                style={{
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                }}
              >
                <h4 className="text-xl font-bold text-ink-dark mb-4 tracking-wide font-sans">
                  {uiText.nutrition}
                </h4>
                
                <div className="space-y-4">
                  {/* 熱量 */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <div className="text-sm text-ink-light">{tr("熱量", "Calories")}</div>
                      <div className="text-lg font-bold text-ink-dark font-sans">
                        {recipeResult.nutrition.calories} kcal
                      </div>
                    </div>
                  </div>

                  {/* 營養標籤 */}
                  {recipeResult.nutrition.tags && recipeResult.nutrition.tags.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏷️</span>
                      <div className="flex-1">
                        <div className="text-sm text-ink-light mb-2">{uiText.nutritionTags}</div>
                        <div className="flex flex-wrap gap-2">
                          {recipeResult.nutrition.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-sage-green/20 text-moss-green rounded-full text-sm font-semibold border-2 border-sage-green/30 tracking-wide"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 營養師小語 */}
                  {recipeResult.nutrition.benefit && (
                    <div className="flex items-start gap-3 pt-2 border-t-2 border-dashed border-moss-green/30">
                      <span className="text-2xl">💡</span>
                      <div className="flex-1">
                        <div className="text-sm text-ink-light mb-1">{uiText.tip}</div>
                        <div className="text-base text-ink-dark leading-relaxed font-sans">
                          {recipeResult.nutrition.benefit}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 微量營養素 */}
                  {recipeResult.nutrition.micronutrients && (
                    <div className="flex items-start gap-3 pt-2 border-t-2 border-dashed border-moss-green/30">
                      <span className="text-2xl">🔬</span>
                      <div className="flex-1">
                        <div className="text-sm text-ink-light mb-2">{uiText.micronutrients}</div>
                        <div className="flex flex-wrap gap-3 text-xs text-ink-light font-sans">
                          {recipeResult.nutrition.micronutrients.calcium && (
                            <span>{t.nutrients.calcium}：{recipeResult.nutrition.micronutrients.calcium}</span>
                          )}
                          {recipeResult.nutrition.micronutrients.iron && (
                            <span>{t.nutrients.iron}：{recipeResult.nutrition.micronutrients.iron}</span>
                          )}
                          {recipeResult.nutrition.micronutrients.vitamin_c && (
                            <span>{t.nutrients.vitamin_c}：{recipeResult.nutrition.micronutrients.vitamin_c}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 同場加映：大人吃什麼？ */}
            {recipesData && recipesData.recipes[selectedRecipeIndex]?.adults_menu && (
              <div className="mt-10 mb-8">
                <h4 className="text-xl font-bold text-ink-dark mb-6 tracking-wide font-sans flex items-center gap-2">
                  <span className="text-2xl">👩‍🍳</span>
                  {uiText.adults}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: 平行料理 */}
                  {recipesData.recipes[selectedRecipeIndex].adults_menu.parallel && (
                    <div 
                      className="p-5 rounded-2xl border-2 border-dashed border-moss-green/30 bg-paper-warm shadow-lg shadow-moss-green/20"
                      style={{
                        backgroundImage: `url("${cardTexture}")`,
                        backgroundSize: 'cover',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🌶️</span>
                        <h5 className="text-lg font-bold text-ink-dark tracking-wide font-sans">
                          {recipesData.recipes[selectedRecipeIndex].adults_menu.parallel.title}
                        </h5>
                      </div>
                      <p className="text-sm text-ink-light mb-4 leading-relaxed font-sans">
                        {recipesData.recipes[selectedRecipeIndex].adults_menu.parallel.desc}
                      </p>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-ink-dark mb-2">{uiText.stepsLabel}</div>
                        {recipesData.recipes[selectedRecipeIndex].adults_menu.parallel.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2 text-sm text-ink-dark">
                            <span className="text-deep-teal font-bold">{idx + 1}.</span>
                            <span className="font-sans">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option 2: 美味加工 */}
                  {recipesData.recipes[selectedRecipeIndex].adults_menu.remix && (
                    <div 
                      className="p-5 rounded-2xl border-2 border-dashed border-moss-green/30 bg-paper-warm shadow-lg shadow-moss-green/20"
                      style={{
                        backgroundImage: `url("${cardTexture}")`,
                        backgroundSize: 'cover',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🍳</span>
                        <h5 className="text-lg font-bold text-ink-dark tracking-wide font-sans">
                          {recipesData.recipes[selectedRecipeIndex].adults_menu.remix.title}
                        </h5>
                      </div>
                      <p className="text-sm text-ink-light mb-4 leading-relaxed font-sans">
                        {recipesData.recipes[selectedRecipeIndex].adults_menu.remix.desc}
                      </p>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-ink-dark mb-2">{uiText.stepsLabel}</div>
                        {recipesData.recipes[selectedRecipeIndex].adults_menu.remix.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-2 text-sm text-ink-dark">
                            <span className="text-deep-teal font-bold">{idx + 1}.</span>
                            <span className="font-sans">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 功能按鈕區塊 - 2x2 Grid 佈局 */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-moss-green/30">
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                {/* 左上：收藏 */}
                <button
                  onClick={() => setIsCollectionModalOpen(true)}
                  className="flex items-center justify-center px-3 md:px-4 py-3 md:py-4 h-auto bg-sage-green hover:opacity-90 active:scale-95 text-white rounded-2xl font-semibold transition-all tracking-wide"
                >
                  <Heart className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                  <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">{t.buttons.save}</span>
                </button>

                {/* 右上：我煮了這個 */}
                <button
                  onClick={() => setIsCompleteMealModalOpen(true)}
                  className="flex items-center justify-center px-3 md:px-4 py-3 md:py-4 h-auto bg-sage-green hover:opacity-90 active:scale-95 text-white rounded-2xl font-semibold transition-all tracking-wide"
                >
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                  <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">{t.buttons.cooked}</span>
                </button>

                {/* 左下：YouTube */}
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(recipeResult.searchKeywords || recipeResult.name || uiText.defaultSearch)}`}
            target="_blank"
            rel="noopener noreferrer"
                  className="flex items-center justify-center px-3 md:px-4 py-3 md:py-4 h-auto bg-sage-green hover:opacity-90 active:scale-95 text-white rounded-2xl font-semibold transition-all tracking-wide"
                >
                  <Youtube className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                  <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">{t.buttons.youtube}</span>
                </a>

                {/* 右下：Google */}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(recipeResult.searchKeywords || recipeResult.name || uiText.defaultSearch)}`}
            target="_blank"
            rel="noopener noreferrer"
                  className="flex items-center justify-center px-3 md:px-4 py-3 md:py-4 h-auto bg-sage-green hover:opacity-90 active:scale-95 text-white rounded-2xl font-semibold transition-all tracking-wide"
          >
                  <Search className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                  <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">{t.buttons.google}</span>
          </a>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
      />

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t-2 border-dashed border-stone-400/50">
        <p className="text-center text-sm text-ink-light tracking-wide">
          {tr("寶寶食譜魔法師，以從容不迫的姿態將營養與美味優雅上菜", "Toddler Recipe Magician serves nutrition and flavor with calm elegance.")}
        </p>
      </footer>

      {/* Complete Meal Modal */}
      {recipeResult && (
        <CompleteMealModal
          isOpen={isCompleteMealModalOpen}
          onClose={() => setIsCompleteMealModalOpen(false)}
          recipeTitle={recipeResult.name}
          nutrition={recipeResult.nutrition}
          isManual={false}
        />
      )}

      {/* Collection Modal */}
      {recipeResult && (
        <CollectionModal
          isOpen={isCollectionModalOpen}
          onClose={() => setIsCollectionModalOpen(false)}
          recipeData={{
            title: recipeResult.name,
            ingredients: recipeResult.ingredients,
            steps: recipeResult.steps,
            time: recipeResult.time,
            nutrition: recipeResult.nutrition,
            searchKeywords: recipeResult.searchKeywords,
          }}
        />
      )}
    </div>
  );
}
