"use client";

import { useState, useEffect } from "react";
import { X, Plus, Heart, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import CompleteMealModal from "./CompleteMealModal";

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

interface EatingLog {
  id: string;
  date: string;
  title: string;
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  rating: number;
  image: string | null;
  note: string;
  nutrition: NutritionInfo;
  createdAt: string;
}

interface DayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  onRefresh?: () => void; // 當新增紀錄後刷新
}

// 卡片材質背景
const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";

const mealTypeConfig = {
  breakfast: { label: "早餐", icon: "🥞", order: 1 },
  lunch: { label: "午餐", icon: "🍱", order: 2 },
  snack: { label: "下午茶", icon: "🍪", order: 3 },
  dinner: { label: "晚餐", icon: "🍲", order: 4 },
};

export default function DayViewModal({
  isOpen,
  onClose,
  date,
  onRefresh,
}: DayViewModalProps) {
  const [logs, setLogs] = useState<EatingLog[]>([]);
  const [isCompleteMealModalOpen, setIsCompleteMealModalOpen] = useState(false);

  // 載入該日的紀錄
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const storedLogs = localStorage.getItem('eating_logs');
      if (storedLogs) {
        try {
          const allLogs = JSON.parse(storedLogs);
          const dayLogs = allLogs.filter((log: EatingLog) => log.date === dateStr);
          // 依餐別排序
          dayLogs.sort((a: EatingLog, b: EatingLog) => {
            const orderA = mealTypeConfig[a.mealType]?.order || 999;
            const orderB = mealTypeConfig[b.mealType]?.order || 999;
            return orderA - orderB;
          });
          setLogs(dayLogs);
        } catch (error) {
          console.error('解析 eating_logs 失敗:', error);
          setLogs([]);
        }
      } else {
        setLogs([]);
      }
    }
  }, [isOpen, date]);

  const handleRefresh = () => {
    // 重新載入紀錄
    const dateStr = format(date, 'yyyy-MM-dd');
    const storedLogs = localStorage.getItem('eating_logs');
    if (storedLogs) {
      try {
        const allLogs = JSON.parse(storedLogs);
        const dayLogs = allLogs.filter((log: EatingLog) => log.date === dateStr);
        dayLogs.sort((a: EatingLog, b: EatingLog) => {
          const orderA = mealTypeConfig[a.mealType]?.order || 999;
          const orderB = mealTypeConfig[b.mealType]?.order || 999;
          return orderA - orderB;
        });
        setLogs(dayLogs);
      } catch (error) {
        console.error('解析 eating_logs 失敗:', error);
        setLogs([]);
      }
    }
    onRefresh?.();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
        <div
          className="w-[95%] sm:w-full max-w-2xl rounded-[2rem] border-2 border-dashed border-moss-green/30 shadow-lg shadow-moss-green/20 p-4 sm:p-6 bg-white relative my-8 mx-auto"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5 text-ink-dark" />
          </button>

          {/* 標題 */}
          <h2 className="text-2xl font-bold text-ink-dark mb-6 tracking-wide font-sans">
            {format(date, 'M月d日', { locale: zhTW })}
          </h2>

          {/* 紀錄清單 */}
          {logs.length > 0 ? (
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {logs.map((log) => {
                const mealConfig = mealTypeConfig[log.mealType] || mealTypeConfig.breakfast;
                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl border-2 border-dashed border-moss-green/30/30 bg-white/50"
                  >
                    <div className="flex items-start gap-4">
                      {/* 餐別圖示 */}
                      <div className="text-3xl flex-shrink-0">{mealConfig.icon}</div>

                      {/* 內容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-ink-dark/70 font-sans">
                              {mealConfig.label}
                            </span>
                            <span className="text-lg font-bold text-ink-dark font-sans">
                              {log.title}
                            </span>
                          </div>
                          {/* 刪除按鈕 */}
                          <button
                            onClick={() => {
                              if (confirm(`確定要刪除「${log.title}」的紀錄嗎？`)) {
                                const storedLogs = localStorage.getItem('eating_logs');
                                if (storedLogs) {
                                  try {
                                    const allLogs = JSON.parse(storedLogs);
                                    const filteredLogs = allLogs.filter((l: EatingLog) => l.id !== log.id);
                                    localStorage.setItem('eating_logs', JSON.stringify(filteredLogs));
                                    handleRefresh();
                                  } catch (error) {
                                    console.error('刪除失敗:', error);
                                    alert('刪除失敗，請重試');
                                  }
                                }
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500 hover:text-red-700 flex-shrink-0"
                            title="刪除紀錄"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 營養摘要 */}
                        {log.nutrition && (
                          <div className="text-xs text-ink-dark/60 mb-2 font-sans">
                            🔥 {log.nutrition.calories} kcal
                            {log.nutrition.macros?.protein && (
                              <> | 🥚 {log.nutrition.macros.protein} 蛋白質</>
                            )}
                          </div>
                        )}

                        {/* 評分 */}
                        {log.rating > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <Heart
                                key={num}
                                className={`w-4 h-4 ${
                                  num <= log.rating
                                    ? "fill-[#FF6B9D] text-[#FF6B9D]"
                                    : "fill-ink-light/30 text-ink-light/50"
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* 照片縮圖 */}
                        {log.image ? (
                          <img
                            src={log.image}
                            alt={log.title}
                            className="w-20 h-20 object-cover rounded-xl border-2 border-dashed border-moss-green/30/50 mt-2"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-moss-green/30/50 flex items-center justify-center bg-stone-100 mt-2">
                            <span className="text-2xl">{mealConfig.icon}</span>
                          </div>
                        )}

                        {/* 心得筆記 */}
                        {log.note && (
                          <p className="text-sm text-ink-dark mt-2 font-sans">{log.note}</p>
                        )}

                        {/* 營養標籤 */}
                        {log.nutrition?.tags && log.nutrition.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {log.nutrition.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold border border-green-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 mb-6">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-ink-dark font-sans">這一天還沒有任何紀錄</p>
            </div>
          )}

          {/* 手動補登按鈕 */}
          <button
            onClick={() => setIsCompleteMealModalOpen(true)}
            className="w-full py-4 bg-deep-teal hover:bg-moss-green text-white rounded-2xl font-bold text-lg border-2 border-moss-green hover:scale-105 active:scale-100 transition-transform shadow-lg shadow-moss-green/20 flex items-center justify-center gap-2 tracking-wide"
          >
            <Plus className="w-5 h-5" />
            <span>➕ 手動補登</span>
          </button>
        </div>
      </div>

      {/* Complete Meal Modal (手動模式) */}
      <CompleteMealModal
        isOpen={isCompleteMealModalOpen}
        onClose={() => setIsCompleteMealModalOpen(false)}
        isManual={true}
        defaultDate={date}
        onSave={handleRefresh}
      />
    </>
  );
}

