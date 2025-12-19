"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface LoadingScreenProps {
  language?: "zh" | "en";
}

// 育兒小知識輪播內容
const loadingTips = {
  zh: [
    "正在諮詢營養師...",
    "正在計算維生素 C 的含量...",
    "你知道嗎？寶寶 6 個月大就可以嘗試手指食物囉！",
    "正在挑選最適合你家寶寶的食材...",
    "正在分析營養成分...",
    "你知道嗎？寶寶 8 個月大可以開始嘗試肉類了！",
    "正在設計適合的質地...",
    "你知道嗎？全脂奶製品適合 10 個月以上的寶寶！",
    "正在組合最佳營養搭配...",
    "你知道嗎？多樣化的食材有助於寶寶味覺發展！",
    "正在檢查食材安全性...",
    "你知道嗎？12 個月以下的寶寶要避免蜂蜜和整顆堅果！",
  ],
  en: [
    "Consulting with nutritionist...",
    "Calculating vitamin C content...",
    "Did you know? Babies can try finger foods at 6 months!",
    "Selecting the best ingredients for your baby...",
    "Analyzing nutritional content...",
    "Did you know? Babies can start trying meat at 8 months!",
    "Designing appropriate textures...",
    "Did you know? Full-fat dairy is suitable for babies 10+ months!",
    "Combining optimal nutrition...",
    "Did you know? Diverse ingredients help develop baby's taste buds!",
    "Checking ingredient safety...",
    "Did you know? Babies under 12 months should avoid honey and whole nuts!",
  ],
};

export default function LoadingScreen({ language = "zh" }: LoadingScreenProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const tips = loadingTips[language];

  useEffect(() => {
    // 每 3 秒切換一次提示
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="w-[90%] max-w-md p-8 rounded-[2rem] border-2 border-stone-400 bg-white shadow-2xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
        }}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {/* 動畫圖示 */}
          <div className="relative">
            <Loader2 className="w-16 h-16 text-deep-teal animate-spin" />
            <Sparkles className="w-8 h-8 text-mustard-yellow absolute -top-2 -right-2 animate-pulse" />
          </div>

          {/* 主要文字 */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-ink-dark tracking-wide font-sans">
              {language === "en" ? "Cooking Magic..." : "魔法進行中..."}
            </h3>
            <p className="text-base text-ink-light font-sans">
              {language === "en" ? "Creating perfect recipes for your baby" : "正在為寶寶量身打造完美食譜"}
            </p>
          </div>

          {/* 輪播提示 */}
          <div className="w-full min-h-[60px] flex items-center justify-center">
            <div
              key={currentTipIndex}
              className="px-4 py-3 rounded-xl bg-sage-green/10 border-2 border-sage-green/30 text-ink-dark text-sm font-medium tracking-wide font-sans animate-in fade-in slide-in-from-bottom-2"
            >
              {tips[currentTipIndex]}
            </div>
          </div>

          {/* 進度指示器 */}
          <div className="w-full max-w-xs">
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-deep-teal to-moss-green rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

