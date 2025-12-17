"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Heart } from "lucide-react";
import { format } from "date-fns";
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

interface CompleteMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeTitle?: string; // 可選，手動模式時為空
  nutrition?: NutritionInfo | string[] | string;
  isManual?: boolean; // 是否為手動補登模式
  defaultDate?: Date; // 預設日期
  onSave?: () => void; // 儲存後的回調
}

type MealType = "breakfast" | "lunch" | "snack" | "dinner";

// 卡片材質背景
const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";

// 根據目前時間自動選取餐別
const getDefaultMealType = (): MealType => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 17) return "snack";
  return "dinner";
};

export default function CompleteMealModal({
  isOpen,
  onClose,
  recipeTitle = "",
  nutrition,
  isManual = false,
  defaultDate,
  onSave,
}: CompleteMealModalProps) {
  const { language, t } = useLanguage();
  const tr = (zh: string, en: string) => (language === "en" ? en : zh);
  const [title, setTitle] = useState(recipeTitle);
  const [selectedDate, setSelectedDate] = useState(
    defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [consumptionPercentage, setConsumptionPercentage] = useState<number>(100);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 解析營養數值並乘以比例（例如 "10g" * 0.5 = "5g"）
  const parseAndMultiply = (value: string, ratio: number): string => {
    const match = value.match(/^([\d.]+)(.*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2] || "";
      const result = Math.round(num * ratio * 10) / 10; // 保留一位小數
      return `${result}${unit}`;
    }
    return value;
  };

  // 計算調整後的營養數值（用於顯示）
  const getAdjustedNutrition = (): NutritionInfo | null => {
    if (!nutrition || typeof nutrition !== 'object' || nutrition === null || !('calories' in nutrition)) {
      return null;
    }
    const baseNutrition = nutrition as NutritionInfo;
    const ratio = consumptionPercentage / 100;
    return {
      ...baseNutrition,
      calories: Math.round(baseNutrition.calories * ratio),
      macros: {
        protein: parseAndMultiply(baseNutrition.macros.protein, ratio),
        carbs: parseAndMultiply(baseNutrition.macros.carbs, ratio),
        fat: parseAndMultiply(baseNutrition.macros.fat, ratio),
      },
      micronutrients: baseNutrition.micronutrients ? {
        calcium: parseAndMultiply(baseNutrition.micronutrients.calcium, ratio),
        iron: parseAndMultiply(baseNutrition.micronutrients.iron, ratio),
        vitamin_c: parseAndMultiply(baseNutrition.micronutrients.vitamin_c, ratio),
      } : undefined,
    };
  };

  // 動態生成 mealTypes
  const mealTypes: { value: MealType; label: string; icon: string }[] = [
    { value: "breakfast", label: t.meal_types.breakfast, icon: "🥞" },
    { value: "lunch", label: t.meal_types.lunch, icon: "🍱" },
    { value: "snack", label: t.meal_types.snack, icon: "🍪" },
    { value: "dinner", label: t.meal_types.dinner, icon: "🍲" },
  ];

  // 當 recipeTitle 改變時更新 title
  useEffect(() => {
    if (!isManual && recipeTitle) {
      setTitle(recipeTitle);
    }
  }, [recipeTitle, isManual]);

  // 重置表單
  useEffect(() => {
    if (!isOpen) {
      setTitle(recipeTitle || "");
      setSelectedDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setMealType(getDefaultMealType());
      setSelectedImage(null);
      setNote("");
      setRating(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, recipeTitle, defaultDate]);

  if (!isOpen) return null;

  // 壓縮圖片（限制大小）
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // 限制最大尺寸為 800px
          const maxSize = 800;
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("無法建立 canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // 使用較低品質以減少檔案大小
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查檔案大小（限制 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert(tr("圖片檔案太大，請選擇小於 5MB 的圖片", "Image is too large. Please select a file under 5MB."));
      return;
    }

    setIsUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      setSelectedImage(compressedBase64);
    } catch (error) {
      console.error(tr("圖片處理失敗:", "Image processing failed:"), error);
      alert(tr("圖片處理失敗，請重試", "Image processing failed, please try again."));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (isManual && !title.trim()) {
      alert(t.modal.name_required);
      return;
    }

    // 準備營養資料
    let nutritionData: NutritionInfo;

    // 如果是手動模式，需要先呼叫 API 分析營養
    if (isManual) {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mealName: title.trim(), language: language }),
        });

        if (!response.ok) {
          throw new Error(tr('分析營養失敗', 'Nutrition analysis failed'));
        }

        const data = await response.json();
        nutritionData = data.nutrition;
      } catch (error) {
        console.error(tr("分析營養失敗:", "Nutrition analysis failed:"), error);
        // 如果 API 失敗，使用預設值
        nutritionData = {
          calories: 200,
          tags: [tr("營養均衡", "Balanced")],
          benefit: tr("營養均衡的幼兒餐點", "A balanced toddler meal"),
          macros: {
            protein: "10g",
            carbs: "25g",
            fat: "8g"
          },
          micronutrients: {
            calcium: "100mg",
            iron: "2.0mg",
            vitamin_c: "20mg"
          }
        };
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // 自動模式：使用傳入的營養資料
      if (nutrition && typeof nutrition === 'object' && nutrition !== null && 'calories' in nutrition) {
        nutritionData = nutrition as NutritionInfo;
      } else {
        // 預設值
        nutritionData = {
          calories: 200,
          tags: [tr("營養均衡", "Balanced")],
          benefit: typeof nutrition === 'string' ? nutrition : tr("營養均衡的幼兒餐點", "A balanced toddler meal"),
          macros: {
            protein: "10g",
            carbs: "25g",
            fat: "8g"
          }
        };
      }
    }

    // 根據完食比例計算實際攝取的營養
    const ratio = consumptionPercentage / 100;
    const adjustedNutrition: NutritionInfo = {
      ...nutritionData,
      calories: Math.round(nutritionData.calories * ratio),
      macros: {
        protein: parseAndMultiply(nutritionData.macros.protein, ratio),
        carbs: parseAndMultiply(nutritionData.macros.carbs, ratio),
        fat: parseAndMultiply(nutritionData.macros.fat, ratio),
      },
      micronutrients: nutritionData.micronutrients ? {
        calcium: parseAndMultiply(nutritionData.micronutrients.calcium, ratio),
        iron: parseAndMultiply(nutritionData.micronutrients.iron, ratio),
        vitamin_c: parseAndMultiply(nutritionData.micronutrients.vitamin_c, ratio),
      } : undefined,
    };

    // 讀取現有的 eating_logs
    const existingLogs = localStorage.getItem('eating_logs');
    const logs = existingLogs ? JSON.parse(existingLogs) : [];

    // 新增紀錄
    const newLog = {
      id: Date.now().toString(),
      date: selectedDate,
      title: title.trim(),
      mealType,
      rating,
      image: selectedImage,
      note: note.trim(),
      nutrition: adjustedNutrition,
      createdAt: new Date().toISOString(),
    };

    logs.push(newLog);

    // 儲存回 localStorage
    try {
      localStorage.setItem('eating_logs', JSON.stringify(logs));
      alert(t.modal.save_success);
      // 重置表單
      setTitle(recipeTitle || "");
      setSelectedDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setMealType(getDefaultMealType());
      setSelectedImage(null);
      setNote("");
      setRating(0);
      setConsumptionPercentage(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSave?.();
      onClose();
    } catch (error) {
      console.error("儲存失敗:", error);
      alert(t.modal.save_error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div
        className="w-[95%] sm:w-full max-w-md rounded-[2rem] border-2 border-dashed border-moss-green/30 shadow-lg shadow-moss-green/20 p-4 sm:p-6 bg-white relative my-8 mx-auto"
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
        <h2 className="text-2xl font-bold text-ink-dark mb-2 tracking-wide font-sans">
          {isManual ? t.modal.manual_title : t.modal.auto_title}
        </h2>

        {/* 菜名輸入（手動模式）或顯示（自動模式） */}
        <div className="mb-4">
          {isManual ? (
            <div>
              <label className="block text-base font-semibold text-ink-dark mb-2 tracking-wide">
                {t.modal.meal_name} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.placeholders.manual_name}
                className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none text-ink-dark placeholder-ink-light/50 transition-all tracking-wide font-sans"
                style={{
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                }}
              />
            </div>
          ) : (
            <p className="text-lg text-ink-dark mb-4 font-sans">{recipeTitle}</p>
          )}
        </div>

        {/* 日期選擇（手動模式） */}
        {isManual && (
          <div className="mb-4">
            <label className="block text-base font-semibold text-ink-dark mb-2 tracking-wide">
              {t.modal.date}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none text-ink-dark transition-all tracking-wide font-sans"
              style={{
                backgroundImage: `url("${cardTexture}")`,
                backgroundSize: 'cover',
              }}
            />
          </div>
        )}

        {/* 餐別選擇 */}
        <div className="mb-4">
          <label className="block text-base font-semibold text-ink-dark mb-2 tracking-wide">
            {t.modal.meal_type}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mealTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setMealType(type.value)}
                className={`px-4 py-3 rounded-xl border-2 transition-all font-semibold tracking-wide ${
                  mealType === type.value
                    ? "bg-deep-teal text-white border-deep-teal"
                    : "border-dashed border-moss-green/30 text-ink-dark hover:border-deep-teal"
                }`}
                style={mealType !== type.value ? {
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                } : {}}
              >
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-sm">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 照片上傳區（選填） */}
        <div className="mb-4">
          <label className="block text-base font-semibold text-ink-dark mb-2 tracking-wide">
            {t.modal.photo} <span className="text-ink-dark/60 text-sm font-normal">({t.modal.photo_optional})</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-moss-green/30 rounded-2xl p-6 cursor-pointer hover:border-deep-teal transition-all text-center min-h-[120px] flex items-center justify-center"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {isUploading ? (
              <div className="text-ink-dark">{tr("處理中...", "Processing...")}</div>
            ) : selectedImage ? (
              <div className="relative w-full">
                <img
                  src={selectedImage}
                  alt="預覽"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-ink-light" />
                <div className="text-ink-dark font-sans text-sm">
                    <div className="font-semibold">{tr("點擊上傳照片", "Click to upload a photo")}</div>
                    <div className="text-xs text-ink-dark/70">{tr("或留空使用預設圖示", "Or leave empty to use default icon")}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 寶寶喜愛度 */}
        <div className="mb-4">
          <label className="block text-base font-semibold text-ink-dark mb-2 tracking-wide">
            {t.modal.rating} <span className="text-ink-dark/60 text-sm font-normal">({t.modal.rating_optional})</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setRating(num)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Heart
                  className={`w-8 h-8 ${
                    num <= rating
                      ? "fill-[#FF6B9D] text-[#FF6B9D]"
                      : "fill-ink-light/30 text-ink-light/50"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-ink-dark font-sans">
                {rating} {tr("顆愛心", "hearts")}
              </span>
            )}
          </div>
        </div>

        {/* 完食比例 */}
        <div className="mb-4">
          <label className="block text-base font-semibold text-ink-dark mb-2 tracking-wide">
            {t.labels.consumption}
          </label>
          <div className="space-y-3">
            {/* 快速選擇按鈕 */}
            <div className="flex gap-2 flex-wrap">
              {[0, 25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setConsumptionPercentage(percent)}
                  className={`px-3 sm:px-4 py-2 rounded-xl border-2 transition-all font-semibold text-xs sm:text-sm ${
                    consumptionPercentage === percent
                      ? "bg-deep-teal text-white border-deep-teal"
                      : "border-dashed border-moss-green/30 text-ink-dark hover:border-deep-teal"
                  }`}
                  style={consumptionPercentage !== percent ? {
                    backgroundImage: `url("${cardTexture}")`,
                    backgroundSize: 'cover',
                  } : {}}
                >
                  {percent}%
                </button>
              ))}
            </div>
            {/* 滑桿 */}
            <div className="px-2 py-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={consumptionPercentage}
                onChange={(e) => setConsumptionPercentage(Number(e.target.value))}
                className="w-full h-6 sm:h-2 bg-moss-green/20 rounded-lg appearance-none cursor-pointer accent-deep-teal touch-manipulation"
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
              <div className="flex justify-between text-xs text-ink-dark/60 mt-1">
                <span>0%</span>
                <span className="font-semibold text-deep-teal">{consumptionPercentage}%</span>
                <span>100%</span>
              </div>
            </div>
            {/* 顯示調整後的營養資訊 */}
            {!isManual && nutrition && typeof nutrition === 'object' && nutrition !== null && 'calories' in nutrition && (
              <div className="mt-3 p-3 rounded-xl border-2 border-dashed border-deep-teal/30 bg-deep-teal/5">
                <div className="text-sm font-semibold text-ink-dark mb-2">{t.labels.actual_intake}:</div>
                <div className="text-xs text-ink-dark/80 space-y-1">
                  <div>
                    🔥 {(nutrition as NutritionInfo).calories} kcal ➔ {getAdjustedNutrition()?.calories || 0} kcal
                  </div>
                  {getAdjustedNutrition()?.macros && (
                    <div>
                      🥚 {t.nutrients.protein}: {(nutrition as NutritionInfo).macros.protein} ➔ {getAdjustedNutrition()?.macros.protein}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 心得筆記 */}
        <div className="mb-6">
          <label className="block text-base font-semibold text-ink-dark mb-2 tracking-wide">
            {t.modal.note} <span className="text-ink-dark/60 text-sm font-normal">({t.modal.note_optional})</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tr("例如：寶寶今天吃光光！", "e.g., Baby finished everything today!")}
            className="w-full h-24 p-4 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none resize-none text-ink-dark placeholder-ink-light/50 transition-all tracking-wide font-sans"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          />
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white text-ink-dark rounded-2xl font-semibold border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all tracking-wide"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            {t.modal.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isAnalyzing}
            className="flex-1 py-3 bg-deep-teal text-white rounded-2xl font-bold border-2 border-moss-green hover:scale-105 active:scale-100 transition-transform tracking-wide shadow-lg shadow-moss-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? t.modal.analyzing : t.modal.save}
          </button>
        </div>
      </div>
    </div>
  );
}
