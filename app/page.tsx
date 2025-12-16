"use client";

import { useState } from "react";
import { Globe, Keyboard, Mic, Camera, ChefHat, Loader2, CheckCircle2, Youtube, Search } from "lucide-react";

type Mode = "strict" | "creative" | "shopping";

type Language = "zh-TW" | "en" | "ja" | "ko";

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<Mode>("strict");
  const [inputText, setInputText] = useState("");
  const [selectedTool, setSelectedTool] = useState("any");
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("zh-TW");
  const [inputMethod, setInputMethod] = useState<"keyboard" | "mic" | "camera">("keyboard");

  const modes = [
    {
      id: "strict" as Mode,
      title: "現在就要煮 ❤️‍🔥",
      subtitle: "只使用現有食材",
      placeholder: "現在桌上有什麼食材？例如：高麗菜、絞肉...",
    },
    {
      id: "creative" as Mode,
      title: "發揮創意 💭",
      subtitle: "彈性加入常見食材或佐料",
      placeholder: "冰箱剩什麼？例如：高麗菜、吻仔魚...",
    },
    {
      id: "shopping" as Mode,
      title: "採買靈感 🛒",
      subtitle: "輸入想吃的，規劃完整採買清單",
      placeholder: "想讓寶寶吃什麼口味？例如：南瓜濃湯...",
    },
  ];

  const languages: { code: Language; name: string }[] = [
    { code: "zh-TW", name: "繁體中文" },
    { code: "en", name: "English" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
  ];

  const cookingTools = [
    { value: "any", label: "不限工具" },
    { value: "rice-cooker", label: "電鍋 (最推薦)" },
    { value: "pan", label: "平底鍋" },
    { value: "pot", label: "燉鍋" },
    { value: "oven", label: "烤箱" },
  ];

  const currentMode = modes.find((m) => m.id === selectedMode)!;

  const [recipeResult, setRecipeResult] = useState<{
    name: string;
    age: string;
    nutrition: string[];
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
        }),
      });

      console.log('API 回應狀態:', response.status, response.ok);

      // 檢查回應狀態
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `API 錯誤: ${response.status}` }));
        const errorMessage = errorData.error || `API 錯誤: ${response.status}`;
        console.error('API 錯誤:', errorMessage);
        alert(`API 錯誤: ${errorMessage}`);
        
        // 即使錯誤也顯示結果（如果有部分資料）
        setRecipeResult({
          name: errorData.title || "無法生成食譜",
          age: "請重新輸入",
          nutrition: [errorData.nutrition || "發生錯誤"],
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

      if (data.error) {
        // 處理錯誤情況（例如：無效食材）
        console.log('API 回傳錯誤:', data.error);
        setRecipeResult({
          name: data.title || "無法生成食譜",
          age: "請重新輸入",
          nutrition: [data.nutrition || "請輸入可食用的食材"],
          ingredients: data.ingredients || [],
          steps: data.steps || [],
          searchKeywords: data.searchKeywords || "",
        });
      } else {
        // 成功生成食譜
        console.log('成功生成食譜:', data.title);
        setRecipeResult({
          name: data.title,
          age: "適合幼兒",
          nutrition: data.nutrition ? [data.nutrition] : ["營養均衡"],
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
          steps: Array.isArray(data.steps) ? data.steps : [],
          searchKeywords: data.searchKeywords || data.title || "",
        });
      }

      setIsLoading(false);
      setShowResult(true);
    } catch (error) {
      console.error("生成食譜失敗:", error);
      const errorMessage = error instanceof Error ? error.message : "未知錯誤";
      alert(`生成食譜失敗: ${errorMessage}`);
      
      setIsLoading(false);
      setShowResult(true);
      // 使用預設錯誤訊息
      setRecipeResult({
        name: "生成食譜失敗",
        age: "請稍後再試",
        nutrition: ["請稍後再試"],
        ingredients: [],
        steps: ["請檢查網路連線後重試"],
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
      <nav className="sticky top-0 z-50 border-b-2 border-dashed border-stone-400/50 backdrop-blur-sm bg-[#FFFBF0]/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* 左側：App 名稱與 Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#C97D60] rounded-2xl">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#5C4B41] tracking-wide font-sans">
                  幼兒食譜魔法師
                </h1>
                <p className="text-xs text-[#5C4B41]/70 font-sans">Toddler Recipe Magic</p>
              </div>
            </div>

            {/* 右側：語言切換選單 */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-stone-400/50 hover:border-[#C97D60] transition-all"
                style={{
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                }}
              >
                <Globe className="w-4 h-4 text-[#5C4B41]" />
                <span className="text-sm font-medium text-[#5C4B41] tracking-wide">
                  {languages.find((l) => l.code === selectedLanguage)?.name}
                </span>
              </button>

              {/* 下拉選單 */}
              {isLanguageMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsLanguageMenuOpen(false)}
                  />
                  <div 
                    className="absolute right-0 mt-2 w-44 rounded-2xl border-2 border-dashed border-stone-400/50 z-20 shadow-lg shadow-stone-300/50"
                    style={{
                      backgroundImage: `url("${cardTexture}")`,
                      backgroundSize: 'cover',
                    }}
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLanguage(lang.code);
                          setIsLanguageMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm tracking-wide transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                          selectedLanguage === lang.code
                            ? "bg-[#F4E4BC]/50 text-[#5C4B41] font-semibold"
                            : "text-[#5C4B41] hover:bg-stone-50/50"
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容區 */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[#5C4B41] tracking-wide font-sans">
            👶 幼兒食譜魔法師
          </h2>
          <p className="text-xl sm:text-2xl text-[#5C4B41] font-medium tracking-wide font-sans">
            要幫寶寶上什麼菜? 化焦慮為信手捻來!
          </p>
        </div>

        {/* 模式選擇 Tabs - 卡片紙風格 */}
        <div 
          className="mb-8 p-4 sm:p-5 rounded-[2rem] border-2 border-dashed border-stone-400/50 shadow-lg shadow-stone-300/50"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          <div className="grid grid-cols-3 gap-3">
            {modes.map((mode, index) => (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  setShowResult(false);
                }}
                className={`px-4 py-4 sm:px-5 sm:py-5 rounded-2xl transition-all text-left border-2 ${
                  selectedMode === mode.id
                    ? "bg-[#C97D60] text-white border-[#8B4513] shadow-md"
                    : "border-stone-400/50 hover:border-[#C97D60]"
                }`}
                style={selectedMode !== mode.id ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
              >
                <div className="font-bold text-base sm:text-lg mb-1 tracking-wide text-[#5C4B41] font-sans">
                  {mode.title}
                </div>
                <div
                  className={`text-xs sm:text-sm ${
                    selectedMode === mode.id ? "text-white/90" : "text-[#5C4B41]/70"
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
              className="w-full h-40 sm:h-48 p-5 rounded-2xl border-2 border-dashed border-stone-400/50 focus:border-[#C97D60] outline-none resize-none text-[#5C4B41] placeholder-stone-400/70 transition-all tracking-wide font-sans"
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
                    ? "bg-[#C97D60] text-white border-[#8B4513]"
                    : "border-dashed border-stone-400/50 hover:border-[#C97D60]"
                }`}
                style={inputMethod !== "keyboard" ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
                title="鍵盤輸入"
              >
                <Keyboard className="w-4 h-4" />
              </button>
              <button
                onClick={handleMicClick}
                className={`p-2.5 rounded-xl transition-all border-2 ${
                  inputMethod === "mic"
                    ? "bg-[#C97D60] text-white border-[#8B4513]"
                    : "border-dashed border-stone-400/50 hover:border-[#C97D60]"
                }`}
                style={inputMethod !== "mic" ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
                title="語音輸入"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleCameraClick}
                className={`p-2.5 rounded-xl transition-all border-2 ${
                  inputMethod === "camera"
                    ? "bg-[#C97D60] text-white border-[#8B4513]"
                    : "border-dashed border-stone-400/50 hover:border-[#C97D60]"
                }`}
                style={inputMethod !== "camera" ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
                title="影像辨識"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 其他選項：烹飪工具 */}
          <div className="mt-6">
            <label className="block text-base font-semibold text-[#5C4B41] mb-3 tracking-wide">
              烹飪工具 <span className="text-[#5C4B41]/60 text-sm font-normal">(選填)</span>
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-stone-400/50 focus:border-[#C97D60] outline-none text-[#5C4B41] transition-all tracking-wide font-sans"
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
            backgroundColor: '#C97D60',
            borderRadius: '1.5rem 0.8rem 1.5rem 0.8rem', // 不規則圓角
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>魔法進行中...</span>
            </>
          ) : (
            <>
              <span className="text-2xl">✨</span>
              <span>變出魔法食譜</span>
            </>
          )}
        </button>

        {/* 結果顯示區 - 手寫筆記風格 */}
        {showResult && recipeResult && (
          <div 
            className="p-6 sm:p-8 rounded-[2rem] border-2 border-dashed border-stone-400/50 animate-in fade-in slide-in-from-bottom-4 shadow-lg shadow-stone-300/50"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-[#9CAF88] rounded-2xl border-2 border-[#7A9471]">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold text-[#5C4B41] mb-3 tracking-wide font-sans">
                  {recipeResult.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 bg-[#F4E4BC] text-[#5C4B41] rounded-full text-sm font-semibold border-2 border-dashed border-[#E6D4A8] tracking-wide">
                    {recipeResult.age}
                  </span>
                  {recipeResult.nutrition.map((nutri, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-1.5 bg-[#E8F5E9] text-[#5C4B41] rounded-full text-sm font-semibold border-2 border-dashed border-[#C8E6C9] tracking-wide"
                    >
                      {nutri}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 食材清單 */}
            <div className="mb-8">
              <h4 className="text-xl font-bold text-[#5C4B41] mb-4 tracking-wide font-sans">
                食材清單
              </h4>
              <ul className="space-y-3 pl-2">
                {recipeResult.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[#5C4B41] text-base tracking-wide">
                    <div className="w-2 h-2 bg-[#C97D60] rounded-full border border-[#8B4513]" />
                    <span className="font-sans">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 料理步驟 */}
            <div>
              <h4 className="text-xl font-bold text-[#5C4B41] mb-4 tracking-wide font-sans">
                料理步驟
              </h4>
              <ol className="space-y-4 pl-2">
                {recipeResult.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#C97D60] text-white rounded-full flex items-center justify-center font-bold text-base border-2 border-[#8B4513]">
                      {idx + 1}
                    </div>
                    <p className="text-[#5C4B41] leading-relaxed pt-1 text-base tracking-wide font-sans">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* 外部連結按鈕 */}
            {recipeResult.searchKeywords && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-stone-400/50">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* YouTube 按鈕 */}
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(recipeResult.searchKeywords)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-red-300/50 hover:scale-105 active:scale-100 border-2 border-red-700 tracking-wide"
                  >
                    <Youtube className="w-5 h-5" />
                    <span>📺 看影片教學</span>
                  </a>

                  {/* Google 搜尋按鈕 */}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(recipeResult.searchKeywords)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-300/50 hover:scale-105 active:scale-100 border-2 border-blue-700 tracking-wide"
                  >
                    <Search className="w-5 h-5" />
                    <span>🔍 Google 更多做法</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t-2 border-dashed border-stone-400/50">
        <p className="text-center text-sm text-[#5C4B41]/70 tracking-wide">
          © 2024 幼兒食譜魔法師 - 讓每一餐都充滿愛與營養
        </p>
      </footer>
    </div>
  );
}
