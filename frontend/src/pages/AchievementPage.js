import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const TYPE_LABELS = {
  XP: "XP Milestones",
  MODULE_COMPLETE: "Module Mastery",
  STREAK: "Streaks",
  CUSTOM: "Special",
};

const rarityThemes = {
  common: {
    gradient: "from-white via-slate-100 to-slate-200",
    border: "border-slate-200",
    glow: "shadow-[0_18px_50px_rgba(148,163,184,0.35)]",
    accent: "text-slate-500",
    badge: "bg-white text-slate-600",
    text: "text-slate-900",
    ringBg: "bg-slate-100",
  },
  rare: {
    gradient: "from-sky-50 via-sky-100 to-indigo-100",
    border: "border-sky-200",
    glow: "shadow-[0_18px_55px_rgba(14,165,233,0.35)]",
    accent: "text-sky-600",
    badge: "bg-sky-600/15 text-sky-700",
    text: "text-slate-900",
    ringBg: "bg-sky-100",
  },
  epic: {
    gradient: "from-fuchsia-50 via-violet-50 to-indigo-100",
    border: "border-fuchsia-200",
    glow: "shadow-[0_18px_55px_rgba(192,132,252,0.35)]",
    accent: "text-fuchsia-500",
    badge: "bg-fuchsia-500/15 text-fuchsia-700",
    text: "text-slate-900",
    ringBg: "bg-fuchsia-50",
  },
  legendary: {
    gradient: "from-amber-50 via-orange-50 to-rose-100",
    border: "border-amber-200",
    glow: "shadow-[0_18px_60px_rgba(251,191,36,0.45)]",
    accent: "text-amber-500",
    badge: "bg-amber-500/15 text-amber-700",
    text: "text-slate-900",
    ringBg: "bg-amber-50",
  },
};

const AchievementPage = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  const totalXP = Number(user?.xp || 0);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/achievements/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();
        setAchievements(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch achievements", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const availableTabs = useMemo(() => {
    const uniqueTypes = new Set(achievements.map((achievement) => achievement.type).filter(Boolean));
    return ["ALL", ...uniqueTypes];
  }, [achievements]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        Loading achievements...
      </div>
    );
  }

  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  const completionRate = achievements.length
    ? Math.round((unlockedCount / achievements.length) * 100)
    : 0;

  const filteredAchievements =
    activeTab === "ALL"
      ? achievements
      : achievements.filter((achievement) => achievement.type === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-sky-100 text-slate-900 px-6 py-16">
      <div className="w-full max-w-7xl mx-auto space-y-10">
        <header className="rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-white via-sky-50 to-indigo-100 p-8 shadow-[0_35px_90px_rgba(78,97,255,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-indigo-500">Hall of Progress</p>
              <h1 className="text-4xl font-black mt-2 flex items-center gap-3 text-slate-900">
                <span className="text-5xl">🏆</span> Achievement Vault
              </h1>
              <p className="text-slate-600 max-w-2xl mt-3">
                Each card represents an unlockable moment. Finish modules, rack up XP, and let SkillQuest keep the receipts.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatusCard label="Unlocked" value={`${unlockedCount}/${achievements.length || 0}`} />
              <StatusCard label="XP Earned" value={totalXP} />
              <StatusCard label="Completion" value={`${completionRate}%`} />
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-3">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition border border-slate-200 shadow-sm
                ${
                  activeTab === tab
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:text-slate-900"
                }`}
            >
              {tab === "ALL" ? "All" : TYPE_LABELS[tab] || tab}
            </button>
          ))}
        </div>

        <section className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-sky-50 to-blue-50 shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.5em] text-indigo-600">
                <span>📊</span> Overall Progress
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Your Achievement Journey</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-indigo-600">{unlockedCount}</p>
              <p className="text-sm text-slate-600">of {achievements.length} unlocked</p>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-500 transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 text-right font-semibold">{completionRate}% Complete</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-60 rounded-3xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && filteredAchievements.length === 0 && (
            <div className="col-span-full text-center py-16 rounded-3xl border border-dashed border-slate-300 text-slate-500 bg-white">
              No achievements in this category yet. Keep exploring!
            </div>
          )}

          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement._id} achievement={achievement} loading={loading} />
          ))}
        </section>
      </div>
    </div>
  );
};

export default AchievementPage;

const StatusCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
    <p className="text-[11px] uppercase tracking-[0.5em] text-slate-500">{label}</p>
    <p className="text-2xl font-bold mt-1 text-slate-900">{value}</p>
  </div>
);

const AchievementCard = ({ achievement, loading }) => {
  const theme = rarityThemes[achievement.rarity] || rarityThemes.common;
  const target = Number(achievement.targetValue || 0) || 1;
  const progress = Math.min(
    target > 0 ? Math.round((Number(achievement.progressValue || 0) / target) * 100) : 0,
    100
  );
  const textClass = theme.text || "text-slate-900";
  const ringBg = theme.ringBg || "bg-slate-100";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${theme.border} ${theme.glow} bg-gradient-to-br ${theme.gradient} p-6 ${textClass}`}
    >
      {!achievement.unlocked && !loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-slate-600">
          <div className="relative flex items-center justify-center">
            <span className="text-4xl animate-bounce">🔒</span>
            <span className="absolute h-14 w-14 rounded-full border border-slate-300 animate-ping" />
          </div>
          <p className="text-xs font-semibold tracking-[0.4em] uppercase">Locked</p>
        </div>
      )}

      <div className="relative flex items-start justify-between">
        <div className={`text-4xl ${theme.accent}`}>{achievement.icon || "🏆"}</div>
        <span className={`text-xs font-semibold uppercase tracking-[0.4em] px-3 py-1 rounded-full ${theme.badge}`}>
          {achievement.rarity || "common"}
        </span>
      </div>

      <div className="relative mt-6 space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
          {TYPE_LABELS[achievement.type] || achievement.type}
        </p>
        <h3 className="text-2xl font-bold">{achievement.title}</h3>
        <p className="text-sm text-slate-600">{achievement.description}</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Target</p>
          <p className="text-lg font-semibold">
            {achievement.type === "XP" ? `${target} XP` : "Complete once"}
          </p>
        </div>
        <div className={`relative h-16 w-16 rounded-full ${ringBg} flex items-center justify-center`}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#c084fc ${progress}%, rgba(15,23,42,0.12) ${progress}% 100%)`,
            }}
          />
          <div className="relative h-12 w-12 rounded-full bg-white flex items-center justify-center text-sm font-bold text-slate-900">
            {progress}%
          </div>
        </div>
      </div>

      <div className="mt-5">
        {achievement.unlocked ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            🎉 Unlocked
          </span>
        ) : (
          <>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-slate-800/70" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {achievement.type === "XP"
                ? `${Math.min(Number(achievement.progressValue || 0), target)} / ${target} XP`
                : achievement.unlocked
                ? "Completed"
                : "Pending completion"}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
