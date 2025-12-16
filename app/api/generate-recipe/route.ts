import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// 定義回傳的 JSON 格式
interface RecipeResponse {
  title: string;
  ingredients: string[];
  steps: string[];
  nutrition: string;
  searchKeywords: string;
}

// 根據模式產生不同的 Mock 資料
function getMockRecipeData(mode: string, userIngredients: string): RecipeResponse {
  switch (mode) {
    case "strict":
      // Mode A: 快速料理，只使用輸入食材
      return {
        title: "清炒時蔬 (測試版)",
        ingredients: userIngredients ? userIngredients.split(/[、,，]/).map(i => i.trim()).filter(i => i) : ["高麗菜 100g", "紅蘿蔔 50g"],
        steps: [
          "將所有蔬菜洗淨切絲。",
          "熱鍋下少許油，放入蔬菜快炒。",
          "炒至蔬菜軟化即可起鍋。",
        ],
        nutrition: "快速上桌，保留蔬菜原味！",
        searchKeywords: "清炒時蔬 幼兒食譜",
      };
    
    case "creative":
      // Mode B: 豐富料理，加入常見佐料
      const baseIngredients = userIngredients ? userIngredients.split(/[、,，]/).map(i => i.trim()).filter(i => i) : ["高麗菜 100g"];
      return {
        title: "什錦烘蛋 (測試版)",
        ingredients: [...baseIngredients, "雞蛋 2顆", "起司絲 20g", "蔥花 少許"],
        steps: [
          "將蔬菜切碎備用。",
          "雞蛋打散，加入蔬菜和起司絲拌勻。",
          "熱鍋下油，倒入蛋液，小火烘至兩面金黃即可。",
        ],
        nutrition: "營養均衡，富含蛋白質與鈣質！",
        searchKeywords: "什錦烘蛋 幼兒食譜",
      };
    
    case "shopping":
      // Mode C: 豪華料理，列出所有需要的食材
      return {
        title: "南瓜燉飯 (測試版)",
        ingredients: [
          "南瓜 200g",
          "白米 100g",
          "雞胸肉 50g",
          "洋蔥 1/4 顆",
          "高湯 200ml",
          "起司粉 少許",
        ],
        steps: [
          "南瓜去皮切塊，雞胸肉切丁，洋蔥切碎。",
          "白米洗淨，與所有食材一起放入電鍋。",
          "加入高湯，外鍋加一杯水，按下開關。",
          "蒸熟後拌入起司粉即可。",
          "記得去買齊以上材料喔！",
        ],
        nutrition: "營養豐富，適合成長中的寶寶！",
        searchKeywords: "南瓜燉飯 幼兒食譜",
      };
    
    default:
      // 預設回傳 creative 模式
      return getMockRecipeData("creative", userIngredients);
  }
}

// 驗證是否為有效食材的關鍵字列表
const invalidKeywords = [
  "輪胎", "輪子", "汽車", "機車", "塑膠", "金屬", "石頭", "木頭",
  "垃圾", "廢棄物", "毒藥", "化學", "電池", "電線", "螺絲", "釘子"
];

function containsInvalidKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return invalidKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

