"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Keyboard, Mic, Camera, ChefHat, Loader2, CheckCircle, Youtube, Search, Heart, Clock, RefreshCw } from "lucide-react";
import CollectionModal from "../components/CollectionModal";
import CompleteMealModal from "../components/CompleteMealModal";
import LoadingScreen from "../components/LoadingScreen";
import { useLanguage } from "../context/LanguageContext";

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

interface RecipeItem {
  style: "中式" | "西式" | "日式";
  title: string;
  ageLabel?: string; // 適用年齡標籤，如 "6m+", "12m+"
  ingredients: Array<{ name: string; amount: string }> | string[];
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

export default function RecipesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const tr = (zh: string, en: string) => (language === "en" ? en : zh);
  
  const [recipesData, setRecipesData] = useState<{ recipes: RecipeItem[] } | null>(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleteMealModalOpen, setIsCompleteMealModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedMode, setSelectedMode] = useState<"strict" | "creative" | "shopping">("strict");
  const [selectedTool, setSelectedTool] = useState("any");
  const [babyAge, setBabyAge] = useState<number | undefined>(undefined);

  // 從 URL 參數或 localStorage 讀取資料
  useEffect(() => {
    const recipesParam = searchParams.get("recipes");
    if (recipesParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(recipesParam));
        setRecipesData(parsed);
      } catch (e) {
        console.error("解析食譜資料失敗:", e);
      }
    } else {
      // 從 localStorage 讀取
      const stored = localStorage.getItem("lastRecipesData");
      if (stored) {
        try {
          setRecipesData(JSON.parse(stored));
        } catch (e) {
          console.error("讀取食譜資料失敗:", e);
        }
      }
    }
    
    // 讀取其他參數
    const storedInput = localStorage.getItem("lastRecipeInput");
    const storedMode = localStorage.getItem("lastRecipeMode");
    const storedTool = localStorage.getItem("lastRecipeTool");
    const storedAge = localStorage.getItem("lastRecipeAge");
    
