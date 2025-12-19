"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowRight, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../context/LanguageContext";

interface FormData {
  email: string;
  nickname: string;
  birthday: string;
  allergies: string[];
  dietPreference: "omnivore" | "vegetarian" | "vegan";
  cookingTools: string[];
}

// 雙語內容
const onboardingContent = {
  zh: {
    welcome: {
      title: "歡迎來到\n幼兒食譜魔法師",
      subtitle: "讓我們為您的寶寶\n量身打造專屬食譜",
      createProfile: "建立寶寶檔案",
      guestMode: "以訪客試用",
    },
    steps: {
      step1: {
        title: "下一餐煮什麼？",
        body: "不刻意規劃，輸入冰箱食材，一鍵變出寶寶營養餐！",
      },
      step2: {
        title: "營養夠均衡嗎？",
        body: "自動分析每一餐的營養素，幫你把關寶寶的健康攝取。",
      },
      step3: {
        title: "寶寶叫什麼名字？",
        button: "魔法開始",
      },
    },
    profile: {
      title: "建立寶寶檔案",
      subtitle: "讓我們認識您的寶寶",
      email: "Email",
      emailPlaceholder: "you@example.com",
      emailNote: "我們重視您的隱私，您的 Email 僅用於同步寶寶資料與發送營養建議。",
      nickname: "寶寶暱稱",
      nicknamePlaceholder: "例如：小寶、妹妹",
      birthday: "生日",
      next: "下一步",
      requiredFields: "請先填寫 Email、寶寶暱稱與生日",
    },
    diet: {
      title: "飲食禁忌",
      subtitle: "讓我們知道寶寶的飲食限制",
      allergies: "過敏原",
      dietPreference: "飲食偏好",
      next: "下一步",
    },
    tools: {
      title: "廚房工具",
      subtitle: "選擇您常用的烹飪方式",
      complete: "完成設定，開始魔法！✨",
      requiredTools: "請至少選擇一項廚房工具",
    },
    allergies: {
      egg: "雞蛋",
      milk: "牛奶",
      nuts: "堅果",
      peanut: "花生",
      seafood: "海鮮",
      wheat: "小麥",
      soy: "大豆",
      none: "無",
    },
    dietOptions: {
      omnivore: "葷食",
      vegetarian: "蛋奶素",
      vegan: "全素",
    },
    toolsOptions: {
      "rice-cooker": "電鍋 (蒸)",
      pan: "平底鍋 (煎)",
      pot: "燉鍋 (煮)",
      oven: "烤箱 (烤)",
      blender: "果汁機 (打泥)",
    },
    success: "你太棒了！魔法師已經記住這一切了！",
    error: "請填寫 Email、寶寶暱稱與生日",
    errorDetail: "錯誤詳情：",
  },
  en: {
    welcome: {
      title: "Welcome to\nToddler Recipe Magician",
      subtitle: "Let's create personalized recipes\nfor your baby",
      createProfile: "Create Baby Profile",
      guestMode: "Try as Guest",
    },
    steps: {
      step1: {
        title: "What to Cook Next?",
        body: "Simply enter your fridge ingredients, and we'll magically create a nutritious baby meal!",
      },
      step2: {
        title: "Balanced Nutrition Intake?",
        body: "Automatically analyze nutrients to ensure a balanced diet for your baby.",
      },
      step3: {
        title: "What is your baby's name?",
        button: "Get the Magic Working",
      },
    },
    profile: {
      title: "Create Baby Profile",
      subtitle: "Let's get to know your baby",
      email: "Email",
      emailPlaceholder: "you@example.com",
      emailNote: "We value your privacy. Your email is only used to sync baby data and send nutrition tips.",
      nickname: "Baby's Nickname",
      nicknamePlaceholder: "e.g., Little One, Baby",
      birthday: "Birthday",
      next: "Next",
      requiredFields: "Please fill in Email, Baby's nickname, and Birthday",
    },
    diet: {
      title: "Dietary Restrictions",
      subtitle: "Let us know your baby's dietary limitations",
      allergies: "Allergies",
      dietPreference: "Diet Preference",
      next: "Next",
    },
    tools: {
      title: "Kitchen Tools",
      subtitle: "Select your commonly used cooking methods",
      complete: "Complete Setup, Start Magic! ✨",
      requiredTools: "Please select at least one kitchen tool",
    },
    allergies: {
      egg: "Egg",
      milk: "Milk",
      nuts: "Nuts",
      peanut: "Peanut",
      seafood: "Seafood",
      wheat: "Wheat",
      soy: "Soy",
      none: "None",
    },
    dietOptions: {
      omnivore: "Omnivore",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
    },
    toolsOptions: {
      "rice-cooker": "Rice Cooker (Steam)",
      pan: "Pan (Fry)",
      pot: "Pot (Boil)",
      oven: "Oven (Bake)",
      blender: "Blender (Puree)",
    },
    success: "You're awesome! The magician has remembered everything!",
    error: "Please fill in Email, Baby's nickname, and Birthday",
    errorDetail: "Error details:",
  },
};

