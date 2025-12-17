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
  
  try {
    // 讀取請求資料
    body = await request.json();
    console.log('API收到請求:', body);
    
    const { ingredients: userIngredients, mode: userMode, tool, age, language = "zh" } = body;
    ingredients = userIngredients || "";
    mode = userMode || "strict";
    toolValue = tool || "any";
    babyAge = age;
    const selectedLanguage = language || "zh";

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
      const mockData = getMockRecipeData(mode, ingredients);
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

    // 份量換算說明
    const servingInstruction = babyAge 
      ? `根據寶寶年齡 ${babyAge}，請使用以下份量換算：
- 1~2 歲：約 1/3 成人份量
- 2~3 歲：約 1/2 成人份量
- 3 歲以上：約 2/3 成人份量
請在 serving_info 中明確標示這個比例（例如：「產出 1 碗 (約 1/3 成人份)」）。`
      : `請根據一般幼兒份量（約 1/3 到 1/2 成人份）來設計，並在 serving_info 中明確標示（例如：「產出 1 碗 (約 1/3 成人份)」）。`;

    // 根據語言設定不同的 System Prompt 開頭
    let systemPromptStart = "";
    let styleLabels: { chinese: string; western: string; japanese: string } = { chinese: "中式", western: "西式", japanese: "日式" };
    
    switch (selectedLanguage) {
      case "en":
        systemPromptStart = `You are an expert nutritionist and creative chef specializing in "Parent-Child Shared Meals" for toddlers. You specialize in designing nutritious, safe, and easy-to-make baby food and toddler meals for babies aged 6 months to 3 years, while also providing adult meal suggestions for parents.

Your task: Based on the ingredients provided by the user, generate 3 different style recipes (Chinese, Western, Japanese) for babies, and provide two adult meal variations for each recipe.

Important: Output ONLY JSON in English. Use metric units.`;
        styleLabels = { chinese: "Chinese", western: "Western", japanese: "Japanese" };
        break;
      case "ja":
        systemPromptStart = `あなたは「親子で一緒に食べる」に精通した専門の日本の幼児栄養士とクリエイティブシェフです。6ヶ月から3歳の赤ちゃんのための栄養バランスの取れた、安全で簡単に作れる離乳食と幼児食を設計し、同時に保護者に大人用の料理提案を提供することに専念しています。

あなたのタスク：ユーザーが提供した食材に基づいて、3つの異なるスタイル（中華風、洋風、和風）の赤ちゃん用レシピを生成し、各レシピに対して2つの大人用バリエーションを提供してください。

重要：日本語でJSONのみを出力してください。`;
        styleLabels = { chinese: "中華風", western: "洋風", japanese: "和風" };
        break;
      case "ko":
        systemPromptStart = `당신은 "부모-자녀 공유 식사"에 정통한 전문 한국 유아 영양사이자 창의적인 셰프입니다. 6개월부터 3세까지의 아기를 위한 영양이 균형 잡힌, 안전하고 쉽게 만들 수 있는 이유식과 유아식을 설계하고, 동시에 부모를 위한 성인용 식사 제안을 제공하는 데 전문적입니다.

귀하의 작업: 사용자가 제공한 재료를 기반으로 3가지 다른 스타일(중식, 양식, 일식)의 아기용 레시피를 생성하고, 각 레시피에 대해 2가지 성인용 변형을 제공하세요.

중요: 한국어로 JSON만 출력하세요.`;
        styleLabels = { chinese: "중식", western: "양식", japanese: "일식" };
        break;
      default: // zh
        systemPromptStart = `你是一位精通「親子共食」的專業台灣幼兒營養師與創意主廚，專精於為 6 個月到 3 歲的寶寶設計營養均衡、安全易做的副食品和幼兒餐點，同時為家長提供大人版本的料理建議。

你的任務：根據使用者提供的食材，生成 3 道不同風格（中式、西式、日式）的寶寶食譜，並為每一道食譜提供兩個大人版本的變體建議。`;
    }

    // 構建完整的 prompt
    const systemPrompt = `${systemPromptStart}

重要規則：
1. **錯字修正 (Auto-Correction)**：若使用者輸入的食材有拼寫錯誤（如 'bannana', 'toamto', '高麗蔡'），請自動修正為正確的英文/中文名稱後再生成食譜，不要照抄錯字。
2. 所有食材必須適合幼兒食用，避免過敏原和危險食材
3. 料理方式必須簡單安全，適合忙碌的家長
4. 營養要均衡，包含蛋白質、蔬菜、碳水化合物
5. ${modeInstruction}
6. ${toolInstruction}
7. ${servingInstruction}
8. **你必須為每道菜計算營養成分**，包括熱量、三大營養素（蛋白質、碳水化合物、脂肪），以及營養標籤
9. **詳細營養資訊 (Micronutrients)**：必須在 nutrition 物件中加入 micronutrients，包含：
   - calcium (鈣)：數值需帶單位，如 "120mg"
   - iron (鐵)：數值需帶單位，如 "2.5mg"
   - vitamin_c (維生素C)：數值需帶單位，如 "30mg"
10. **份量換算公式（必須遵守）**：
    - 1~2 歲：約 1/3 成人份量
    - 2~3 歲：約 1/2 成人份量
    - 3 歲以上：約 2/3 成人份量
    請在 serving_info 中明確標示這個比例

大人食譜建議規則：
- **Option 1 (parallel - 平行料理)**：使用完全相同的食材，但煮成適合大人口味的菜（例如：寶寶吃清蒸雞肉，大人吃宮保雞丁）。可以加入調味料、香料、辣椒等。
- **Option 2 (remix - 美味加工)**：以做好的寶寶料理為基底，加入調味或配料進行「升級」（例如：寶寶吃南瓜燉飯，大人加培根、黑胡椒並焗烤）。

請以 JSON 格式回傳，格式必須嚴格遵守以下結構：
{
  "recipes": [
    {
      "style": "中式/西式/日式",
      "title": "寶寶食譜名稱（例如：寶寶南瓜雞肉粥）",
      "ingredients": [
        {"name": "雞肉", "amount": "50g"},
        {"name": "南瓜", "amount": "100g"}
      ],
      "nutrition": {
        "calories": 200,
        "tags": ["蛋白質", "鈣質", "維生素A"],
        "benefit": "一句話營養亮點（例如：南瓜含有豐富的β-胡蘿蔔素，有助於視力發育！）",
        "macros": {
          "protein": "15g",
          "carbs": "30g",
          "fat": "10g"
        },
        "micronutrients": {
          "calcium": "120mg",
          "iron": "2.5mg",
          "vitamin_c": "30mg"
        }
      },
      "serving_info": "約 1 碗 (相當於 1/3 成人份)",
      "steps": ["步驟1", "步驟2", "步驟3"],
      "time": "準備時間（例如：20 分鐘）",
      "adults_menu": {
        "parallel": {
          "title": "大人版：香辣南瓜炒雞丁",
          "desc": "利用剩下的雞肉與南瓜切塊，下鍋爆炒，加入乾辣椒、花椒等調味，做成重口味的大人菜。",
          "steps": ["雞肉抓醃...", "大火快炒...", "加入調味料..."]
        },
        "remix": {
          "title": "加工版：焗烤南瓜雞肉燉飯",
          "desc": "將寶寶的粥底鋪上起司與黑胡椒，放入烤箱焗烤，做成大人版燉飯。",
          "steps": ["撒上起司...", "烤箱 200度...", "烤至金黃..."]
        }
      },
      "searchKeywords": "用於 YouTube 和 Google 搜尋的關鍵字"
    }
  ]
}

營養資訊要求：
- calories: 數字（單位：kcal），請根據食材份量合理估算（針對寶寶份量）
- tags: 字串陣列，最多3個重點營養標籤
- benefit: 一句話說明這道菜的營養好處
- macros: 三大營養素，請根據食材份量合理估算（單位：g）

請確保：
1. 回傳 3 道不同風格的食譜（中式、西式、日式各一道）
2. 每道食譜都必須包含完整的 adults_menu（parallel 和 remix）
3. serving_info 必須明確標示份量比例
4. 回傳的是有效的 JSON 格式，不要包含任何額外的文字或說明`;

    const userPrompt = `請為我設計 3 道不同風格的幼兒食譜（中式、西式、日式各一道）。

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