export async function POST(request: NextRequest) {
  let body: any = {};
  let mode = "strict";
  let ingredients = "";
  let toolValue = "any";
  
  try {
    // 讀取請求資料
    body = await request.json();
    console.log('API收到請求:', body);
    
    const { ingredients: userIngredients, mode: userMode, tool } = body;
    ingredients = userIngredients || "";
    mode = userMode || "strict";
    toolValue = tool || "any";

    // 驗證必要參數
    if (!ingredients || typeof ingredients !== "string" || ingredients.trim().length === 0) {
      console.log('錯誤: 缺少食材資訊');
      return NextResponse.json(
        { 
          error: "請提供食材資訊",
          title: "無法生成食譜",
          ingredients: [],
          steps: [],
          nutrition: "請輸入食材",
          searchKeywords: ""
        },
        { status: 400 }
      );
    }

    // 防呆機制：檢查是否包含無效關鍵字
    if (containsInvalidKeywords(ingredients)) {
      console.log('警告: 包含無效關鍵字');
      return NextResponse.json(
        {
          error: "這好像不能吃喔，請輸入真正的食材。",
          title: "無法生成食譜",
          ingredients: [],
          steps: [],
          nutrition: "請輸入可食用的食材",
          searchKeywords: ""
        },
        { status: 200 }
      );
    }

    // 檢查 API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ 警告: OPENAI_API_KEY 未設定，使用 Mock 資料');
      // 根據模式回傳對應的 Mock 資料
      const mockData = getMockRecipeData(mode || "strict", ingredients);
      return NextResponse.json(mockData, { status: 200 });
    }

    // 初始化 OpenAI 客戶端
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // 根據模式設定不同的 prompt
    let modeInstruction = "";
    switch (mode) {
      case "strict":
        modeInstruction = "嚴格限制：只能使用使用者提供的食材，不能添加任何其他食材或佐料。如果食材不足，請提供最簡單的料理方式。強調快速上桌。";
        break;
      case "creative":
        modeInstruction = "必須包含使用者提供的所有食材，可以添加少量常見的佐料（如雞蛋、起司、蔥花等）來增加營養和風味。強調營養均衡。";
        break;
      case "shopping":
        modeInstruction = "使用者提供的食材只是靈感來源，請設計一個完整的幼兒食譜，並列出完整的採買清單（包含所有需要的食材和份量）。在步驟最後提醒使用者記得採買。";
        break;
      default:
        modeInstruction = "必須包含使用者提供的食材。";
    }

    // 烹飪工具說明
    const toolInstruction = toolValue && toolValue !== "any" 
      ? `請使用 ${toolValue === "rice-cooker" ? "電鍋" : toolValue === "pan" ? "平底鍋" : toolValue === "pot" ? "燉鍋" : "烤箱"} 來製作這道料理。`
      : "可以使用任何常見的烹飪工具。";

    // 構建完整的 prompt
    const systemPrompt = `你是一位專業的台灣幼兒營養師，專精於為 6 個月到 3 歲的寶寶設計營養均衡、安全易做的副食品和幼兒餐點。

你的任務是根據使用者提供的食材和需求，設計一道適合幼兒的食譜。

重要規則：
1. 所有食材必須適合幼兒食用，避免過敏原和危險食材
2. 料理方式必須簡單安全，適合忙碌的家長
3. 營養要均衡，包含蛋白質、蔬菜、碳水化合物
4. 份量要適合幼兒，避免過多或過少
5. ${modeInstruction}
6. ${toolInstruction}

請以 JSON 格式回傳，格式必須嚴格遵守以下結構：
{
  "title": "食譜名稱（例如：寶寶版吻仔魚蒸蛋）",
  "ingredients": ["食材1 份量", "食材2 份量", ...],
  "steps": ["步驟1", "步驟2", "步驟3"],
  "nutrition": "一句話營養亮點（例如：高鈣、優質蛋白）",
  "searchKeywords": "用於 YouTube 和 Google 搜尋的關鍵字（例如：吻仔魚蒸蛋 幼兒食譜 教學）。請包含食譜名稱、主要食材和「幼兒食譜」或「副食品」等關鍵字，讓使用者能輕鬆找到相關的教學影片。"
}

請確保回傳的是有效的 JSON 格式，不要包含任何額外的文字或說明。`;

    const userPrompt = `請為我設計一道幼兒食譜。

使用者提供的食材：${ingredients}

請根據上述規則設計食譜，並以 JSON 格式回傳。`;

    console.log('開始呼叫 OpenAI API...');

    // 呼叫 OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    console.log('OpenAI API 回應成功');

    // 解析回應
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI 沒有回傳內容");
    }

    // 嘗試解析 JSON
    let recipeData: RecipeResponse;
    try {
      recipeData = JSON.parse(content);
      console.log('成功解析 JSON:', recipeData);
    } catch (parseError) {
      console.error('JSON 解析失敗，嘗試提取:', parseError);
      // 如果解析失敗，嘗試提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("無法解析 OpenAI 回傳的 JSON");
      }
    }

    // 驗證必要欄位
    if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
      throw new Error("OpenAI 回傳的資料格式不完整");
    }

    // 確保所有欄位都存在
    const response: RecipeResponse = {
      title: recipeData.title || "幼兒食譜",
      ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
      steps: Array.isArray(recipeData.steps) ? recipeData.steps : [],
      nutrition: recipeData.nutrition || "營養均衡",
      searchKeywords: recipeData.searchKeywords || recipeData.title,
    };

    console.log('回傳食譜資料:', response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // 攔截所有錯誤（包括 429 Quota Exceeded、網路錯誤等）
    console.error("生成食譜時發生錯誤，使用 Mock 資料備援:", error);
    
    // 檢查是否為 429 Quota Exceeded 錯誤
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        console.warn('⚠️ 偵測到 API 額度用盡 (429)，使用 Mock 資料');
      } else {
        console.warn('⚠️ OpenAI API 發生錯誤，使用 Mock 資料備援:', error.message);
      }
    } else {
      console.warn('⚠️ 發生未知錯誤，使用 Mock 資料備援');
    }
    
    // 回傳完美的假食譜 JSON，讓前端可以正常測試 UI
    // 根據模式回傳對應的 Mock 資料
    // 使用 200 狀態碼，這樣前端不會認為是錯誤
    const mockData = getMockRecipeData(mode, ingredients);
    return NextResponse.json(mockData, { status: 200 });
  }
}
