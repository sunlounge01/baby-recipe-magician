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
    calcium: string; // 例如 "120mg"
    iron: string; // 例如 "2.5mg"
    vitamin_c: string; // 例如 "30mg"
  };
}

interface IngredientItem {
  name: string;
  amount: string;
}

interface AdultsMenuOption {
  title: string;
  desc: string;
  steps: string[];
}

interface AdultsMenu {
  parallel: AdultsMenuOption;
  remix: AdultsMenuOption;
}

interface Recipe {
  style: "中式" | "西式" | "日式";
  title: string;
  ingredients: IngredientItem[];
  nutrition: NutritionInfo;
  serving_info: string;
  steps: string[];
  time: string;
  adults_menu: AdultsMenu;
  searchKeywords: string;
}

interface RecipeResponse {
  recipes: Recipe[];
}

// ============================================
// Mock Data 生成函數
// ============================================
function getMockRecipeData(mode: string, userIngredients: string): RecipeResponse {
  const baseIngredients = userIngredients ? userIngredients.split(/[、,，]/).map(i => i.trim()).filter(i => i) : ["高麗菜", "紅蘿蔔"];
  
  // 根據模式生成 3 道不同風格的食譜
  const recipes: Recipe[] = [
    {
      style: "中式",
      title: "寶寶版清炒時蔬",
      ingredients: baseIngredients.map(ing => ({ name: ing, amount: "50g" })),
      nutrition: {
        calories: 120,
        tags: ["維生素C", "纖維質", "低熱量"],
        benefit: "快速上桌，保留蔬菜原味！富含維生素C，有助於增強免疫力。",
        macros: {
          protein: "3g",
          carbs: "20g",
          fat: "5g"
        },
        micronutrients: {
          calcium: "45mg",
          iron: "1.2mg",
          vitamin_c: "35mg"
        }
      },
      serving_info: "約 1 碗 (相當於 1/3 成人份)",
      steps: [
        "將所有蔬菜洗淨切絲。",
        "熱鍋下少許油，放入蔬菜快炒。",
        "炒至蔬菜軟化即可起鍋。",
      ],
      time: "15 分鐘",
      adults_menu: {
        parallel: {
          title: "大人版：宮保時蔬",
          desc: "利用相同的蔬菜，加入乾辣椒、花椒、醬油等調味，做成重口味的宮保風味。",
          steps: [
            "蔬菜切段，乾辣椒剪段備用。",
            "熱鍋下油，爆香乾辣椒和花椒。",
            "放入蔬菜大火快炒，加入醬油、糖調味。",
            "起鍋前撒上花生米即可。"
          ]
        },
        remix: {
          title: "加工版：時蔬炒蛋",
          desc: "將寶寶的清炒時蔬加入雞蛋和蔥花，做成更豐富的炒蛋料理。",
          steps: [
            "將做好的清炒時蔬盛起備用。",
            "雞蛋打散，加入蔥花。",
            "熱鍋下油，倒入蛋液炒至半熟。",
            "加入清炒時蔬一起炒勻即可。"
          ]
        }
      },
      searchKeywords: "清炒時蔬 幼兒食譜 中式",
    },
    {
      style: "西式",
      title: "什錦烘蛋",
      ingredients: [
        ...baseIngredients.map(ing => ({ name: ing, amount: "30g" })),
        { name: "雞蛋", amount: "2顆" },
        { name: "起司絲", amount: "20g" },
        { name: "蔥花", amount: "少許" }
      ],
      nutrition: {
        calories: 280,
        tags: ["蛋白質", "鈣質", "維生素A"],
        benefit: "營養均衡，富含優質蛋白質與鈣質，有助於寶寶骨骼發育！",
        macros: {
          protein: "18g",
          carbs: "12g",
          fat: "18g"
        },
        micronutrients: {
          calcium: "180mg",
          iron: "2.8mg",
          vitamin_c: "15mg"
        }
      },
      serving_info: "約 1 份 (相當於 1/2 成人份)",
      steps: [
        "將蔬菜切碎備用。",
        "雞蛋打散，加入蔬菜和起司絲拌勻。",
        "熱鍋下油，倒入蛋液，小火烘至兩面金黃即可。",
      ],
      time: "20 分鐘",
      adults_menu: {
        parallel: {
          title: "大人版：西班牙烘蛋",
          desc: "使用相同食材，但加入馬鈴薯、洋蔥，做成更豐盛的西班牙烘蛋。",
          steps: [
            "馬鈴薯切片，洋蔥切絲，用油炒軟。",
            "雞蛋打散，加入炒好的蔬菜和起司。",
            "平底鍋下油，倒入蛋液，小火慢煎。",
            "翻面煎至兩面金黃，撒上黑胡椒即可。"
          ]
        },
        remix: {
          title: "加工版：烘蛋三明治",
          desc: "將做好的烘蛋夾入吐司，加入生菜和番茄，做成營養三明治。",
          steps: [
            "將烘蛋切成適合大小。",
            "吐司烤至微焦。",
            "依序放入生菜、烘蛋、番茄片。",
            "對半切開即可享用。"
          ]
        }
      },
      searchKeywords: "什錦烘蛋 幼兒食譜 西式",
    },
    {
      style: "日式",
      title: "南瓜雞肉粥",
      ingredients: [
        { name: "南瓜", amount: "100g" },
        { name: "雞胸肉", amount: "50g" },
        { name: "白米", amount: "50g" },
        { name: "高湯", amount: "200ml" }
      ],
      nutrition: {
        calories: 200,
        tags: ["β-胡蘿蔔素", "優質蛋白", "碳水化合物"],
        benefit: "營養豐富，適合成長中的寶寶！南瓜含有豐富的β-胡蘿蔔素，有助於視力發育！",
        macros: {
          protein: "15g",
          carbs: "30g",
          fat: "8g"
        }
      },
      serving_info: "約 1 碗 (相當於 1/3 成人份)",
      steps: [
        "南瓜去皮切塊，雞胸肉切丁。",
        "白米洗淨，與所有食材一起放入電鍋。",
        "加入高湯，外鍋加一杯水，按下開關。",
        "蒸熟後用湯匙壓成泥狀即可。",
      ],
      time: "40 分鐘",
      adults_menu: {
        parallel: {
          title: "大人版：南瓜雞肉咖哩",
          desc: "使用相同的南瓜和雞肉，但做成日式咖哩風味，更適合大人口味。",
          steps: [
            "南瓜和雞肉切塊，洋蔥切絲。",
            "熱鍋下油，炒香洋蔥和雞肉。",
            "加入南瓜塊，倒入水煮軟。",
            "加入咖哩塊，煮至濃稠即可。"
          ]
        },
        remix: {
          title: "加工版：焗烤南瓜雞肉燉飯",
          desc: "將寶寶的粥底加入起司、黑胡椒，放入烤箱焗烤，做成大人版燉飯。",
          steps: [
            "將做好的南瓜雞肉粥盛入烤盤。",
            "撒上起司絲和黑胡椒。",
            "烤箱預熱 200 度，烤 10 分鐘。",
            "表面金黃即可出爐。"
          ]
        }
      },
      searchKeywords: "南瓜雞肉粥 幼兒食譜 日式",
    }
  ];

  return { recipes };
}