const getAllergiesOptions = (lang: "zh" | "en") => {
  const content = onboardingContent[lang].allergies;
  return [
    content.egg,
    content.milk,
    content.nuts,
    content.peanut,
    content.seafood,
    content.wheat,
    content.soy,
    content.none,
  ];
};

const getDietOptions = (lang: "zh" | "en") => {
  const content = onboardingContent[lang];
  return [
    { value: "omnivore", label: content.dietOptions.omnivore, emoji: "🍖" },
    { value: "vegetarian", label: content.dietOptions.vegetarian, emoji: "🥚" },
    { value: "vegan", label: content.dietOptions.vegan, emoji: "🥬" },
  ];
};

const getCookingToolsOptions = (lang: "zh" | "en") => {
  const content = onboardingContent[lang].toolsOptions;
  return [
    { value: "rice-cooker", label: content["rice-cooker"], emoji: "🍚" },
    { value: "pan", label: content.pan, emoji: "🍳" },
    { value: "pot", label: content.pot, emoji: "🍲" },
    { value: "oven", label: content.oven, emoji: "🔥" },
    { value: "blender", label: content.blender, emoji: "🥤" },
  ];
};

// 紙張材質背景
const paperTexture = "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23FFFBF0'/%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E";

// 卡片材質背景
const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";

