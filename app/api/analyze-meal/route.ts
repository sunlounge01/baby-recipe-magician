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
function getMockNutritionData(mealName: string): NutritionInfo {
  // 根據菜名簡單判斷，回傳假資料
  const name = mealName.toLowerCase();
  
  // 預設值
  let mockData: NutritionInfo = {
    calories: 300,
    tags: ["營養均衡"],
    benefit: "這是一道營養均衡的餐點。",
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
      tags: ["碳水化合物", "易消化"],
      benefit: "富含碳水化合物，提供寶寶成長所需的能量。",
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
      tags: ["優質蛋白", "高營養"],
      benefit: "富含優質蛋白質，有助於寶寶肌肉發展。",
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
      tags: ["高蛋白", "鐵質"],
      benefit: "富含蛋白質和鐵質，有助於寶寶成長發育。",
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
      tags: ["維生素", "纖維質"],
      benefit: "富含維生素和纖維質，有助於消化和免疫力。",
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
  let language = "zh";
  
  try {
    const body: AnalyzeMealRequest = await request.json();
    mealName = body.mealName || "未知餐點";
    language = body.language || "zh";

    if (!mealName || typeof mealName !== 'string' || mealName.trim() === '') {
      return NextResponse.json(
        { error: "請提供有效的菜名" },
        { status: 400 }
      );
    }

    // Mock 模式
    if (USE_MOCK_DATA) {
      const mockNutrition = getMockNutritionData(mealName.trim());
      return NextResponse.json({
        nutrition: mockNutrition
      } as AnalyzeMealResponse);
    }

    // 檢查 API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ 警告: OPENAI_API_KEY 未設定，降級使用 Mock 資料');
      const mockNutrition = getMockNutritionData(mealName.trim());
      return NextResponse.json({
        nutrition: mockNutrition
      } as AnalyzeMealResponse);
    }

    // 初始化 OpenAI 客戶端
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // 根據語言設定不同的 Prompt
    let systemPrompt = "";
    let userPrompt = "";
    
    switch (language) {
      case "en":
        systemPrompt = `You are a professional nutritionist specializing in toddler nutrition analysis. Please estimate the nutritional content of the food based on the provided meal name.

Please return in JSON format, strictly following this structure:
{
  "calories": number (unit: kcal),
  "tags": ["tag1", "tag2", "tag3"] (max 3 key nutrition tags),
  "benefit": "One sentence describing the nutritional benefits of this dish",
  "macros": {
    "protein": "numberg" (protein, unit: g),
    "carbs": "numberg" (carbohydrates, unit: g),
    "fat": "numberg" (fat, unit: g)
  },
  "micronutrients": {
    "calcium": "numbermg" (calcium, unit: mg),
    "iron": "numbermg" (iron, unit: mg),
    "vitamin_c": "numbermg" (vitamin C, unit: mg)
  }
}

Please ensure:
1. Values are reasonable, matching typical toddler meal portions (about 1/3 to 1/2 adult portion)
2. All values include units
3. Return valid JSON format only, no additional text or explanations`;

        userPrompt = `Please estimate the nutritional content of the following food: ${mealName.trim()}`;
        break;
      case "ja":
        systemPrompt = `あなたは幼児栄養分析に特化した専門の栄養士です。提供された料理名に基づいて、その食品の栄養成分を推定してください。

JSON形式で返してください。以下の構造を厳密に守ってください：
{
  "calories": 数字（単位：kcal）、
  "tags": ["タグ1", "タグ2", "タグ3"]（最大3つの主要栄養タグ）、
  "benefit": "この料理の栄養上の利点を説明する一文",
  "macros": {
    "protein": "数字g"（タンパク質、単位：g）、
    "carbs": "数字g"（炭水化物、単位：g）、
    "fat": "数字g"（脂肪、単位：g）
  },
  "micronutrients": {
    "calcium": "数字mg"（カルシウム、単位：mg）、
    "iron": "数字mg"（鉄分、単位：mg）、
    "vitamin_c": "数字mg"（ビタミンC、単位：mg）
  }
}

確認事項：
1. 数値は合理的で、一般的な幼児食の分量（成人の約1/3から1/2）に適合すること
2. すべての数値に単位を含めること
3. 有効なJSON形式のみを返し、追加のテキストや説明を含めないこと`;

        userPrompt = `以下の食品の栄養成分を推定してください：${mealName.trim()}`;
        break;
      case "ko":
        systemPrompt = `당신은 유아 영양 분석에 전문적인 영양사입니다. 제공된 음식 이름을 기반으로 해당 음식의 영양 성분을 추정하세요.

JSON 형식으로 반환하세요. 다음 구조를 엄격히 따르세요:
{
  "calories": 숫자 (단위: kcal),
  "tags": ["태그1", "태그2", "태그3"] (최대 3개의 주요 영양 태그),
  "benefit": "이 요리의 영양상 이점을 설명하는 한 문장",
  "macros": {
    "protein": "숫자g" (단백질, 단위: g),
    "carbs": "숫자g" (탄수화물, 단위: g),
    "fat": "숫자g" (지방, 단위: g)
  },
  "micronutrients": {
    "calcium": "숫자mg" (칼슘, 단위: mg),
    "iron": "숫자mg" (철분, 단위: mg),
    "vitamin_c": "숫자mg" (비타민C, 단위: mg)
  }
}

확인 사항:
1. 값이 합리적이며 일반적인 유아식 분량(성인 분량의 약 1/3~1/2)에 맞아야 함
2. 모든 값에 단위 포함
3. 유효한 JSON 형식만 반환하고 추가 텍스트나 설명 포함하지 않음`;

        userPrompt = `다음 음식의 영양 성분을 추정하세요: ${mealName.trim()}`;
        break;
      default: // zh
        systemPrompt = `你是一位專業的營養師，專精於幼兒營養分析。請根據提供的菜名，估算該食物的營養成分。

請以 JSON 格式回傳，格式必須嚴格遵守以下結構：
{
  "calories": 數字（單位：kcal），
  "tags": ["標籤1", "標籤2", "標籤3"]（最多3個重點營養標籤），
  "benefit": "一句話說明這道菜的營養好處",
  "macros": {
    "protein": "數字g"（蛋白質，單位：g），
    "carbs": "數字g"（碳水化合物，單位：g），
    "fat": "數字g"（脂肪，單位：g）
  },
  "micronutrients": {
    "calcium": "數字mg"（鈣質，單位：mg），
    "iron": "數字mg"（鐵質，單位：mg），
    "vitamin_c": "數字mg"（維生素C，單位：mg）
  }
}

請確保：
1. 數值要合理，符合一般幼兒餐點的份量（約 1/3 到 1/2 成人份）
2. 所有數值都要帶單位
3. 回傳的是有效的 JSON 格式，不要包含任何額外的文字或說明`;

        userPrompt = `請估算以下食物的營養成分：${mealName.trim()}`;
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
      nutritionData = getMockNutritionData(mealName.trim());
    }

    // 驗證資料結構
    if (!nutritionData.calories || !nutritionData.macros) {
      console.warn("OpenAI 回傳資料不完整，使用 Mock 資料");
      nutritionData = getMockNutritionData(mealName.trim());
    }

    return NextResponse.json({
      nutrition: nutritionData
    } as AnalyzeMealResponse);

  } catch (error) {
    console.error("分析營養失敗:", error);
    
    // 錯誤時回傳 Mock 資料
    const mockNutrition = getMockNutritionData(mealName);
    
    return NextResponse.json({
      nutrition: mockNutrition
    } as AnalyzeMealResponse, { status: 200 });
  }
}
