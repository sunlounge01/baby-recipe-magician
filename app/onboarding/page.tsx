"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowRight, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface FormData {
  email: string;
  nickname: string;
  birthday: string;
  allergies: string[];
  dietPreference: "omnivore" | "vegetarian" | "vegan";
  cookingTools: string[];
}

const allergiesOptions = [
  "雞蛋", "牛奶", "堅果", "花生", "海鮮", "小麥", "大豆", "無"
];

const dietOptions = [
  { value: "omnivore", label: "葷食", emoji: "🍖" },
  { value: "vegetarian", label: "蛋奶素", emoji: "🥚" },
  { value: "vegan", label: "全素", emoji: "🥬" },
];

const cookingToolsOptions = [
  { value: "rice-cooker", label: "電鍋 (蒸)", emoji: "🍚" },
  { value: "pan", label: "平底鍋 (煎)", emoji: "🍳" },
  { value: "pot", label: "燉鍋 (煮)", emoji: "🍲" },
  { value: "oven", label: "烤箱 (烤)", emoji: "🔥" },
  { value: "blender", label: "果汁機 (打泥)", emoji: "🥤" },
];

// 紙張材質背景
const paperTexture = "data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23FFFBF0'/%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E";

// 卡片材質背景
const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";

export default function OnboardingPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEmail = localStorage.getItem("userEmail") || "";
    if (storedEmail) {
      setFormData((prev) => ({ ...prev, email: storedEmail }));
    }
  }, []);

  const progress = (currentStep / 4) * 100;

  const handleNext = () => {
    if (currentStep === 2 && (!formData.email || !formData.nickname || !formData.birthday)) {
      alert("請先填寫 Email、寶寶暱稱與生日");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleAllergyToggle = (allergy: string) => {
    if (allergy === "無") {
      setFormData({ ...formData, allergies: [] });
    } else {
      const newAllergies = formData.allergies.includes(allergy)
        ? formData.allergies.filter(a => a !== allergy)
        : [...formData.allergies.filter(a => a !== "無"), allergy];
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

  const handleComplete = async () => {
    if (!formData.email || !formData.nickname || !formData.birthday) {
      alert("請填寫 Email、寶寶暱稱與生日");
      return;
    }
    setIsSaving(true);
    const monthsOld = getMonthsOld(formData.birthday);

    try {
      // 同步到 Supabase
      if (supabase) {
        await supabase.from("profiles").upsert({ email: formData.email });
        const { data: babyRows, error: babyErr } = await supabase
          .from("babies")
          .insert({
            user_email: formData.email,
            name: formData.nickname,
            months_old: monthsOld,
          })
          .select();
        if (babyErr) throw babyErr;

        const savedBaby = babyRows?.[0];
        if (typeof window !== "undefined") {
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem(
            "babies",
            JSON.stringify([savedBaby || { id: Date.now(), name: formData.nickname, months_old: monthsOld }])
          );
          localStorage.setItem("activeBabyIds", JSON.stringify([savedBaby?.id || 0]));
        }
      } else if (typeof window !== "undefined") {
        // 沒有 supabase client 也先寫本地
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem(
          "babies",
          JSON.stringify([{ id: Date.now(), name: formData.nickname, months_old: monthsOld }])
        );
        localStorage.setItem("activeBabyIds", JSON.stringify([0]));
      }

      // 備份原本 userProfile 以相容舊流程
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          nickname: formData.nickname,
          birthday: formData.birthday,
          allergies: formData.allergies,
          dietPreference: formData.dietPreference,
          cookingTools: formData.cookingTools,
          email: formData.email,
        })
      );

      alert("你太棒了！魔法師已經記住這一切了！");
      router.push('/');
    } catch (error) {
      console.error("Onboarding 儲存失敗:", error);
      alert("哎呀，魔法失手，請稍後再試！");
    } finally {
      setIsSaving(false);
    }
  };

  // Screen 1: 歡迎畫面
  const renderWelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-8">
        <div className="p-6 bg-[#7A9471] rounded-3xl mb-6 inline-block">
          <ChefHat className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-[#5C4B41] mb-4 tracking-wide font-sans">
          歡迎來到<br />幼兒食譜魔法師
        </h1>
        <p className="text-lg text-[#5C4B41]/70 tracking-wide">
          讓我們為您的寶寶<br />量身打造專屬食譜
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2"
        >
          <span>建立寶寶檔案</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            localStorage.setItem('userProfile', JSON.stringify({ guest: true }));
            router.push('/');
          }}
          className="w-full py-4 bg-white text-[#5C4B41] rounded-2xl font-semibold text-lg border-2 border-dashed border-stone-400/50 hover:border-[#7A9471] transition-all tracking-wide"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          以訪客試用
        </button>
      </div>
    </div>
  );

  // Screen 2: 寶寶個資
  const renderProfileScreen = () => (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="mb-8">
        <div className="h-2 bg-stone-200 rounded-full mb-6">
          <div className="h-2 bg-[#7A9471] rounded-full" style={{ width: '25%' }} />
        </div>
        <h2 className="text-3xl font-bold text-[#5C4B41] mb-2 tracking-wide font-sans">
          建立寶寶檔案
        </h2>
        <p className="text-[#5C4B41]/70">讓我們認識您的寶寶</p>
      </div>

      <div className="flex-1 space-y-6">
        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-3 tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-stone-400/50 focus:border-[#7A9471] outline-none text-[#5C4B41] transition-all tracking-wide font-sans"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          />
        </div>
        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-3 tracking-wide">
            寶寶暱稱
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="例如：小寶、妹妹"
            className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-stone-400/50 focus:border-[#7A9471] outline-none text-[#5C4B41] transition-all tracking-wide font-sans"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-3 tracking-wide">
            生日
          </label>
          <input
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            className="w-full px-5 py-4 rounded-2xl border-2 border-dashed border-stone-400/50 focus:border-[#7A9471] outline-none text-[#5C4B41] transition-all tracking-wide font-sans"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!formData.email || !formData.nickname || !formData.birthday}
        className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2 mt-8"
      >
        <span>下一步</span>
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
          飲食禁忌
        </h2>
        <p className="text-[#5C4B41]/70">讓我們知道寶寶的飲食限制</p>
      </div>

      <div className="flex-1 space-y-8">
        <div>
          <label className="block text-lg font-semibold text-[#5C4B41] mb-4 tracking-wide">
            過敏原
          </label>
          <div className="flex flex-wrap gap-3">
            {allergiesOptions.map((allergy) => (
              <button
                key={allergy}
                onClick={() => handleAllergyToggle(allergy)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all tracking-wide ${
                  formData.allergies.includes(allergy) || (allergy === "無" && formData.allergies.length === 0)
                    ? "bg-[#7A9471] text-white border-[#5A6B4F]"
                    : "bg-white text-[#5C4B41] border-dashed border-stone-400/50"
                }`}
                style={!formData.allergies.includes(allergy) && allergy !== "無" && formData.allergies.length > 0 ? {
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
            飲食偏好
          </label>
          <div className="space-y-3">
            {dietOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ ...formData, dietPreference: option.value as any })}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  formData.dietPreference === option.value
                    ? "bg-[#7A9471] text-white border-[#5A6B4F]"
                    : "bg-white text-[#5C4B41] border-dashed border-stone-400/50"
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

      <button
        onClick={handleNext}
        className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2 mt-8"
      >
        <span>下一步</span>
        <ArrowRight className="w-5 h-5" />
      </button>
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
          廚房工具
        </h2>
        <p className="text-[#5C4B41]/70">選擇您常用的烹飪方式</p>
      </div>

      <div className="flex-1 space-y-3">
        {cookingToolsOptions.map((tool) => (
          <button
            key={tool.value}
            onClick={() => handleCookingToolToggle(tool.value)}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              formData.cookingTools.includes(tool.value)
                ? "bg-[#7A9471] text-white border-[#5A6B4F]"
                : "bg-white text-[#5C4B41] border-dashed border-stone-400/50"
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

      <button
        onClick={handleComplete}
        disabled={formData.cookingTools.length === 0}
        className="w-full py-4 bg-[#7A9471] text-white rounded-2xl font-bold text-lg border-2 border-[#5A6B4F] hover:scale-105 active:scale-100 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tracking-wide shadow-lg shadow-stone-300/50 flex items-center justify-center gap-2 mt-8"
      >
        <span>完成設定，開始魔法！✨</span>
      </button>
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