export default function OnboardingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const content = onboardingContent[language];
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    nickname: "",
    birthday: "",
    allergies: [],
    dietPreference: "omnivore",
    cookingTools: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const allergiesOptions = getAllergiesOptions(language);
  const dietOptions = getDietOptions(language);
  const cookingToolsOptions = getCookingToolsOptions(language);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEmail = localStorage.getItem("userEmail") || "";
    const storedUserId = localStorage.getItem("userId") || "";
    if (storedEmail) {
      setFormData((prev) => ({ ...prev, email: storedEmail }));
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const progress = (currentStep / 4) * 100;

  const handleNext = () => {
    // Step 1: 檢查 Email
    if (currentStep === 1 && !formData.email) {
      alert(language === "en" ? "Please enter your email" : "請輸入 Email");
      return;
    }
    // Step 2: 檢查生日（不再檢查 Email 和名字）
    if (currentStep === 2 && !formData.birthday) {
      alert(language === "en" ? "Please enter baby's birthday" : "請輸入寶寶生日");
      return;
    }
    // Step 2: 檢查年齡是否小於 4 個月
    if (currentStep === 2 && formData.birthday) {
      const monthsOld = getMonthsOld(formData.birthday);
      if (monthsOld !== null && monthsOld < 4) {
        const warningMsg = language === "en"
          ? "Your baby is too young. Please continue with more milk feeding!"
          : "你的孩子還太小了，再多喝點奶吧！";
        alert(warningMsg);
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleAllergyToggle = (allergy: string) => {
    const noneLabel = content.allergies.none;
    if (allergy === noneLabel) {
      setFormData({ ...formData, allergies: [] });
    } else {
      const newAllergies = formData.allergies.includes(allergy)
        ? formData.allergies.filter(a => a !== allergy)
        : [...formData.allergies.filter(a => a !== noneLabel), allergy];
      setFormData({ ...formData, allergies: newAllergies });
    }
  };

  const handleCookingToolToggle = (tool: string) => {
    const newTools = formData.cookingTools.includes(tool)
      ? formData.cookingTools.filter(t => t !== tool)
      : [...formData.cookingTools, tool];
    setFormData({ ...formData, cookingTools: newTools });
  };

  const getMonthsOld = (birthday: string) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const today = new Date();
    let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (today.getDate() < birth.getDate()) months -= 1;
    return Math.max(months, 0);
  };

  const getOrCreateUser = async (email: string) => {
    if (!supabase) return null;
    const { data, error, status } = await supabase
      .from("users")
      .upsert({ email }, { onConflict: "email" })
      .select("id")
      .single();
    if (error) {
      console.error("Supabase Error (users upsert):", error);
      throw error;
    }
    return data?.id as string;
  };

  const handleComplete = async () => {
    if (!formData.email || !formData.birthday) {
      alert(language === "en" ? "Please enter email and birthday" : "請填寫 Email 與生日");
      return;
    }
    setIsSaving(true);
    const monthsOld = getMonthsOld(formData.birthday);

    try {
      let newUserId = userId;
      if (supabase) {
        newUserId = await getOrCreateUser(formData.email);
        if (!newUserId) throw new Error("user 建立失敗");
        const { data: babyRows, error: babyErr } = await supabase
          .from("babies")
          .insert({
            user_id: newUserId,
            name: `Baby ${Date.now()}`, // 使用時間戳作為預設名字
            months_old: monthsOld,
          })
          .select();
        if (babyErr) throw babyErr;

        const savedBaby = babyRows?.[0];
        if (typeof window !== "undefined") {
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("userId", newUserId);
          localStorage.setItem(
            "babies",
            JSON.stringify([savedBaby || { id: Date.now(), name: `Baby ${Date.now()}`, months_old: monthsOld }])
          );
          localStorage.setItem("activeBabyIds", JSON.stringify([savedBaby?.id || 0]));
        }
      } else if (typeof window !== "undefined") {
        // 沒有 supabase client 也先寫本地
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem(
          "babies",
          JSON.stringify([{ id: Date.now(), name: `Baby ${Date.now()}`, months_old: monthsOld }])
        );
        localStorage.setItem("activeBabyIds", JSON.stringify([0]));
      }

      // 備份原本 userProfile 以相容舊流程
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          birthday: formData.birthday,
          allergies: formData.allergies,
          dietPreference: formData.dietPreference,
          cookingTools: formData.cookingTools,
          email: formData.email,
        })
      );

      alert(content.success);
      router.push('/');
    } catch (error) {
      console.error("Onboarding 儲存失敗:", error);
      alert(content.errorDetail + JSON.stringify(error));
    } finally {
      setIsSaving(false);
    }
  };

  // Screen 1: WELCOME 畫面 - 要求輸入 Email
  const renderWelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-8">
        <div className="p-6 bg-[#7A9471] rounded-3xl mb-6 inline-block">
          <ChefHat className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-[#5C4B41] mb-4 tracking-wide font-sans whitespace-pre-line">
          {content.welcome.title}
        </h1>
        <p className="text-lg text-[#5C4B41]/70 tracking-wide whitespace-pre-line">
          {content.welcome.subtitle}
        </p>
      </div>

      {/* Email 輸入 */}
      <div className="w-full max-w-sm space-y-6 mb-8">
        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-3 tracking-wide text-left">
            {content.profile.email}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={content.profile.emailPlaceholder}
            className="w-full px-5 py-4 rounded-2xl border-2 border-stone-400 focus:border-[#7A9471] outline-none text-[#5C4B41] transition-all tracking-wide font-sans"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          />
          <p className="mt-2 text-sm text-[#5C4B41]/70 text-left">
            {content.profile.emailNote}
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleNext}
          disabled={!formData.email}
          className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2"
        >
          <span>{content.welcome.createProfile}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            const skipConfirm = language === "en"
              ? "If you choose to skip, your baby profile and all information will not be saved after this session. Continue?"
              : "如果不綁定 Email，本次的寶寶檔案與偏好設定將無法儲存。確定要繼續嗎？";
            if (confirm(skipConfirm)) {
              localStorage.setItem('userProfile', JSON.stringify({ guest: true }));
              router.push('/');
            }
          }}
          className="w-full py-4 bg-white text-[#5C4B41] rounded-2xl font-semibold text-lg border-2 border-stone-400 hover:border-[#7A9471] transition-all tracking-wide"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          {content.welcome.guestMode}
        </button>
      </div>
    </div>
  );

  // Screen 2: 寶寶個資（移除 Email 和名字欄位）
  const renderProfileScreen = () => (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="mb-8">
        <div className="h-2 bg-stone-200 rounded-full mb-6">
          <div className="h-2 bg-[#7A9471] rounded-full" style={{ width: '25%' }} />
        </div>
        <h2 className="text-3xl font-bold text-[#5C4B41] mb-2 tracking-wide font-sans">
          {content.profile.title}
        </h2>
        <p className="text-[#5C4B41]/70">{content.profile.subtitle}</p>
      </div>

      <div className="flex-1 space-y-6">
        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-3 tracking-wide">
            {content.profile.birthday}
          </label>
          <input
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl border-2 border-stone-400 focus:border-[#7A9471] outline-none text-[#5C4B41] transition-all tracking-wide font-sans"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!formData.birthday}
        className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2 mt-8"
      >
        <span>{content.profile.next}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  // Screen 3: 飲食禁忌
  const renderDietScreen = () => (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="mb-8">
        <div className="h-2 bg-stone-200 rounded-full mb-6">
          <div className="h-2 bg-[#7A9471] rounded-full" style={{ width: '50%' }} />
        </div>
        <h2 className="text-3xl font-bold text-[#5C4B41] mb-2 tracking-wide font-sans">
          {content.diet.title}
        </h2>
        <p className="text-[#5C4B41]/70">{content.diet.subtitle}</p>
      </div>

      <div className="flex-1 space-y-8">
        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-4 tracking-wide">
            {content.diet.allergies}
          </label>
          <div className="flex flex-wrap gap-3">
            {allergiesOptions.map((allergy) => (
              <button
                key={allergy}
                onClick={() => handleAllergyToggle(allergy)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all tracking-wide ${
                  formData.allergies.includes(allergy) || (allergy === content.allergies.none && formData.allergies.length === 0)
                    ? "bg-[#7A9471] text-white border-[#5A6B4F]"
                    : "bg-white text-[#5C4B41] border-stone-400"
                }`}
                style={!formData.allergies.includes(allergy) && allergy !== content.allergies.none && formData.allergies.length > 0 ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-4 tracking-wide">
            {content.diet.dietPreference}
          </label>
          <div className="space-y-3">
            {dietOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ ...formData, dietPreference: option.value as any })}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  formData.dietPreference === option.value
                    ? "bg-[#7A9471] text-white border-[#5A6B4F]"
                    : "bg-white text-[#5C4B41] border-stone-400"
                }`}
                style={formData.dietPreference !== option.value ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-semibold tracking-wide">{option.label}</span>
                  {formData.dietPreference === option.value && (
                    <Check className="w-5 h-5 ml-auto" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-white text-[#5C4B41] rounded-2xl font-semibold text-lg border-2 border-stone-400 hover:border-[#7A9471] transition-all tracking-wide"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          {language === "en" ? "Skip" : "跳過"}
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2"
        >
          <span>{content.diet.next}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Screen 4: 廚房工具
  const renderToolsScreen = () => (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="mb-8">
        <div className="h-2 bg-stone-200 rounded-full mb-6">
          <div className="h-2 bg-[#7A9471] rounded-full" style={{ width: '75%' }} />
        </div>
        <h2 className="text-3xl font-bold text-[#5C4B41] mb-2 tracking-wide font-sans">
          {content.tools.title}
        </h2>
        <p className="text-[#5C4B41]/70">{content.tools.subtitle}</p>
      </div>

      <div className="flex-1 space-y-3">
        {cookingToolsOptions.map((tool) => (
          <button
            key={tool.value}
            onClick={() => handleCookingToolToggle(tool.value)}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              formData.cookingTools.includes(tool.value)
                ? "bg-[#7A9471] text-white border-[#5A6B4F]"
                : "bg-white text-[#5C4B41] border-stone-400"
            }`}
            style={!formData.cookingTools.includes(tool.value) ? {
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            } : {}}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tool.emoji}</span>
              <span className="font-semibold tracking-wide">{tool.label}</span>
              {formData.cookingTools.includes(tool.value) && (
                <Check className="w-5 h-5 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={handleComplete}
          className="flex-1 py-4 bg-white text-[#5C4B41] rounded-2xl font-semibold text-lg border-2 border-stone-400 hover:border-[#7A9471] transition-all tracking-wide"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          {language === "en" ? "Skip" : "跳過"}
        </button>
        <button
          onClick={handleComplete}
          disabled={formData.cookingTools.length === 0}
          className="flex-1 py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2"
        >
          <span>{content.tools.complete}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-repeat bg-cover"
      style={{
        backgroundImage: `url("${paperTexture}")`,
        backgroundSize: '200px 200px',
      }}
    >
      <div className="max-w-lg mx-auto min-h-screen">
        {currentStep === 1 && renderWelcomeScreen()}
        {currentStep === 2 && renderProfileScreen()}
        {currentStep === 3 && renderDietScreen()}
        {currentStep === 4 && renderToolsScreen()}
      </div>
    </div>
  );
}

