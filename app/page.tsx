"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type RouteResult = {
  selectedAi: string;
  usedAi: string;
  reason: string;
  answer: string;
  sources: {
    title: string;
    url: string;
    context: string;
  }[];
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
    "AI MIX": {
    image: "/aimix.png",
    specialty: "3つのAIで調査・分析・回答",
  },
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mixLoadingStep, setMixLoadingStep] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        sources: data.sources ?? [],
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

  const handleMixSubmit = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      alert("質問を入力してください");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setMixLoadingStep(1);

    const claudeTimer = setTimeout(() => {
      setMixLoadingStep(2);
    }, 3000);

    const chatgptTimer = setTimeout(() => {
      setMixLoadingStep(3);
    }, 7000);

    try {
      const response = await fetch("/api/mix", {
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
          data.error ?? "AI MIXでエラーが発生しました",
        );
      }

      console.log("AI MIX Response:", data);
      console.log("Gemini Research:", data.research);
      console.log("Claude Analysis:", data.analysis);
      console.log("AI MIX Answer:", data.answer);

      setResult({
        selectedAi: "AI MIX",
        usedAi: "AI MIX",
        reason: "Geminiで最新情報を調査し、Claudeで分析・整理したうえで、ChatGPTが最終回答にまとめました。",
        answer: data.answer,
        sources: [],
      });
    } catch (error) {
      console.error("AI MIX Error:", error);
      alert("AI MIXの呼び出しに失敗しました");
    } finally {
        clearTimeout(claudeTimer);
        clearTimeout(chatgptTimer);

        setIsLoading(false);
        setMixLoadingStep(0);
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
          ref={textareaRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={isLoading}
          className="mt-10 h-40 w-full resize-none rounded-lg border border-gray-300 p-4 outline-none focus:border-black disabled:bg-gray-100"
          placeholder="質問を入力してください"
        />

        <div className="mt-3">
          <p className="mb-2 text-sm text-gray-500">
            💡 質問例
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setQuestion("新しいAIアプリのアイデアを5つ考えてください");

                setTimeout(() => {
                  textareaRef.current?.focus();
                }, 0);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              💬 アプリのアイデア
            </button>

            <button
              type="button"
              onClick={() => {
                setQuestion("今日の生成AIに関する最新ニュースを教えてください");

                setTimeout(() => {
                  textareaRef.current?.focus();
                }, 0);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              🔍 最新のAIニュース
            </button>

            <button
              type="button"
              onClick={() => {
                setQuestion(
                  "Next.jsのコードでエラーが出ています。原因と修正方法を教えてください"
                );

                setTimeout(() => {
                  textareaRef.current?.focus();
                }, 0);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              💻 コードのエラー修正
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full rounded-lg bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed"
          >
            {isLoading ? "回答を生成中..." : "質問する"}
          </button>

          <button
            type="button"
            onClick={handleMixSubmit}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-6 py-3 font-bold hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            ✨ AI MIXで回答
          </button>
        </div>

        {mixLoadingStep > 0 && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black" />

              <div>
                <p className="font-bold">
                  ✨ AI MIXが回答を作っています
                </p>

                <p className="mt-1 text-sm text-gray-600">
                    {mixLoadingStep === 1 &&
                      "🔍 Geminiが最新情報を調査しています..."}

                    {mixLoadingStep === 2 &&
                      "🧠 Claudeが情報を分析・整理しています..."}

                    {mixLoadingStep === 3 &&
                      "✍️ ChatGPTが最終回答を作成しています..."}
                  </p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-600">
              AIが回答を考えています...
            </p>
          </div>
        )}

        {result && result.selectedAi !== result.usedAi && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              AIを自動切り替えしました
            </p>

            <div className="mt-3 flex items-center gap-3">
              <span className="font-bold">
                {result.selectedAi}
              </span>

              <span className="text-gray-400">
                →
              </span>

              <span className="font-bold">
                {result.usedAi}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              選択されたAIで回答を生成できなかったため、
              別のAIへ自動的に切り替えました。
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
              <div className="mb-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.answer);
                    setCopied(true);

                    setTimeout(() => {
                      setCopied(false);
                    }, 2000);
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {copied ? "✅ コピーしました！" : "📋 回答をコピー"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestion("");
                    setResult(null);
                    setCopied(false);

                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 0);
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  🔄 新しい質問
                </button>
              </div>

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

              {result.sources.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-5">
                  <p className="mb-3 font-bold">
                    🔗 参照元
                  </p>

                  <div className="space-y-2">
                    {result.sources.map((source, index) => (
                      <a
                        key={`${source.url}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                      >
                        <p className="font-medium">
                          {source.title} ↗
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {source.context}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}