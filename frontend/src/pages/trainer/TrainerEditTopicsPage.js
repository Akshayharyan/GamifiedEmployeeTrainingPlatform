import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Film,
  Layers,
  PlusCircle,
  Sparkles,
} from "lucide-react";

export default function TrainerEditTopicsPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [newTopic, setNewTopic] = useState({
    title: "",
    videoUrl: "",
    xp: "",
  });

  /* ================= LOAD MODULE ================= */

  const loadModule = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();

      if (data?.success) {
        setModuleData({
          ...data.module,
          topics: Array.isArray(data.module.topics)
            ? data.module.topics
            : [],
        });
      }
    } catch (err) {
      console.error("Load module failed:", err);
    } finally {
      setLoading(false);
    }
  }, [moduleId, token]);

  useEffect(() => {
    loadModule();
  }, [loadModule]);

  /* ================= ADD TOPIC ================= */

  const addTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.videoUrl.trim())
      return alert("Title & Video URL required");

    setAdding(true);

    const res = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/module/${moduleId}/topic`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTopic.title,
          videoUrl: newTopic.videoUrl,
          xp: Number(newTopic.xp) || 0,
        }),
      }
    );

    const data = await res.json();

    if (data?.success) {
      setModuleData({
        ...data.module,
        topics: data.module.topics || [],
      });

      setNewTopic({ title: "", videoUrl: "", xp: "" });
    }

    setAdding(false);
  };

  /* ================= DELETE TOPIC ================= */

  const deleteTopic = async (index) => {
    if (!window.confirm("Delete this topic?")) return;

    const updated = [...moduleData.topics];
    updated.splice(index, 1);
    setModuleData({ ...moduleData, topics: updated });
  };

  /* ================= EDIT TOPIC ================= */

  const saveEdit = () => {
    setEditingIndex(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-white via-slate-50 to-sky-100 text-slate-500">
        <Sparkles className="h-8 w-8 animate-spin" />
        <p className="text-sm font-semibold tracking-[0.4em] uppercase">Loading module…</p>
      </div>
    );
  }

  const totalXp = moduleData.topics.reduce((sum, t) => sum + (t.xp || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-slate-100 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="relative overflow-hidden rounded-[32px] border border-indigo-100 bg-gradient-to-br from-white via-slate-50 to-indigo-100 p-8 shadow-[0_35px_90px_rgba(79,70,229,0.15)]">
          <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 left-6 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-indigo-500">Module Builder</p>
              <h1 className="mt-3 text-4xl font-black text-slate-900 flex items-center gap-3">
                <Film className="h-8 w-8 text-indigo-400" /> {moduleData.title}
              </h1>
              <p className="mt-2 text-slate-600 text-lg max-w-xl">
                Craft binge-worthy lessons, drop cinematic videos, and stitch them into a module that feels premium.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-700">
                  <Layers className="h-4 w-4" /> {moduleData.topics.length} topics
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700">
                  <Sparkles className="h-4 w-4" /> {totalXp} XP
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/trainer")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-700 shadow hover:border-slate-500"
            >
              <ArrowLeft className="h-4 w-4" /> Back to console
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                <PlusCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">New Topic</p>
                <h2 className="text-2xl font-bold text-slate-900">Create a fresh lesson</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                placeholder="Topic title"
                value={newTopic.title}
                onChange={(e) =>
                  setNewTopic({ ...newTopic, title: e.target.value })
                }
              />

              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                placeholder="YouTube video URL"
                value={newTopic.videoUrl}
                onChange={(e) =>
                  setNewTopic({ ...newTopic, videoUrl: e.target.value })
                }
              />

              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                placeholder="XP reward"
                value={newTopic.xp}
                onChange={(e) =>
                  setNewTopic({ ...newTopic, xp: e.target.value })
                }
              />

              <button
                disabled={adding}
                onClick={addTopic}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-indigo-200/60 transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed"
              >
                {adding ? "Minting lesson…" : "Add Topic"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tips</p>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              <li className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">Pair each topic with a crisp summary so employees know why it matters.</li>
              <li className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">Drop cinematic intros—YouTube embeds look best when they are 16:9.</li>
              <li className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">Keep XP rewards consistent so progression feels fair.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {moduleData.topics.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              No topics yet. Use the creator above to drop your first lesson.
            </div>
          )}

          {moduleData.topics.map((topic, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-indigo-200/40 blur-2xl" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {editingIndex === index ? (
                  <div className="flex-1 space-y-3">
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                      value={topic.title}
                      onChange={(e) => {
                        const updated = [...moduleData.topics];
                        updated[index].title = e.target.value;
                        setModuleData({ ...moduleData, topics: updated });
                      }}
                    />
                    <button
                      onClick={saveEdit}
                      className="text-sm font-semibold text-emerald-600"
                    >
                      Save title
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Topic {index + 1}</p>
                    <h3 className="text-2xl font-semibold text-slate-900">{topic.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{topic.xp || 0} XP reward</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-sm font-semibold">
                  <button
                    onClick={() => setEditingIndex(index)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    Edit title
                  </button>
                  <button
                    onClick={() => deleteTopic(index)}
                    className="rounded-full border border-red-200 px-4 py-2 text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/trainer/modules/${moduleId}/topic/${index}/tasks`)
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 px-5 py-2 text-white shadow-lg"
                  >
                    Manage Tasks
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}