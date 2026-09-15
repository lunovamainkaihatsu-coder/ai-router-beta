"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type RouteResult = {
  selectedAi: string;
  usedAi: string;
  reason: string;
  answer: string;
};

const aiInfo = {
  ChatGPT: {
    image: "/chatgpt.png",
    specialty: "文章・相談・アイデア",
  },
  Gemini: {
    image: "/gemini.png",
    specialty: "検索・最新情報",
  },
  Claude: {
    image: "/claude.png",
    specialty: "コード・長文分析",
  },
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      alert("質問を入力してください");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "AIから正常な回答を取得できませんでした",
        );
      }

      setResult({
        selectedAi: data.selectedAi ?? "ChatGPT",
        usedAi: data.usedAi ?? "ChatGPT",
        reason:
          data.reason ??
          "質問内容から最適なAIを選択しました",
        answer: data.answer ?? "回答を取得できませんでした。",
      });
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "AIとの通信に失敗しました";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-5xl font-bold">
          AI Router β
        </h1>

        <p className="mt-4 text-center text-lg text-gray-600">
          最適なAIで、最高のアンサーを。
        </p>

        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={isLoading}
          className="mt-10 h-40 w-full resize-none rounded-lg border border-gray-300 p-4 outline-none focus:border-black disabled:bg-gray-100"
          placeholder="質問を入力してください"
        />

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="mt-4 w-full rounded-lg bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isLoading ? "回答を生成中..." : "質問する"}
        </button>

        {isLoading && (
          <div className="mt-8 rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-600">
              AIが回答を考えています...
            </p>
          </div>
        )}

        {result && (
          <section className="mt-8 rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              回答したAI
            </p>

            <div className="mt-3 inline-flex items-center gap-3 rounded-full bg-gray-100 px-4 py-3">
              <img
                src={
                  aiInfo[result.usedAi as keyof typeof aiInfo]?.image ??
                  "/chatgpt.png"
                }
                alt={result.usedAi}
                className="h-12 w-12 rounded-full object-cover"
              />

              <div>
                <h2 className="text-xl font-bold">
                  {result.usedAi}
                </h2>

                <p className="text-sm text-gray-500">
                  {aiInfo[result.usedAi as keyof typeof aiInfo]?.specialty ??
                    "AIアシスタント"}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              選択理由
            </p>

            <p className="mt-1">
              {result.reason}
            </p>

            <p className="mt-5 text-sm text-gray-500">
              回答
            </p>

            <div className="mt-3">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 mt-6 text-2xl font-bold">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-6 text-xl font-bold">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-5 text-lg font-bold">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-8">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 ml-6 list-disc space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 ml-6 list-decimal space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-7">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold">
                      {children}
                    </strong>
                  ),
                }}
              >
                {result.answer}
              </ReactMarkdown>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}