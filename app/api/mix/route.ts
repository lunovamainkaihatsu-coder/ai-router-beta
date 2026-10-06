import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function researchWithGemini(
  question: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEYが設定されていません");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
あなたはAI MIXの情報収集担当です。

次の質問について、必要な情報を調査してください。

特に最新情報が関係する場合はGoogle検索を使い、
次のAIが分析しやすいように、重要な事実を整理してください。

ユーザーの質問：
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
    console.error("Gemini MIX Error:", errorText);
    throw new Error("Geminiで情報収集できませんでした");
  }

  const data = await response.json();

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Geminiから調査結果を取得できませんでした。"
  );
}

async function analyzeWithClaude(
  question: string,
  research: string,
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
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: `
あなたはAI MIXの分析担当です。

ユーザーの質問と、Geminiが収集した情報を分析してください。

あなたの役割は最終回答を書くことではありません。
次のChatGPTが優れた最終回答を作れるように、
情報を整理・分析することです。

・ユーザーが本当に知りたいことを整理する
・重要な事実を優先する
・情報同士の関係を整理する
・重複や不要な情報を減らす
・注目すべきポイントや意味を抽出する
・調査結果にない事実を勝手に追加しない

【ユーザーの質問】
${question}

【Claudeの分析結果】
${research}
            `.trim(),
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude MIX Error:", errorText);
    throw new Error("Claudeで分析できませんでした");
  }

  const data = await response.json();

  return (
    data.content?.[0]?.text ??
    "Claudeから分析結果を取得できませんでした。"
  );
}

async function createFinalAnswer(
  question: string,
  research: string,
): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    instructions: `
あなたはAI MIXの最終回答担当です。

このAI MIXでは、

1. Geminiが最新情報を調査
2. Claudeがその調査結果を分析・整理
3. あなた（ChatGPT）が最終回答を作成

という流れで処理しています。

あなたにはClaudeが整理・分析した結果が渡されています。

Claudeの分析を材料として、
ユーザーの元の質問に対する最終回答を作成してください。

・ユーザーの質問に直接答える
・Claudeが整理した重要度や構成を活用する
・単なる情報の羅列ではなく、意味や流れが分かる回答にする
・分かりやすく自然な日本語で回答する
・分析結果にない事実を勝手に追加しない
・「Geminiの調査結果を整理しました」など内部処理を説明する表現は避ける
・ユーザーにとって完成された一つの回答として提示する
`.trim(),
    input: `
【ユーザーの質問】
${question}

【Geminiの調査結果】
${research}
`.trim(),
  });

  return (
    response.output_text ??
    "AI MIXの最終回答を取得できませんでした。"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body.question;

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

    const research = await researchWithGemini(question);

    const analysis = await analyzeWithClaude(
      question,
      research,
    );

    const answer = await createFinalAnswer(
      question,
      analysis,
    );

    return Response.json({
      message: "AI MIXの回答生成が完了しました",
      answer,
      research,
      analysis,
    });
  } catch (error) {
    console.error("AI MIX Error:", error);

    return Response.json(
      {
        error: "AI MIXでエラーが発生しました",
      },
      {
        status: 500,
      },
    );
  }
}