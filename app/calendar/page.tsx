"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Home, Calendar as CalendarIcon } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  getDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addYears,
  subYears,
  eachMonthOfInterval,
  getDaysInMonth,
  isSameYear
} from "date-fns";
import { zhTW } from "date-fns/locale";
import DayViewModal from "../components/DayViewModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// 卡片材質背景
const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";

interface NutritionInfo {
  calories: number;
  tags: string[];
  benefit: string;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
  };
}

interface EatingLog {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  recipeTitle?: string;
  mealType?: "breakfast" | "lunch" | "snack" | "dinner";
  rating?: number;
  nutrition: NutritionInfo;
  image: string | null;
  note: string;
  createdAt: string;
}

type ViewMode = "week" | "month" | "year";

export default function CalendarPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eatingLogs, setEatingLogs] = useState<EatingLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayViewModalOpen, setIsDayViewModalOpen] = useState(false);

  // 載入 eating_logs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLogs = localStorage.getItem('eating_logs');
      if (storedLogs) {
        try {
          const logs = JSON.parse(storedLogs);
          setEatingLogs(logs);
        } catch (error) {
          console.error('解析 eating_logs 失敗:', error);
        }
      }
    }
  }, []);

  // 取得某一天的紀錄
  const getLogsForDate = (date: Date): EatingLog[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return eatingLogs.filter(log => log.date === dateStr);
  };

  // 取得某一天的餐點數量
  const getMealCountForDate = (date: Date): number => {
    return getLogsForDate(date).length;
  };

  // 餐別配置
  const mealTypeConfig: Record<string, { color: string; icon: string }> = {
    breakfast: { color: "#F4D35E", icon: "🥞" },
    lunch: { color: "#D48C4E", icon: "🍱" },
    snack: { color: "#E6B874", icon: "🍪" },
    dinner: { color: "#C67D63", icon: "🍲" },
  };

  const getMealConfig = (log: EatingLog) => {
    if (log.mealType && mealTypeConfig[log.mealType]) {
      return mealTypeConfig[log.mealType];
    }
    return { color: "#E5E7EB", icon: "🍽️" };
  };

  // 渲染單一紀錄區塊（月視圖用）
  const renderLogCell = (log: EatingLog, cellCount: number) => {
    const mealConfig = getMealConfig(log);
    const displayTitle = log.title || log.recipeTitle || "未命名";
    const hasImage = !!log.image;
    const rating = log.rating || 0;
    
    const textSizeClass = cellCount >= 3 
      ? "text-[10px] sm:text-xs" 
      : cellCount === 2 
        ? "text-xs sm:text-sm" 
        : "text-sm sm:text-base";
    
    const titleSizeClass = cellCount >= 3 
      ? "text-xs sm:text-sm" 
      : cellCount === 2 
        ? "text-sm sm:text-base" 
        : "text-base sm:text-lg";

    return (
      <div
        key={log.id}
        className="relative w-full h-full rounded-lg overflow-hidden"
        style={{
          backgroundImage: hasImage ? `url(${log.image})` : undefined,
          backgroundColor: hasImage ? undefined : mealConfig.color,
          backgroundSize: hasImage ? 'cover' : undefined,
          backgroundPosition: hasImage ? 'center' : undefined,
        }}
      >
        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <span className="text-4xl sm:text-5xl">{mealConfig.icon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 p-1.5 sm:p-2 flex flex-col justify-between">
          <div className="flex-1 flex items-start">
            <h4
              className={`${titleSizeClass} font-bold text-white leading-tight line-clamp-2 drop-shadow-lg`}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              {displayTitle}
            </h4>
          </div>
          {rating > 0 && (
            <div className={`${textSizeClass} text-white flex items-center gap-0.5 drop-shadow-lg`}>
              {Array.from({ length: rating }, (_, i) => (
                <span key={i} className="text-red-400" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  ❤️
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 計算營養統計
  const nutritionStats = useMemo(() => {
    let dateRange: { start: Date; end: Date };
    
    if (viewMode === "week") {
      dateRange = {
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate)
      };
    } else if (viewMode === "month") {
      dateRange = {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      };
    } else {
      dateRange = {
        start: startOfYear(currentDate),
        end: endOfYear(currentDate)
      };
    }

    const rangeLogs = eatingLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= dateRange.start && logDate <= dateRange.end;
    });

    const tagCount: Record<string, number> = {};
    rangeLogs.forEach(log => {
      if (log.nutrition?.tags) {
        log.nutrition.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    const sortedTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return sortedTags;
  }, [eatingLogs, viewMode, currentDate]);

  // 切換日期
  const goToPrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subYears(currentDate, 1));
    }
    setSelectedDate(null);
    setIsDayViewModalOpen(false);
  };

  const goToNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addYears(currentDate, 1));
    }
    setSelectedDate(null);
    setIsDayViewModalOpen(false);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayViewModalOpen(true);
  };

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      const storedLogs = localStorage.getItem('eating_logs');
      if (storedLogs) {
        try {
          const logs = JSON.parse(storedLogs);
          setEatingLogs(logs);
        } catch (error) {
          console.error('解析 eating_logs 失敗:', error);
        }
      }
    }
  };

  // 渲染月視圖
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = getDay(monthStart);
    const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (firstDayOfWeek - i));
      return date;
    });
    const lastDayOfWeek = getDay(monthEnd);
    const daysAfterMonth = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i + 1);
      return date;
    });
    const allDays = [...daysBeforeMonth, ...daysInMonth, ...daysAfterMonth];

    return (
      <div className="grid grid-cols-7 gap-2">
        {allDays.map((date, idx) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isToday = isSameDay(date, new Date());
          const logs = getLogsForDate(date);
          const logCount = logs.length;

          let gridClass = "";
          if (logCount === 0) {
            gridClass = "";
          } else if (logCount === 1) {
            gridClass = "";
          } else if (logCount === 2) {
            gridClass = "grid grid-rows-2 h-full w-full gap-0.5";
          } else {
            gridClass = "grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5";
          }

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(date)}
              className={`
                aspect-square rounded-xl border-2 transition-all relative overflow-hidden
                ${isCurrentMonth ? 'text-ink-dark' : 'text-ink-light/50'}
                ${isToday ? 'border-deep-teal' : 'border-dashed border-moss-green/30'}
                hover:border-deep-teal cursor-pointer
              `}
              style={logCount === 0 && !isToday ? {
                backgroundImage: `url("${cardTexture}")`,
                backgroundSize: 'cover',
              } : {}}
            >
              <div 
                className={`absolute top-1 left-1 z-10 px-1 py-0.5 rounded text-xs sm:text-sm font-bold ${
                  isToday 
                    ? 'bg-deep-teal text-white' 
                    : logCount > 0 
                      ? 'bg-black/50 text-white' 
                      : isCurrentMonth 
                        ? 'text-ink-dark' 
                        : 'text-ink-light/50'
                }`}
                style={{
                  textShadow: logCount > 0 ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
                }}
              >
                {format(date, 'd')}
              </div>
              {logCount > 0 && (
                <div className={gridClass}>
                  {logs.map((log) => renderLogCell(log, logCount))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // 渲染週視圖
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((date, idx) => {
          const isToday = isSameDay(date, new Date());
          const logs = getLogsForDate(date);
          const logCount = logs.length;

          return (
            <div key={idx} className="flex flex-col">
              <button
                onClick={() => handleDateClick(date)}
                className={`
                  rounded-xl border-2 transition-all relative overflow-hidden mb-2
                  ${isToday ? 'border-deep-teal bg-deep-teal/10' : 'border-dashed border-moss-green/30'}
                  hover:border-deep-teal cursor-pointer p-3
                `}
                style={{
                  backgroundImage: logCount === 0 ? `url("${cardTexture}")` : undefined,
                  backgroundSize: 'cover',
                }}
              >
                <div className="text-center mb-2">
                  <div className={`text-xs font-semibold ${isToday ? 'text-deep-teal' : 'text-ink-light'}`}>
                    {format(date, 'EEE', { locale: zhTW })}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-deep-teal' : 'text-ink-dark'}`}>
                    {format(date, 'd')}
                  </div>
                </div>
                {logCount > 0 && (
                  <div className="text-xs text-center text-ink-dark font-semibold">
                    {logCount} 餐
                  </div>
                )}
              </button>
              <div className="space-y-2 min-h-[200px]">
                {logs.map((log) => {
                  const mealConfig = getMealConfig(log);
                  const displayTitle = log.title || log.recipeTitle || "未命名";
                  return (
                    <div
                      key={log.id}
                      onClick={() => handleDateClick(date)}
                      className="p-3 rounded-lg border-2 border-dashed border-moss-green/30 cursor-pointer hover:border-deep-teal transition-all"
                      style={{
                        backgroundImage: log.image ? `url(${log.image})` : undefined,
                        backgroundColor: log.image ? undefined : mealConfig.color + '40',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="text-sm font-bold text-ink-dark line-clamp-2 mb-1">
                        {displayTitle}
                      </div>
                      {log.mealType && (
                        <div className="text-xs text-ink-light">
                          {mealTypeConfig[log.mealType]?.icon} {['breakfast', 'lunch', 'snack', 'dinner'].find(m => m === log.mealType) === 'breakfast' ? '早餐' : 
                           ['breakfast', 'lunch', 'snack', 'dinner'].find(m => m === log.mealType) === 'lunch' ? '午餐' :
                           ['breakfast', 'lunch', 'snack', 'dinner'].find(m => m === log.mealType) === 'snack' ? '下午茶' : '晚餐'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染年視圖
  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {months.map((month, monthIdx) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
          const firstDayOfWeek = getDay(monthStart);
          const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => {
            const date = new Date(monthStart);
            date.setDate(date.getDate() - (firstDayOfWeek - i));
            return date;
          });
          const lastDayOfWeek = getDay(monthEnd);
          const daysAfterMonth = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => {
            const date = new Date(monthEnd);
            date.setDate(date.getDate() + i + 1);
            return date;
          });
          const allDays = [...daysBeforeMonth, ...daysInMonth, ...daysAfterMonth];

          return (
            <div key={monthIdx} className="p-3 rounded-xl border-2 border-dashed border-moss-green/30 bg-white/50">
              <div className="text-center font-bold text-sm text-ink-dark mb-2">
                {format(month, 'M月', { locale: zhTW })}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
                  <div key={idx} className="text-[8px] text-center text-ink-light font-semibold">
                    {day}
                  </div>
                ))}
                {allDays.map((date, dayIdx) => {
                  const isCurrentMonth = isSameMonth(date, month);
                  const mealCount = isCurrentMonth ? getMealCountForDate(date) : 0;
                  
                  return (
                    <button
                      key={dayIdx}
                      onClick={() => isCurrentMonth && handleDateClick(date)}
                      className={`
                        aspect-square text-[10px] rounded transition-all
                        ${isCurrentMonth ? 'cursor-pointer hover:ring-2 hover:ring-deep-teal' : 'opacity-30 cursor-default'}
                        ${mealCount > 0 ? 'bg-mustard-yellow text-ink-dark font-bold' : 'bg-paper-warm'}
                      `}
                      disabled={!isCurrentMonth}
                    >
                      {isCurrentMonth && mealCount > 0 ? (
                        <span className="text-xs">{mealCount}</span>
                      ) : (
                        <span className="text-ink-light/30">{format(date, 'd')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 取得標題文字
  const getTitleText = () => {
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      return format(weekStart, 'yyyy 年 M 月 d 日', { locale: zhTW }) + ' 週';
    } else if (viewMode === "month") {
      return format(currentDate, 'yyyy 年 M 月', { locale: zhTW });
    } else {
      return format(currentDate, 'yyyy 年', { locale: zhTW });
    }
  };

  return (
    <div className="min-h-screen bg-paper-warm-cream" style={{ fontFamily: 'var(--font-zen), sans-serif' }}>
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-dashed border-moss-green/30 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-dark tracking-wide flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8" />
              飲食日記 📅
            </h1>
            <button
              onClick={() => router.push('/')}
              className="p-2 sm:p-3 rounded-full bg-deep-teal text-white hover:bg-moss-green transition-all shadow-lg shadow-moss-green/30 hover:scale-105 active:scale-100"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 視圖切換器 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {(['week', 'month', 'year'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all tracking-wide ${
                viewMode === mode
                  ? 'bg-deep-teal text-white border-2 border-deep-teal'
                  : 'bg-white text-ink-dark border-2 border-dashed border-moss-green/30 hover:border-deep-teal'
              }`}
              style={viewMode !== mode ? {
                backgroundImage: `url("${cardTexture}")`,
                backgroundSize: 'cover',
              } : {}}
            >
              {mode === 'week' ? '週' : mode === 'month' ? '月' : '年'}
            </button>
          ))}
        </div>

        {/* 日期導覽 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToPrevious}
            className="px-4 py-2 rounded-xl bg-white border-2 border-dashed border-moss-green/30 hover:border-deep-teal text-ink-dark font-semibold transition-all tracking-wide"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            ← {viewMode === 'week' ? '上週' : viewMode === 'month' ? '上個月' : '去年'}
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-ink-dark tracking-wide">
            {getTitleText()}
          </h2>
          <button
            onClick={goToNext}
            className="px-4 py-2 rounded-xl bg-white border-2 border-dashed border-moss-green/30 hover:border-deep-teal text-ink-dark font-semibold transition-all tracking-wide"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            {viewMode === 'week' ? '下週' : viewMode === 'month' ? '下個月' : '明年'} →
          </button>
        </div>

        {/* 視圖內容 */}
        <div
          className="rounded-[2rem] border-2 border-dashed border-moss-green/30 p-4 sm:p-6 bg-white shadow-lg shadow-moss-green/20 mb-6"
          style={{
            backgroundImage: `url("${cardTexture}")`,
            backgroundSize: 'cover',
          }}
        >
          {viewMode === "week" && (
            <>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
                  <div key={idx} className="text-center font-bold text-ink-dark text-sm sm:text-base py-2">
                    {day}
                  </div>
                ))}
              </div>
              {renderWeekView()}
            </>
          )}
          {viewMode === "month" && (
            <>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
                  <div key={idx} className="text-center font-bold text-ink-dark text-sm sm:text-base py-2">
                    {day}
                  </div>
                ))}
              </div>
              {renderMonthView()}
            </>
          )}
          {viewMode === "year" && renderYearView()}
        </div>

        {/* 營養統計圖表 */}
        {nutritionStats.length > 0 && (
          <div
            className="rounded-[2rem] border-2 border-dashed border-moss-green/30 p-6 bg-white shadow-lg shadow-moss-green/20 mb-6"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            <h3 className="text-xl font-bold text-ink-dark mb-4 tracking-wide">
              📊 營養統計
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nutritionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#A5A58D" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B705C"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6B705C"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#F9F6E8',
                    border: '2px dashed #6B705C',
                    borderRadius: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3E5C64"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 空狀態提示 */}
        {eatingLogs.length === 0 && (
          <div
            className="rounded-[2rem] border-2 border-dashed border-moss-green/30 p-8 text-center bg-white shadow-lg shadow-moss-green/20"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            <div className="text-4xl mb-4">📅</div>
            <p className="text-ink-dark text-lg font-sans">
              還沒有任何飲食紀錄
            </p>
            <p className="text-ink-light text-sm mt-2 font-sans">
              回到首頁生成食譜並記錄吧！
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-3 bg-deep-teal text-white rounded-2xl font-bold hover:bg-moss-green transition-all shadow-lg shadow-moss-green/30 hover:scale-105 active:scale-100 tracking-wide"
            >
              前往首頁
            </button>
          </div>
        )}
      </main>

      {/* 底部導覽列（FAB） */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={() => router.push('/')}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-deep-teal text-white shadow-lg shadow-moss-green/30 hover:bg-moss-green transition-all hover:scale-110 active:scale-100 flex items-center justify-center"
        >
          <Home className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Day View Modal */}
      {selectedDate && (
        <DayViewModal
          isOpen={isDayViewModalOpen}
          onClose={() => {
            setIsDayViewModalOpen(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
