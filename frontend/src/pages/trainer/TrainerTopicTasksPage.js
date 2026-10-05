import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Blocks, Code2, ListChecks, Save, Sparkles, Trash2 } from "lucide-react";

export default function TrainerTopicTasksPage() {
  const { moduleId, topicIndex } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [testCaseDrafts, setTestCaseDrafts] = useState({});
  const [testCaseEdits, setTestCaseEdits] = useState({});

  const emptyForm = {
    type: "coding",
    title: "",
    description: "",
    starterCode: "",
    options: ["", "", "", ""],
    correctOption: 0
  };

  const [form, setForm] = useState(emptyForm);

  /* ================= LOAD ================= */

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic/${topicIndex}/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setTasks(data.success ? data.tasks : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [moduleId, topicIndex, token]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /* ================= ADD / UPDATE ================= */

  const submitTask = async () => {
    if (!form.title.trim() || !form.description.trim())
      return alert("Title & description required");

    if (form.type === "quiz" && form.options.some((o) => !o.trim()))
      return alert("Fill all quiz options");

    const payload = {
      type: form.type,
      title: form.title,
      description: form.description,
      starterCode: form.starterCode,
      options: form.type === "quiz" ? form.options : [],
      correctOption: form.type === "quiz" ? form.correctOption : null
    };

    const url =
      editingIndex === null
        ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic/${topicIndex}/task`
        : `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic/${topicIndex}/task/${editingIndex}`;

    const method = editingIndex === null ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      setTasks(data.tasks);
      setForm(emptyForm);
      setEditingIndex(null);
    }
  };

  /* ================= DELETE ================= */

  const deleteTask = async (index) => {
    if (!window.confirm("Delete this task?")) return;

    await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic/${topicIndex}/task/${index}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    loadTasks();
  };

  /* ================= EDIT ================= */

  const startEdit = (task, index) => {
    setEditingIndex(index);

    let description = "";
    let starterCode = "";
    let options = ["", "", "", ""];
    let correctOption = 0;

    if (task.type === "coding") {
      description = task.content?.coding?.prompt || "";
      starterCode = task.content?.coding?.starterCode || "";
    }

    if (task.type === "quiz") {
      description = task.content?.quiz?.question || "";
      options = task.content?.quiz?.options || options;
      correctOption = task.content?.quiz?.correctIndex ?? 0;
    }

    if (task.type === "bugfix") {
      description = task.content?.bugfix?.hint || "";
      starterCode = task.content?.bugfix?.buggyCode || "";
    }

    setForm({
      type: task.type,
      title: task.title || "",
      description,
      starterCode,
      options,
      correctOption
    });
  };

  /* ================= ADD TEST CASE ================= */

  const addTestCase = async (taskIndex) => {
    const draft = testCaseDrafts[taskIndex];

    if (!draft?.input?.trim() || !draft?.output?.trim())
      return alert("Input & Output required");

    const res = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic/${topicIndex}/task/${taskIndex}/testcase`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draft)
      }
    );

    const data = await res.json();

    if (data.success) {
      await loadTasks();
      setTestCaseDrafts((prev) => ({
        ...prev,
        [taskIndex]: { input: "", output: "" }
      }));
    }
  };

  const handleTestCaseEditChange = (taskIndex, testCaseIndex, field, value, fallback) => {
    const key = `${taskIndex}-${testCaseIndex}`;
    setTestCaseEdits((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || fallback),
        [field]: value
      }
    }));
  };

  const saveTestCase = async (taskIndex, testCaseIndex, fallback) => {
    const key = `${taskIndex}-${testCaseIndex}`;
    const draft = testCaseEdits[key] || fallback;

    if (!draft?.input?.trim() || !draft?.output?.trim())
      return alert("Input & Output required");

    const res = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic/${topicIndex}/task/${taskIndex}/testcase/${testCaseIndex}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draft)
      }
    );

    const data = await res.json();

    if (data.success) {
      setTasks(data.tasks);
      setTestCaseEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const deleteTestCase = async (taskIndex, testCaseIndex) => {
    if (!window.confirm("Remove this test case?")) return;

    const res = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic/${topicIndex}/task/${taskIndex}/testcase/${testCaseIndex}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const data = await res.json();
    if (data.success) {
      setTasks(data.tasks);
      setTestCaseEdits((prev) => {
        const next = { ...prev };
        delete next[`${taskIndex}-${testCaseIndex}`];
        return next;
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-white via-indigo-50 to-slate-100 text-slate-500">
        <Sparkles className="h-8 w-8 animate-spin" />
        <p className="text-sm font-semibold tracking-[0.4em] uppercase">Loading tasks...</p>
      </div>
    );

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-slate-100 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_35px_90px_rgba(79,70,229,0.12)]">
          <div className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-4 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-indigo-500">Task forge</p>
              <h1 className="mt-3 flex items-center gap-3 text-4xl font-black text-slate-900">
                <Code2 className="h-8 w-8 text-indigo-400" /> Topic Task Builder
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-slate-600">
                Draft cinematic coding prompts, rapid-fire quizzes, and bug-fix challenges - everything employees need to prove mastery.
              </p>
            </div>

            <button
              onClick={() => navigate(`/trainer/modules/${moduleId}/edit`)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-700 shadow hover:border-slate-500"
            >
              <ArrowLeft className="h-4 w-4" /> Back to topics
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                <Blocks className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">New challenge</p>
                <h2 className="text-2xl font-bold text-slate-900">Compose a task</h2>
              </div>
            </div>

            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="coding">Coding</option>
              <option value="quiz">Quiz</option>
              <option value="bugfix">Bug Fix</option>
            </select>

            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              className="h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
              placeholder="Task description / hint"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {form.type !== "quiz" && (
              <textarea
                className="h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                placeholder={form.type === "bugfix" ? "Buggy code" : "Starter code"}
                value={form.starterCode}
                onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
              />
            )}

            {form.type === "quiz" && (
              <div className="space-y-3">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const ops = [...form.options];
                        ops[i] = e.target.value;
                        setForm({ ...form, options: ops });
                      }}
                    />
                    <input
                      type="radio"
                      checked={form.correctOption === i}
                      onChange={() => setForm({ ...form, correctOption: i })}
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={submitTask}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow hover:opacity-90"
            >
              {editingIndex !== null ? "Update Task" : "Add Task"}
            </button>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Builder tips</p>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              <li className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">Make coding prompts short but punchy. Provide a descriptive starter snippet.</li>
              <li className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">For quizzes, keep answers unique and highlight a single correct option.</li>
              <li className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">Bug fix tasks shine when you include a hint plus at least two test cases.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {tasks.map((task, i) => {
            const testCases =
              task.type === "coding"
                ? task.content?.coding?.testCases
                : task.type === "bugfix"
                ? task.content?.bugfix?.testCases
                : [];

            const typeColor =
              task.type === "coding"
                ? "bg-indigo-100 text-indigo-700"
                : task.type === "quiz"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700";

            return (
              <div
                key={i}
                className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">
                      {task.title}
                    </h3>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${typeColor}`}
                    >
                      {task.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    <button
                      onClick={() => startEdit(task, i)}
                      className="rounded-full border border-amber-200 px-4 py-2 text-amber-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(i)}
                      className="rounded-full border border-red-200 px-4 py-2 text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {(task.type === "coding" || task.type === "bugfix") && (
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Test cases</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
                        placeholder="Input"
                        value={testCaseDrafts[i]?.input || ""}
                        onChange={(e) =>
                          setTestCaseDrafts((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], input: e.target.value }
                          }))
                        }
                      />

                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
                        placeholder="Output"
                        value={testCaseDrafts[i]?.output || ""}
                        onChange={(e) =>
                          setTestCaseDrafts((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], output: e.target.value }
                          }))
                        }
                      />
                    </div>

                    <button
                      onClick={() => addTestCase(i)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
                    >
                      <ListChecks className="h-4 w-4" /> Add test case
                    </button>

                    {testCases?.length > 0 && (
                      <div className="space-y-3">
                        {testCases.map((tc, idx) => {
                          const key = `${i}-${idx}`;
                          const draft = testCaseEdits[key] || tc;

                          return (
                            <div
                              key={idx}
                              className="space-y-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm"
                            >
                              <div className="grid gap-3 md:grid-cols-2">
                                <input
                                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
                                  value={draft.input}
                                  onChange={(e) =>
                                    handleTestCaseEditChange(
                                      i,
                                      idx,
                                      "input",
                                      e.target.value,
                                      draft
                                    )
                                  }
                                />

                                <input
                                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
                                  value={draft.output}
                                  onChange={(e) =>
                                    handleTestCaseEditChange(
                                      i,
                                      idx,
                                      "output",
                                      e.target.value,
                                      draft
                                    )
                                  }
                                />
                              </div>

                              <div className="flex justify-end gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                                <button
                                  onClick={() => saveTestCase(i, idx, tc)}
                                  className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-500/10 px-4 py-2 text-emerald-600 hover:bg-emerald-500/20"
                                >
                                  <Save className="h-3.5 w-3.5" /> Save
                                </button>
                                <button
                                  onClick={() => deleteTestCase(i, idx)}
                                  className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-500/10 px-4 py-2 text-rose-600 hover:bg-rose-500/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