    if (storedInput) setInputText(storedInput);
    if (storedMode) setSelectedMode(storedMode as any);
    if (storedTool) setSelectedTool(storedTool);
    if (storedAge) setBabyAge(parseInt(storedAge));
  }, [searchParams]);

  const formatIngredientEntry = (ing: any, babyCount: number = 1) => {
    if (typeof ing === "string") {
      return babyCount > 1 ? `${ing} x${babyCount}` : ing;
    }
    if (!ing) return "";
    const amount = ing.amount || "";
    return `${ing.name || ""}${amount ? ` ${amount}` : ""}`.trim();
  };

  const handleRegenerate = async () => {
    if (!inputText.trim()) {
      alert(tr("請輸入食材", "Please enter ingredients"));
      return;
    }

    setIsLoading(true);
    try {
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
          age: babyAge,
        }),
      });

      if (!response.ok) {
        throw new Error(tr("生成食譜失敗", "Failed to generate recipes"));
      }

      const data = await response.json();
      if (data.recipes && Array.isArray(data.recipes) && data.recipes.length > 0) {
        setRecipesData(data);
        setSelectedRecipeIndex(0);
        // 儲存到 localStorage
        localStorage.setItem("lastRecipesData", JSON.stringify(data));
        localStorage.setItem("lastRecipeInput", inputText);
        localStorage.setItem("lastRecipeMode", selectedMode);
        localStorage.setItem("lastRecipeTool", selectedTool);
        if (babyAge !== undefined) {
          localStorage.setItem("lastRecipeAge", babyAge.toString());
        }
      }
    } catch (error) {
      console.error(tr("生成食譜失敗:", "Generate recipe failed:"), error);
      alert(tr("生成食譜失敗，請重試", "Failed to generate recipes, please try again"));
    } finally {
      setIsLoading(false);
    }
  };

  const currentRecipe = recipesData?.recipes[selectedRecipeIndex];
  const selectedBabyCount = 1; // 可以從 context 讀取實際選中的寶寶數量

  const uiText = {
    diary: tr("飲食日記", "Diary"),
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
    regenerate: tr("換一組食譜", "Regenerate"),
    back: tr("返回", "Back"),
  };

  const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";
  const paperTexture = "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23FFFBF0'/%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E";

  if (!recipesData || !currentRecipe) {
    return (
      <div 
        className="min-h-screen bg-repeat bg-cover flex items-center justify-center"
        style={{
          backgroundImage: `url("${paperTexture}")`,
          backgroundSize: '200px 200px',
        }}
      >
        <div className="text-center">
          <p className="text-lg text-ink-dark mb-4">{tr("沒有食譜資料", "No recipe data")}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-deep-teal text-white rounded-2xl font-semibold"
          >
            {uiText.back}
          </button>
        </div>
      </div>
    );
  }

  const ingredientsArray = Array.isArray(currentRecipe.ingredients)
    ? currentRecipe.ingredients.map((ing: any) => formatIngredientEntry(ing, selectedBabyCount))
    : [];

  return (
    <div 
      className="min-h-screen bg-repeat bg-cover flex flex-col"
      style={{
        backgroundImage: `url("${paperTexture}")`,
        backgroundSize: '200px 200px',
      }}
    >
      {/* 頂部導航 */}
      <nav className="sticky top-0 z-50 border-b-2 border-stone-400 backdrop-blur-sm bg-paper-light/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-ink-dark font-semibold hover:bg-stone-100 rounded-xl transition-all"
            >
              ← {uiText.back}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-deep-teal text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{uiText.regenerate}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* 風格選擇器 */}
        {recipesData.recipes.length > 1 && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pb-2 overflow-x-auto">
              {recipesData.recipes.map((recipe, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedRecipeIndex(idx)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all tracking-wide whitespace-nowrap ${
                    selectedRecipeIndex === idx
                      ? 'bg-deep-teal text-white border-2 border-deep-teal'
                      : 'bg-white text-ink-dark border-2 border-stone-400 hover:border-deep-teal'
                  }`}
                  style={selectedRecipeIndex !== idx ? {
                    backgroundImage: `url("${cardTexture}")`,
                    backgroundSize: 'cover',
                  } : {}}
                >
                  {recipe.style} {recipe.title}
                  {recipe.ageLabel && (
                    <span className="ml-2 text-xs opacity-90">({recipe.ageLabel})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 食譜卡片 */}
        <div 
          className="p-6 sm:p-8 rounded-[2rem] border-2 border-stone-400 shadow-lg"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          {/* 標題與適用年齡 */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="px-3 py-1 bg-mustard-yellow/30 text-moss-green rounded-full text-sm font-semibold">
                  {currentRecipe.style}
                </span>
                {currentRecipe.ageLabel && (
                  <span className="px-3 py-1 bg-deep-teal/20 text-deep-teal rounded-full text-sm font-semibold">
                    {currentRecipe.ageLabel}
                  </span>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-ink-dark tracking-wide font-sans">
                {currentRecipe.title}
              </h3>
              {currentRecipe.serving_info && (
                <p className="text-sm text-ink-light mt-1">
                  {currentRecipe.serving_info}
                </p>
              )}
            </div>
            {currentRecipe.searchKeywords && (
              <a
                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentRecipe.searchKeywords || uiText.defaultSearch)}`}
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
          {currentRecipe.time && (
            <div className="mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-ink-dark" />
              <span className="text-lg text-ink-dark font-semibold tracking-wide font-sans">
                ⏱️ {currentRecipe.time}
              </span>
            </div>
          )}

          {/* 食材清單 */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-ink-dark mb-4 tracking-wide font-sans">
              {uiText.ingredients}
            </h4>
            <ul className="space-y-3 pl-2">
              {ingredientsArray.map((ingredient, idx) => (
                <li key={idx} className="flex items-center gap-3 text-ink-dark text-base tracking-wide">
                  <div className="w-2 h-2 bg-deep-teal rounded-full border border-moss-green" />
                  <span className="font-sans">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 料理步驟 */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-ink-dark mb-4 tracking-wide font-sans">
              {uiText.steps}
            </h4>
            <ol className="space-y-4 pl-2">
              {currentRecipe.steps.map((step, idx) => (
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

          {/* 營養資訊 */}
          {currentRecipe.nutrition && (
            <div 
              className="mt-10 mb-8 p-6 rounded-2xl border-2 border-stone-400 shadow-lg"
              style={{
                backgroundImage: `url("${cardTexture}")`,
                backgroundSize: 'cover',
              }}
            >
              <h4 className="text-xl font-bold text-ink-dark mb-4 tracking-wide font-sans">
                {uiText.nutrition}
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="text-sm text-ink-light">{tr("熱量", "Calories")}</div>
                    <div className="text-lg font-bold text-ink-dark font-sans">
                      {currentRecipe.nutrition.calories} kcal
                    </div>
                  </div>
                </div>

                {currentRecipe.nutrition.tags && currentRecipe.nutrition.tags.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏷️</span>
                    <div className="flex-1">
                      <div className="text-sm text-ink-light mb-2">{uiText.nutritionTags}</div>
                      <div className="flex flex-wrap gap-2">
                        {currentRecipe.nutrition.tags.map((tag, idx) => (
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

                {currentRecipe.nutrition.benefit && (
                  <div className="flex items-start gap-3 pt-2 border-t-2 border-stone-400">
                    <span className="text-2xl">💡</span>
                    <div className="flex-1">
                      <div className="text-sm text-ink-light mb-1">{uiText.tip}</div>
                      <div className="text-base text-ink-dark leading-relaxed font-sans">
                        {currentRecipe.nutrition.benefit}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 功能按鈕 */}
          <div className="mt-8 pt-6 border-t-2 border-stone-400">
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <button
                onClick={() => setIsCollectionModalOpen(true)}
                className="flex items-center justify-center px-3 md:px-4 py-3 md:py-4 h-auto bg-sage-green hover:opacity-90 active:scale-95 text-white rounded-2xl font-semibold transition-all tracking-wide"
              >
                <Heart className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">{t.buttons.save}</span>
              </button>

              <button
                onClick={() => setIsCompleteMealModalOpen(true)}
                className="flex items-center justify-center px-3 md:px-4 py-3 md:py-4 h-auto bg-sage-green hover:opacity-90 active:scale-95 text-white rounded-2xl font-semibold transition-all tracking-wide"
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">{t.buttons.cooked}</span>
              </button>

              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentRecipe.searchKeywords || currentRecipe.title || uiText.defaultSearch)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-3 md:px-4 py-3 md:py-4 h-auto bg-sage-green hover:opacity-90 active:scale-95 text-white rounded-2xl font-semibold transition-all tracking-wide"
              >
                <Youtube className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">{t.buttons.youtube}</span>
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(currentRecipe.searchKeywords || currentRecipe.title || uiText.defaultSearch)}`}
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
      </main>

      {/* Loading Screen */}
      {isLoading && <LoadingScreen language={language} />}

      {/* Modals */}
      {currentRecipe && (
        <>
          <CompleteMealModal
            isOpen={isCompleteMealModalOpen}
            onClose={() => setIsCompleteMealModalOpen(false)}
            recipeTitle={currentRecipe.title}
            nutrition={currentRecipe.nutrition}
            isManual={false}
          />
          <CollectionModal
            isOpen={isCollectionModalOpen}
            onClose={() => setIsCollectionModalOpen(false)}
            recipeData={{
              title: currentRecipe.title,
              ingredients: ingredientsArray,
              steps: currentRecipe.steps,
              time: currentRecipe.time,
              nutrition: currentRecipe.nutrition,
              searchKeywords: currentRecipe.searchKeywords,
            }}
          />
        </>
      )}
    </div>
  );
}

