import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const defaultBoss = {
  name: "",
  theme: "shadow",
  image: "",
  maxHp: 300,
  baseAttackPower: 25,
  xpReward: 300,
  phaseConfig: {
    phase2Threshold: 70,
    phase3Threshold: 30
  },
  signatureChallenges: []
};

export default function TrainerBossPage() {
  const { moduleId } = useParams();
  const { token } = useAuth();

  const [boss, setBoss] = useState(defaultBoss);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ================= LOAD BOSS ================= */

  useEffect(() => {
    const loadBoss = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/boss/module/${moduleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log("Load response:", data);

        if (data.success && data.boss) {
          setBoss({
            ...defaultBoss,
            ...data.boss,
            phaseConfig: {
              ...defaultBoss.phaseConfig,
              ...(data.boss.phaseConfig || {})
            }
          });
        }
      } catch (err) {
        console.error("Load boss error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBoss();
  }, [moduleId, token]);

  /* ================= SAVE BOSS ================= */

  const saveBoss = async () => {
    setSaving(true);

    try {
      let res;

      if (boss._id) {
        res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/boss/${boss._id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(boss)
          }
        );
      } else {
        res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/boss`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ...boss,
              moduleId
            })
          }
        );
      }

      const data = await res.json();
      console.log("Save response:", data);

      if (res.ok && data.success) {
        setBoss({
          ...defaultBoss,
          ...data.boss,
          phaseConfig: {
            ...defaultBoss.phaseConfig,
            ...(data.boss.phaseConfig || {})
          }
        });

        alert("Boss saved successfully ⚔");
      } else {
        alert(data.message || "Save failed");
      }

    } catch (err) {
      console.error("Save error:", err);
      alert("Server error");
    }

    setSaving(false);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-lg">
        Loading Boss...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50 px-6 py-12 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] border border-indigo-100 bg-white/95 p-10 shadow-[0_35px_90px_rgba(79,70,229,0.12)]">
          <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-6 h-56 w-56 rounded-full bg-purple-200/30 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.6em] text-indigo-500">Command Deck</p>
              <h1 className="text-4xl font-black tracking-tight">
                ⚔ Boss Command Center
              </h1>
              <p className="max-w-2xl text-lg text-slate-500">
                Shape the climactic encounter for this module, tune breakthrough thresholds, and dial in rewards that feel legendary.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-3">
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-500">Max HP</p>
                <p className="text-2xl text-indigo-900">{boss.maxHp}</p>
              </div>
              <div className="rounded-2xl border border-purple-100 bg-purple-50/70 px-5 py-3">
                <p className="text-xs uppercase tracking-[0.4em] text-purple-500">Attack</p>
                <p className="text-2xl text-purple-900">{boss.baseAttackPower}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-3">
                <p className="text-xs uppercase tracking-[0.4em] text-emerald-600">XP Drop</p>
                <p className="text-2xl text-emerald-700">{boss.xpReward}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOSS PREVIEW + QUICK NOTES */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-100 to-purple-100 text-6xl">
                {boss.image ? (
                  <img
                    src={boss.image}
                    alt={boss.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  "👹"
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Boss name</p>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {boss.name || "Unnamed Boss"}
                  </h2>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Theme</p>
                  <p className="text-lg capitalize text-indigo-600">{boss.theme}</p>
                </div>
                <p className="text-sm text-slate-500">
                  Signature challenges: {boss.signatureChallenges?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Design cues</p>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              <li className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">Tie narrative flavor to your module. Theme drives arena, VFX, and taunts.</li>
              <li className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">Use HP and attack power to match difficulty spikes without overwhelming learners.</li>
              <li className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">Phase thresholds should feel like cinematic beats—announce them with custom VO.</li>
            </ul>
          </div>
        </div>

        {/* CONFIG PANELS */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Basics</p>
              <h3 className="text-2xl font-semibold text-slate-900">Core stats</h3>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-600">Name</label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                placeholder="Boss name"
                value={boss.name}
                onChange={(e) => setBoss({ ...boss, name: e.target.value })}
              />

              <label className="text-sm font-semibold text-slate-600">Theme</label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                placeholder="Shadow, neon, cyber..."
                value={boss.theme}
                onChange={(e) => setBoss({ ...boss, theme: e.target.value })}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Max HP</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
                    value={boss.maxHp}
                    onChange={(e) => setBoss({ ...boss, maxHp: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Attack power</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
                    value={boss.baseAttackPower}
                    onChange={(e) =>
                      setBoss({
                        ...boss,
                        baseAttackPower: Number(e.target.value)
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Phase arcs</p>
              <h3 className="text-2xl font-semibold text-slate-900">Mechanics</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Phase 2 threshold (%)</label>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
                  value={boss.phaseConfig?.phase2Threshold || 70}
                  onChange={(e) =>
                    setBoss({
                      ...boss,
                      phaseConfig: {
                        ...boss.phaseConfig,
                        phase2Threshold: Number(e.target.value)
                      }
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Phase 3 threshold (%)</label>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
                  value={boss.phaseConfig?.phase3Threshold || 30}
                  onChange={(e) =>
                    setBoss({
                      ...boss,
                      phaseConfig: {
                        ...boss.phaseConfig,
                        phase3Threshold: Number(e.target.value)
                      }
                    })
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
              Hint: thresholds show when the boss enrages. Keep gaps large enough for players to adapt between mechanics.
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <button
            onClick={saveBoss}
            disabled={saving}
            className="w-full rounded-[24px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:opacity-95 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving..." : "Save Boss Configuration"}
          </button>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">All changes sync to the trainer arena</p>
        </div>
      </div>
    </div>
  );
}