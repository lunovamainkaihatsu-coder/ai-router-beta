import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AiRoute = {
  aiName: "ChatGPT" | "Gemini" | "Claude";
  reason: string;
};

type GeminiSource = {
  title: string;
  url: string;
};

type GeminiAnswer = {
  answer: string;
  sources: GeminiSource[];
};

async function selectAiWithOpenAI(
  question: string,
): Promise<AiRoute> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    instructions: `
あなたはAI Router βのルーティング担当です。

ユーザーの質問内容を分析し、
次の3つのAIから最適なものを1つ選んでください。

【ChatGPT】
得意分野：
・文章作成
・アイデア出し
・相談
・企画
・創作
・一般的な質問

【Gemini】
得意分野：
・最新情報
・ニュース
・現在の情報
・旅行
・店舗
・商品
・検索が必要な質問

【Claude】
得意分野：
・プログラミング
・コードレビュー
・エラー修正
・技術的な分析
・長文解析

【重要な判断ルール】

質問に複数の要素が含まれている場合は、
単語だけで判断せず、
「ユーザーが最終的に何をしてほしいのか」
を最も重視してください。

例：

「最新のAIニュースを教えて」
→ Gemini

「最新のAIニュースを調べて記事を書いて」
→ ChatGPT
理由：最終目的が記事作成だから

「Next.jsの最新仕様を調べて」
→ Gemini
理由：最新情報の取得が主目的だから

「このNext.jsのコードのエラーを直して」
→ Claude
理由：コード修正が主目的だから

「転職について相談したい」
→ ChatGPT
理由：相談が主目的だから

選択理由は、
ユーザーにも分かりやすい短い日本語で説明してください。

必ず次の形式だけで回答してください。

AI名|選択理由

例：
Claude|コードのエラー修正が主目的だから
`.trim(),
    input: question,
  });

  const output = response.output_text.trim();

  const [rawAiName, rawReason] = output.split("|");

  const aiName: AiRoute["aiName"] =
    rawAiName === "Gemini" || rawAiName === "Claude"
      ? rawAiName
      : "ChatGPT";

  return {
    aiName,
    reason:
      rawReason?.trim() ??
      "質問内容から最適なAIを選択しました",
  };
}

async function answerWithOpenAI(
  question: string,
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    instructions: `
あなたはAI Router βの回答担当です。

ユーザーの質問へ
分かりやすく
具体的に
日本語で回答してください。
`.trim(),
    input: question,
  });

  return (
    response.output_text ??
    "回答を取得できませんでした。"
  );
}
async function answerWithGemini(
  question: string,
): Promise<GeminiAnswer> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEYが設定されていません");
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
      次の質問に、分かりやすく具体的な日本語で回答してください。

      最新情報が必要な場合はGoogle検索を使用し、
      検索結果に基づいて回答してください。

      質問:
      ${question}
                `.trim(),
              },
            ],
          },
        ],

        tools: [
          {
            google_search: {},
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Gemini API Error:",
      errorText,
    );

    throw new Error(
      "Geminiから回答を取得できませんでした",
    );
  }

const data = await response.json();

console.log(
  "Gemini Grounding Sources:",
  JSON.stringify(
    data.candidates?.[0]?.groundingMetadata?.groundingChunks,
    null,
    2,
  ),
);

const groundingChunks =
  data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

const sources: GeminiSource[] = groundingChunks
  .filter(
    (chunk: {
      web?: {
        uri?: string;
        title?: string;
      };
    }) => chunk.web?.uri,
  )
  .map(
    (chunk: {
      web?: {
        uri?: string;
        title?: string;
      };
    }) => ({
      title: chunk.web?.title ?? "参照元",
      url: chunk.web?.uri ?? "",
    }),
  );

return {
  answer:
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Geminiから回答を取得できませんでした。",
  sources,
};
}
async function answerWithClaude(
  question: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEYが設定されていません");
  }

  const response = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        system: `
あなたはAI Router βのプログラミング・分析担当です。

ユーザーの質問に、
分かりやすく、
具体的に、
日本語で回答してください。

コードやエラーに関する質問では、
原因と修正方法をできるだけ明確に説明してください。
        `.trim(),
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Claude API Error:",
      errorText,
    );

    throw new Error(
      "Claudeから回答を取得できませんでした",
    );
  }

  const data = await response.json();

  const textBlock = data.content?.find(
    (block: { type: string; text?: string }) =>
      block.type === "text",
  );

  return (
    textBlock?.text ??
    "Claudeから回答を取得できませんでした。"
  );
}
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return Response.json(
        {
          error: "質問を入力してください",
        },
        {
          status: 400,
        },
      );
    }

    const route = await selectAiWithOpenAI(question);

    let answer: string;
    let sources: GeminiSource[] = [];
    let usedAi = route.aiName;
    let reason = route.reason;

    try {
      if (route.aiName === "Gemini") {
        const geminiResult = await answerWithGemini(question);

        answer = geminiResult.answer;
        sources = geminiResult.sources;
      } else if (route.aiName === "Claude") {
        answer = await answerWithClaude(question);
      } else {
        answer = await answerWithOpenAI(question);
      }
    } catch (error) {
      console.error(
        `${route.aiName}で回答生成に失敗したため、ChatGPTへ切り替えます`,
        error,
      );

      if (route.aiName === "ChatGPT") {
        throw error;
      }

      answer = await answerWithOpenAI(question);

      usedAi = "ChatGPT";

      reason =
        `${route.aiName}が選択されましたが、` +
        "回答生成に失敗したためChatGPTへ自動切り替えしました。";
    }
    return Response.json({
      selectedAi: route.aiName,
      usedAi,
      reason,
      answer,
      sources,
    });
  } catch (error) {
    console.error("API Error:", error);

    return Response.json(
      {
        error: "AIから回答を取得できませんでした",
      },
      {
        status: 500,
      },
    );
  }
}