// ============================================
// 驗證函數
// ============================================
const invalidKeywords = [
  "輪胎", "輪子", "汽車", "機車", "塑膠", "金屬", "石頭", "木頭",
  "垃圾", "廢棄物", "毒藥", "化學", "電池", "電線", "螺絲", "釘子"
];

function containsInvalidKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return invalidKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// ============================================
// API Route Handler
// ============================================
export async function POST(request: NextRequest) {
  let body: any = {};
  let mode = "strict";
  let ingredients = "";
  let toolValue = "any";
  let babyAge: string | undefined = undefined;
  let language: "zh" | "en" = "zh";
  
  try {
    // 讀取請求資料
    body = await request.json();
    console.log('API收到請求:', body);
    
    const { ingredients: userIngredients, mode: userMode, tool, age, language: langFromReq } = body;
    ingredients = userIngredients || "";
    mode = userMode || "strict";
    toolValue = tool || "any";
    babyAge = age;
    language = langFromReq === "en" ? "en" : "zh";

    // 驗證必要參數
    if (!ingredients || typeof ingredients !== "string" || ingredients.trim().length === 0) {
      console.log('錯誤: 缺少食材資訊');
      return NextResponse.json(
        { 
          error: "請提供食材資訊",
          recipes: []
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
          recipes: []
        },
        { status: 200 }
      );
    }

    // ============================================
    // 開關邏輯：使用 Mock 資料
    // ============================================
    if (USE_MOCK_DATA) {
      console.log('✅ 使用模擬資料');
      const mockDataZh = getMockRecipeData(mode, ingredients);
      const mockDataEn: RecipeResponse = {
        recipes: mockDataZh.recipes.map((r, idx) => ({
          ...r,
          style: idx === 0 ? "Chinese" as any : idx === 1 ? "Western" as any : "Japanese" as any,
          title: `Mock Recipe ${idx + 1}`,
          ingredients: r.ingredients.map((ing) => ({ name: `Ingredient ${ing.name}`, amount: ing.amount })),
          nutrition: {
            ...r.nutrition,
            tags: ["protein", "fiber"],
            benefit: "Sample nutrition note for demo.",
          },
          serving_info: "About 1 bowl (≈ 1/3 adult serving)",
          steps: r.steps.map((s, i) => `Step ${i + 1}: ${s}`),
          adults_menu: {
            parallel: {
              ...r.adults_menu.parallel,
              title: "Adult Version - Stir Fry",
              desc: "Use same ingredients and season for adults.",
              steps: ["Prep", "Cook", "Serve"],
            },
            remix: {
              ...r.adults_menu.remix,
              title: "Remix - Baked Goodness",
              desc: "Upgrade with cheese and spices.",
              steps: ["Combine", "Bake", "Enjoy"],
            },
          },
          searchKeywords: "toddler recipe demo"
        }))
      };
      const mockData = language === "en" ? mockDataEn : mockDataZh;
      return NextResponse.json(mockData, { status: 200 });
    }

    // ============================================
    // OpenAI 請求邏輯
    // ============================================
    console.log('🔗 使用 OpenAI API');

    // 檢查 API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ 警告: OPENAI_API_KEY 未設定，降級使用 Mock 資料');
      const mockData = getMockRecipeData(mode, ingredients);
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
        modeInstruction = language === "en"
          ? "Strict: only use user-provided ingredients; no extra seasonings. If ingredients are insufficient, propose the simplest method. Emphasize quick serving."
          : "嚴格限制：只能使用使用者提供的食材，不能添加任何其他食材或佐料。如果食材不足，請提供最簡單的料理方式。強調快速上桌。";
        break;
      case "creative":
        modeInstruction = language === "en"
          ? "Must include all user ingredients; may add a few common condiments (egg, cheese, scallion) for balance. Emphasize nutrition."
          : "必須包含使用者提供的所有食材，可以添加少量常見的佐料（如雞蛋、起司、蔥花等）來增加營養和風味。強調營養均衡。";
        break;
      case "shopping":
        modeInstruction = language === "en"
          ? "User ingredients are inspiration; design a complete toddler recipe and provide a full shopping list with amounts. Remind to shop at the end."
          : "使用者提供的食材只是靈感來源，請設計一個完整的幼兒食譜，並列出完整的採買清單（包含所有需要的食材和份量）。在步驟最後提醒使用者記得採買。";
        break;
      default:
        modeInstruction = language === "en" ? "Must include the user-provided ingredients." : "必須包含使用者提供的食材。";
    }

    // 烹飪工具說明
    const toolInstruction = toolValue && toolValue !== "any" 
      ? (language === "en"
          ? `Use ${toolValue === "rice-cooker" ? "a rice cooker" : toolValue === "pan" ? "a pan" : toolValue === "pot" ? "a pot" : "an oven"} to cook.`
          : `請使用 ${toolValue === "rice-cooker" ? "電鍋" : toolValue === "pan" ? "平底鍋" : toolValue === "pot" ? "燉鍋" : "烤箱"} 來製作這道料理。`)
      : (language === "en" ? "Any common cookware is fine." : "可以使用任何常見的烹飪工具。");

    // 份量換算說明
    const servingInstruction = babyAge 
      ? (language === "en"
          ? `Based on baby age ${babyAge}, use these conversions:
- Age 1-2: ~1/3 adult portion
- Age 2-3: ~1/2 adult portion
- Age 3+: ~2/3 adult portion
State the ratio in serving_info (e.g., "About 1 bowl (~1/3 adult serving)").`
          : `根據寶寶年齡 ${babyAge}，請使用以下份量換算：
- 1~2 歲：約 1/3 成人份量
- 2~3 歲：約 1/2 成人份量
- 3 歲以上：約 2/3 成人份量
請在 serving_info 中明確標示這個比例（例如：「產出 1 碗 (約 1/3 成人份)」）。`)
      : (language === "en"
          ? `Use toddler portions (about 1/3 to 1/2 adult) and state in serving_info (e.g., "About 1 bowl (~1/3 adult serving)").`
          : `請根據一般幼兒份量（約 1/3 到 1/2 成人份）來設計，並在 serving_info 中明確標示（例如：「產出 1 碗 (約 1/3 成人份)」）。`);

    // system prompt
    const systemPrompt = language === "en"
      ? `You are an expert pediatric nutritionist. You MUST output the JSON strictly in English. Even if the user input is in Chinese, translate and generate recipes in English. Use Metric units (g, ml).

Rules:
- Auto-correct ingredient typos.
- Safe for toddlers; avoid allergens/dangerous items.
- Simple methods for busy parents.
- Balanced nutrition (protein/veg/carbs).
- ${modeInstruction}
- ${toolInstruction}
- ${servingInstruction}
- Compute nutrition (calories, macros, micronutrients calcium/iron/vitamin_c with units).
- Portion ratios as specified; include serving_info.
- Adults menu: two versions (parallel using same ingredients; remix upgrading the baby dish).
Return exactly JSON of this shape:
{
  "recipes": [
    {
      "style": "Chinese/Western/Japanese",
      "title": "Baby dish title",
      "ingredients": [{"name": "Chicken", "amount": "50g"}],
      "nutrition": {
        "calories": 200,
        "tags": ["protein","calcium"],
        "benefit": "One-line nutrition highlight",
        "macros": { "protein": "15g", "carbs": "30g", "fat": "10g" },
        "micronutrients": { "calcium": "120mg", "iron": "2.5mg", "vitamin_c": "30mg" }
      },
      "serving_info": "About 1 bowl (~1/3 adult serving)",
      "steps": ["Step 1", "Step 2"],
      "time": "20 minutes",
      "adults_menu": {
        "parallel": { "title": "Adult version", "desc": "...", "steps": ["..."] },
        "remix": { "title": "Remix", "desc": "...", "steps": ["..."] }
      },
      "searchKeywords": "keywords for search"
    }
  ]
}
Return ONLY JSON.`
      : `你是專業的幼兒營養師，請輸出嚴格符合 JSON 結構的繁體中文結果。

規則：
- 錯字修正，避免危險食材
- 簡單安全、營養均衡
- ${modeInstruction}
- ${toolInstruction}
- ${servingInstruction}
- 計算營養（熱量、三大營養素、micronutrients: calcium/iron/vitamin_c，需帶單位）
- serving_info 標明份量比例
- adults_menu：parallel（同食材）、remix（加工升級）
回傳結構：
{
  "recipes": [
    {
      "style": "中式/西式/日式",
      "title": "寶寶食譜名稱",
      "ingredients": [{"name": "雞肉", "amount": "50g"}],
      "nutrition": {
        "calories": 200,
        "tags": ["蛋白質","鈣質"],
        "benefit": "一句話營養亮點",
        "macros": { "protein": "15g", "carbs": "30g", "fat": "10g" },
        "micronutrients": { "calcium": "120mg", "iron": "2.5mg", "vitamin_c": "30mg" }
      },
      "serving_info": "約 1 碗 (相當於 1/3 成人份)",
      "steps": ["步驟1","步驟2"],
      "time": "20 分鐘",
      "adults_menu": {
        "parallel": { "title": "大人版", "desc": "...", "steps": ["..."] },
        "remix": { "title": "加工版", "desc": "...", "steps": ["..."] }
      },
      "searchKeywords": "用於搜尋的關鍵字"
    }
  ]
}
請只回傳 JSON。`;

    const userPrompt = language === "en"
      ? `Please design 3 toddler-friendly recipes (Chinese, Western, Japanese). User ingredients: ${ingredients}
${babyAge ? `Baby age: ${babyAge}` : ''}
Output language: English. Follow rules and return JSON only.`
      : `請為我設計 3 道不同風格的幼兒食譜（中式、西式、日式各一道）。

使用者提供的食材：${ingredients}
${babyAge ? `寶寶年齡：${babyAge}` : ''}

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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("無法解析 OpenAI 回傳的 JSON");
      }
    }

    // 驗證必要欄位
    if (!recipeData.recipes || !Array.isArray(recipeData.recipes) || recipeData.recipes.length === 0) {
      throw new Error("OpenAI 回傳的資料格式不完整：缺少 recipes 陣列");
    }

    // 驗證每道食譜的必要欄位
    for (const recipe of recipeData.recipes) {
      if (!recipe.title || !recipe.ingredients || !recipe.steps || !recipe.adults_menu) {
        throw new Error("食譜資料格式不完整");
      }
    }

    console.log('回傳食譜資料:', recipeData);
    return NextResponse.json(recipeData, { status: 200 });

  } catch (error) {
    // ============================================
    // 錯誤處理：自動降級到 Mock 資料
    // ============================================
    console.error("❌ 生成食譜時發生錯誤，自動降級使用 Mock 資料:", error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        console.warn('⚠️ 偵測到 API 額度用盡 (429)，使用 Mock 資料');
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        console.warn('⚠️ API Key 無效 (401)，使用 Mock 資料');
      } else {
        console.warn('⚠️ OpenAI API 發生錯誤，使用 Mock 資料備援:', error.message);
      }
    } else {
      console.warn('⚠️ 發生未知錯誤，使用 Mock 資料備援');
    }
    
    // 自動降級：回傳 Mock 資料
    const mockData = getMockRecipeData(mode, ingredients);
    return NextResponse.json(mockData, { status: 200 });
  }
}
