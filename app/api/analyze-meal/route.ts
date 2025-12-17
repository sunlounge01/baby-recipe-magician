import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ============================================
// 開關設定：改這裡控制是否使用 Mock 資料
// ============================================
const USE_MOCK_DATA = false;

// ============================================
// 資料結構定義
// ============================================
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

interface AnalyzeMealRequest {
  mealName: string;
  language?: string;
}

interface AnalyzeMealResponse {
  nutrition: NutritionInfo;
}

// ============================================
// Mock Data 生成函數
// ============================================
function getMockNutritionData(mealName: string, language: "zh" | "en"): NutritionInfo {
  const tr = (zh: string, en: string) => (language === "en" ? en : zh);
  // 根據菜名簡單判斷，回傳假資料
  const name = mealName.toLowerCase();
  
  // 預設值
  let mockData: NutritionInfo = {
    calories: 300,
    tags: [tr("營養均衡", "Balanced")],
    benefit: tr("這是一道營養均衡的餐點。", "A balanced meal for demo."),
    macros: {
      protein: "15g",
      carbs: "40g",
      fat: "10g"
    },
    micronutrients: {
      calcium: "100mg",
      iron: "2.0mg",
      vitamin_c: "20mg"
    }
  };

  // 根據關鍵字調整
  if (name.includes("粥") || name.includes("飯")) {
    mockData = {
      calories: 250,
      tags: [tr("碳水化合物", "Carbs"), tr("易消化", "Easy to digest")],
      benefit: tr("富含碳水化合物，提供寶寶成長所需的能量。", "Rich in carbs to fuel growth."),
      macros: {
        protein: "8g",
        carbs: "45g",
        fat: "5g"
      },
      micronutrients: {
        calcium: "50mg",
        iron: "1.5mg",
        vitamin_c: "5mg"
      }
    };
  } else if (name.includes("蛋") || name.includes("雞蛋")) {
    mockData = {
      calories: 180,
      tags: [tr("優質蛋白", "High-quality protein"), tr("高營養", "Nutrient-dense")],
      benefit: tr("富含優質蛋白質，有助於寶寶肌肉發展。", "Rich in protein to support muscles."),
      macros: {
        protein: "12g",
        carbs: "2g",
        fat: "14g"
      },
      micronutrients: {
        calcium: "50mg",
        iron: "1.8mg",
        vitamin_c: "0mg"
      }
    };
  } else if (name.includes("肉") || name.includes("雞") || name.includes("魚")) {
    mockData = {
      calories: 350,
      tags: [tr("高蛋白", "High protein"), tr("鐵質", "Iron-rich")],
      benefit: tr("富含蛋白質和鐵質，有助於寶寶成長發育。", "High protein and iron for growth."),
      macros: {
        protein: "25g",
        carbs: "5g",
        fat: "20g"
      },
      micronutrients: {
        calcium: "30mg",
        iron: "3.5mg",
        vitamin_c: "0mg"
      }
    };
  } else if (name.includes("菜") || name.includes("蔬菜")) {
    mockData = {
      calories: 80,
      tags: [tr("維生素", "Vitamins"), tr("纖維質", "Fiber")],
      benefit: tr("富含維生素和纖維質，有助於消化和免疫力。", "Rich in vitamins and fiber for digestion and immunity."),
      macros: {
        protein: "3g",
        carbs: "15g",
        fat: "2g"
      },
      micronutrients: {
        calcium: "60mg",
        iron: "1.2mg",
        vitamin_c: "45mg"
      }
    };
  }

  return mockData;
}

// ============================================
// API Route Handler
// ============================================
export async function POST(request: NextRequest) {
  let mealName = "未知餐點";
  let language: "zh" | "en" = "zh";
  
  try {
    const body: AnalyzeMealRequest = await request.json();
    mealName = body.mealName || "未知餐點";
    language = body.language === "en" ? "en" : "zh";

    if (!mealName || typeof mealName !== 'string' || mealName.trim() === '') {
      return NextResponse.json(
        { error: language === "en" ? "Please provide a valid meal name" : "請提供有效的菜名" },
        { status: 400 }
      );
    }

    // Mock 模式
    if (USE_MOCK_DATA) {
      const mockNutrition = getMockNutritionData(mealName.trim(), language);
      return NextResponse.json({
        nutrition: mockNutrition
      } as AnalyzeMealResponse);
    }

    // 檢查 API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ 警告: OPENAI_API_KEY 未設定，降級使用 Mock 資料');
      const mockNutrition = getMockNutritionData(mealName.trim(), language);
      return NextResponse.json({
        nutrition: mockNutrition
      } as AnalyzeMealResponse);
    }

    // 初始化 OpenAI 客戶端
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // 根據語言設定不同的 Prompt（僅 zh/en）
    let systemPrompt = "";
    let userPrompt = "";
    
    if (language === "en") {
      systemPrompt = `Analyze the nutrition of the following food. Return the food name and nutrients in English. Output JSON only:
{
  "calories": number (kcal),
  "tags": ["tag1","tag2","tag3"],
  "benefit": "one line",
  "macros": { "protein": "Xg", "carbs": "Xg", "fat": "Xg" },
  "micronutrients": { "calcium": "Xmg", "iron": "Xmg", "vitamin_c": "Xmg" }
}
Use metric units. Values should be toddler portions (~1/3 to 1/2 adult).`;
      userPrompt = `Analyze the nutrition of: ${mealName.trim()}. Output language: English.`;
    } else {
      systemPrompt = `你是一位專業的營養師，請分析以下食物的營養，回傳繁體中文 JSON：
{
  "calories": 數字（kcal），
  "tags": ["標籤1","標籤2","標籤3"],
  "benefit": "一句話說明",
  "macros": { "protein": "Xg", "carbs": "Xg", "fat": "Xg" },
  "micronutrients": { "calcium": "Xmg", "iron": "Xmg", "vitamin_c": "Xmg" }
}
份量為幼兒份（約 1/3~1/2 成人），請帶單位，只回傳 JSON。`;
      userPrompt = `請分析以下食物的營養成分：${mealName.trim()}`;
    }

    // 呼叫 OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI 回傳空內容");
    }

    // 解析 JSON
    let nutritionData: NutritionInfo;
    try {
      const parsed = JSON.parse(content);
      nutritionData = parsed;
    } catch (parseError) {
      console.error("解析 OpenAI 回傳失敗，使用 Mock 資料:", parseError);
      nutritionData = getMockNutritionData(mealName.trim(), language);
    }

    // 驗證資料結構
    if (!nutritionData.calories || !nutritionData.macros) {
      console.warn("OpenAI 回傳資料不完整，使用 Mock 資料");
      nutritionData = getMockNutritionData(mealName.trim(), language);
    }

    return NextResponse.json({
      nutrition: nutritionData
    } as AnalyzeMealResponse);

  } catch (error) {
    console.error(language === "en" ? "Nutrition analysis failed:" : "分析營養失敗:", error);
    
    // 錯誤時回傳 Mock 資料
    const mockNutrition = getMockNutritionData(mealName, language);
    
    return NextResponse.json({
      nutrition: mockNutrition
    } as AnalyzeMealResponse, { status: 200 });
  }
}
