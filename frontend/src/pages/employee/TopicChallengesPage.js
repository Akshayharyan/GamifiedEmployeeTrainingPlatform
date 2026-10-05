import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CodeSandbox from "../../components/CodeSandbox";

export default function TopicChallengesPage() {
  const { moduleId, topicIndex } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [topic, setTopic] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answerIndex, setAnswerIndex] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD TOPIC ================= */

  useEffect(() => {
    const loadTopic = async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/${moduleId}/topics/${topicIndex}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setTopic({ ...data, tasks: data.tasks || [] });
      setLoading(false);
    };
    loadTopic();
  }, [moduleId, topicIndex, token]);

  useEffect(() => {
    setAnswerIndex(null);
    setFeedback("");
  }, [current]);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin mx-auto" />
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">Preparing</p>
          <p className="text-lg font-semibold text-slate-600">Loading challenges...</p>
        </div>
      </div>
    );

  if (!topic || !topic.tasks.length)
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-xs uppercase tracking-[0.45em] text-indigo-400">Challenge Track</p>
          <h2 className="text-3xl font-semibold text-slate-800">No challenges available yet</h2>
          <p className="text-slate-500">Ask your trainer to publish tasks for this topic or switch to a different module.</p>
          <button
            onClick={() => navigate(`/modules/${moduleId}/topics`)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-white text-sm font-semibold shadow-lg"
          >
            Back to roadmap
          </button>
        </div>
      </div>
    );

  const tasks = topic.tasks;
  const task = tasks[current] || {};
  const isLast = current === tasks.length - 1;

  const coding = task.content?.coding;
  const quiz = task.content?.quiz;
  const bugfix = task.content?.bugfix;
  const hasCoding = task.type === "coding" && Boolean(coding);
  const hasBugfix = task.type === "bugfix" && Boolean(bugfix);
  const hasQuiz = task.type === "quiz" && Boolean(quiz);

  const progress = ((current + 1) / tasks.length) * 100;

  /* ================= QUIZ ================= */

  const submitQuiz = () => {
    if (answerIndex === null)
      return setFeedback("⚠️ Select an option");

    if (!quiz || !quiz.options?.length)
      return setFeedback("Challenge data incomplete. Please try a different task.");

    if (answerIndex !== quiz.correctIndex)
      return setFeedback("❌ Incorrect – try again!");

    next();
  };

  const next = () => isLast ? finish() : setCurrent(c => c + 1);

  const finish = async () => {
    await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/complete-topic`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ moduleId, topicIndex: Number(topicIndex) })
    });

    setCompleted(true);
    setTimeout(() => navigate(`/modules/${moduleId}/topics`), 1500);
  };

  if (completed)
    return (
      <div className="h-screen flex items-center justify-center text-4xl font-bold text-green-600">
        🎉 Topic Mastered!
      </div>
    );

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-purple-50 px-4 pt-16 pb-24">

      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 p-[1px] shadow-[0_30px_60px_rgba(79,70,229,0.2)]">
          <div className="relative rounded-[30px] bg-white/90 backdrop-blur-xl px-6 py-8 sm:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-indigo-500">Challenge Track</p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
                  {topic.title}
                </h1>
                <p className="text-sm text-slate-500">
                  Challenge {current + 1} of {tasks.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Progress</span>
                  <span className="text-3xl font-black text-slate-900">{Math.round(progress)}%</span>
                </div>
                <button
                  onClick={() => navigate(`/modules/${moduleId}/topics`)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  Back to roadmap
                </button>
              </div>
            </div>
            <div className="mt-6 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">

          {/* LEFT */}
          <div className="rounded-[30px] bg-white border border-slate-100 shadow-2xl p-8 space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.4),_transparent_55%)]" />
            <div className="relative space-y-1">
              <p className="text-sm font-semibold text-indigo-500 uppercase tracking-[0.35em]">{task.type || "challenge"}</p>
              <h2 className="text-3xl font-semibold text-slate-900">{task.title || "Untitled challenge"}</h2>
              <p className="text-sm text-slate-500">Earn {task.xp || 20} XP</p>
            </div>

            {hasCoding && (
              <div className="relative rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-inner text-slate-800">
                <div className="absolute -top-4 right-6 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">{current + 1}</span>
                  Coding Brief
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-400 mb-2">Objective</p>
                <p className="text-lg leading-relaxed whitespace-pre-line">{coding.prompt}</p>
                {coding.language && (
                  <p className="mt-4 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                    Language · {coding.language}
                  </p>
                )}
              </div>
            )}

            {hasBugfix && (
              <div className="space-y-3">
                <pre className="rounded-2xl bg-slate-900 text-green-300 p-4 text-sm overflow-auto shadow-inner">
{bugfix.buggyCode}
                </pre>
                {bugfix.hint && (
                  <p className="text-sm font-medium text-indigo-600">💡 Hint: {bugfix.hint}</p>
                )}
              </div>
            )}

            {hasQuiz && (
              <div className="space-y-4">
                <p className="font-medium text-slate-800 text-lg">{quiz.question}</p>

                {quiz.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswerIndex(i)}
                    className={`w-full text-left rounded-2xl border px-4 py-3 text-base font-semibold transition flex items-center gap-3 ${
                      answerIndex === i
                        ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow"
                        : "border-slate-200 bg-white text-slate-800 hover:border-indigo-200"
                    }`}
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {!hasCoding && !hasBugfix && !hasQuiz && (
              <p className="text-sm text-slate-500">Challenge data is still loading. Try moving to the next task.</p>
            )}

            {feedback && (
              <p className="font-semibold text-red-600">{feedback}</p>
            )}

            {hasQuiz && (
              <button
                onClick={submitQuiz}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800"
              >
                Submit Answer
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={next}
                disabled={hasQuiz && answerIndex === null}
                className="rounded-2xl border border-slate-900 px-5 py-2 text-sm font-semibold text-slate-900 disabled:opacity-40"
              >
                {isLast ? "Finish" : "Skip"}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          {(hasCoding || hasBugfix) && (
            <div className="rounded-[30px] border border-slate-800 bg-[radial-gradient(circle_at_top,_#1e1b4b,_#020617)] p-6 text-white shadow-[0_30px_60px_rgba(15,23,42,0.45)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.5em] text-indigo-300">Solution Studio</p>
                  <p className="text-xl font-semibold">Write & Test</p>
                </div>
                <div className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                  {hasCoding ? "Code" : "Fix"}
                </div>
              </div>
              <CodeSandbox
                height={360}
                containerClass="flex-1"
                outputClass="max-h-24"
                language="javascript"
                starterCode={
                  hasCoding
                    ? coding.starterCode
                    : bugfix.buggyCode
                }

                onRun={async (code) => {
                  const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/grader/grade`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      moduleId,
                      topicIndex: Number(topicIndex),
                      taskIndex: current,
                      code
                    })
                  });

                  const data = await res.json();
                  if (!data.results) return data.message || "No output";

                  const lines = data.results
                    .map(r => `Input ${r.input} → ${r.actual} ${r.pass ? "✅" : `❌ (expected ${r.expected})`}`)
                    .join("\n");

                  return data.success ? lines : `${data.message || "Tests failed"}\n${lines}`;
                }}

                onSubmit={async (code) => {
                  const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/grader/grade`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      moduleId,
                      topicIndex: Number(topicIndex),
                      taskIndex: current,
                      code
                    })
                  });

                  const data = await res.json();
                  if (!data.success) return data.message;

                  next();
                  return "🎉 All test cases passed!";
                }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}