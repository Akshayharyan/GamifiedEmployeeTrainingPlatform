import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/axios";

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
    glow: "shadow-[0_18px_45px_rgba(148,163,184,0.25)]",
    accent: "text-slate-500",
    badge: "bg-white text-slate-600",
    text: "text-slate-900",
    ringBg: "bg-slate-100",
  },
  rare: {
    gradient: "from-sky-50 via-sky-100 to-indigo-100",
    border: "border-sky-200",
    glow: "shadow-[0_18px_50px_rgba(14,165,233,0.28)]",
    accent: "text-sky-600",
    badge: "bg-sky-600/15 text-sky-700",
    text: "text-slate-900",
    ringBg: "bg-sky-100",
  },
  epic: {
    gradient: "from-fuchsia-50 via-violet-50 to-indigo-100",
    border: "border-fuchsia-200",
    glow: "shadow-[0_18px_55px_rgba(192,132,252,0.3)]",
    accent: "text-fuchsia-500",
    badge: "bg-fuchsia-500/15 text-fuchsia-700",
    text: "text-slate-900",
    ringBg: "bg-fuchsia-50",
  },
  legendary: {
    gradient: "from-amber-50 via-orange-50 to-rose-100",
    border: "border-amber-200",
    glow: "shadow-[0_18px_60px_rgba(251,191,36,0.35)]",
    accent: "text-amber-500",
    badge: "bg-amber-500/15 text-amber-700",
    text: "text-slate-900",
    ringBg: "bg-amber-50",
  },
};

const getAchievementProgress = (achievement = {}) => {
  const target = Number(achievement.targetValue || 0) || 1;
  const current = Number(achievement.progressValue || 0);
  const percent = Math.min(target > 0 ? Math.round((current / target) * 100) : 0, 100);

  return {
    target,
    current,
    percent,
  };
};

const Profile = () => {
  const [user, setUser] = useState(null);

  const [backendAchievements, setBackendAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);

  /* ================= FETCH USER ================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/user/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await res.json();

        setUser({
          ...data,
          xp: data.xp ?? 0,
          level: data.level ?? 1,
          moduleProgress: Array.isArray(data.moduleProgress)
            ? data.moduleProgress
            : [],
        });
      } catch (err) {
        console.log("Error loading profile:", err);
      }
    };

    fetchUser();
  }, []);

  /* ================= FETCH BACKEND ACHIEVEMENTS ================= */
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");

        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/achievements/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await res.json();
        setBackendAchievements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load achievements", err);
      } finally {
        setLoadingAchievements(false);
      }
    };

    fetchAchievements();
  }, []);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/certificates/mine`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await res.json();
        if (data.success) setCertificates(data.certificates || []);
        else setCertificates([]);
      } catch (err) {
        console.error("Failed to load certificates", err);
        setCertificates([]);
      } finally {
        setLoadingCertificates(false);
      }
    };

    fetchCertificates();
  }, []);

  if (!user) {
    return (
      <p className="text-center mt-32 text-lg font-semibold text-slate-500">
        Loading profile…
      </p>
    );
  }

  /* ================= DERIVED STATS ================= */
  const avatarSeed = user.name?.replace(/\s+/g, "") || "User";
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${avatarSeed}`;

  const nextLevelXp = user.level * 100;
  const progressPercent = Math.min((user.xp / nextLevelXp) * 100, 100);

  const modulesStarted = user.moduleProgress.length;
  const modulesCompleted = user.moduleProgress.filter(
    (m) => m.completedTopics?.length > 0
  ).length;

  /* ================= ACHIEVEMENT SNAPSHOT ================= */
  const achievements = backendAchievements;
  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionRate = totalAchievements
    ? Math.round((unlockedCount / totalAchievements) * 100)
    : 0;

  const spotlightAchievement = achievements.find((a) => a.unlocked) || achievements[0] || null;
  const nextLockedAchievement = achievements.find((a) => !a.unlocked) || null;

  const featuredAchievements = achievements.length
    ? [...achievements]
        .sort((a, b) => {
          if (a.unlocked !== b.unlocked) return Number(b.unlocked) - Number(a.unlocked);
          const aProgress = Number(a.progressValue || 0);
          const bProgress = Number(b.progressValue || 0);
          return bProgress - aProgress;
        })
        .slice(0, 4)
    : [];

  /* ================= UI ================= */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-sky-50 to-orange-50">
      <main className="flex-grow px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* PROFILE HEADER */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="profile"
                  className="w-28 h-28 rounded-full border-4 border-white shadow"
                />
                <div className="absolute -bottom-1 -right-1 bg-orange-400 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                  Lv {user.level}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-slate-800">
                  {user.name}
                </h2>

                <p className="text-slate-500 text-sm mt-1">
                  Keep learning and leveling up 🚀
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  {user.email}
                </p>

                {/* XP BAR */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Level {user.level}</span>
                    <span>{user.xp} XP</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-400 transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Stat label="Total XP" value={user.xp} />
            <Stat label="Modules Started" value={modulesStarted} />
            <Stat label="Modules Completed" value={modulesCompleted} />
          </div>

          {/* CERTIFICATES */}
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-emerald-50 to-slate-100 p-8 shadow-[0_35px_90px_rgba(16,185,129,0.18)]">
            <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute -bottom-16 left-4 h-64 w-64 rounded-full bg-slate-200/40 blur-3xl" />

            <div className="relative space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.6em] text-emerald-500">Mastery Certificates</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2 flex items-center gap-3">
                    <span className="text-4xl">📜</span> Official Recognition
                  </h3>
                  <p className="text-slate-600 mt-2 max-w-2xl">
                    Every defeated boss unlocks a shareable certificate. Download PDFs anytime or tap a card to verify your accomplishment.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-500">Total certificates</p>
                  <p className="text-3xl font-black text-slate-900">{certificates.length}</p>
                </div>
              </div>

              {loadingCertificates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="h-48 rounded-3xl bg-white/70 animate-pulse" />
                  ))}
                </div>
              ) : certificates.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/80 px-6 py-10 text-center text-slate-500">
                  Defeat a module boss to unlock your first certificate.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {certificates.map((certificate) => (
                    <CertificateCard key={certificate.certificateId} certificate={certificate} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACHIEVEMENT SHOWCASE */}
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-indigo-50 to-sky-100 p-8 shadow-[0_35px_90px_rgba(79,70,229,0.18)]">
            <div className="absolute -top-24 -right-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
            <div className="absolute -bottom-16 left-4 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />

            <div className="relative space-y-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.6em] text-indigo-500">Achievement Highlights</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2 flex items-center gap-3">
                    <span className="text-4xl">🏆</span> Vault Snapshot
                  </h3>
                  <p className="text-slate-600 mt-2 max-w-xl">
                    Track your rarest unlocks, see how close you are to the next milestone, and jump straight into the full achievement vault.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 min-w-[260px]">
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 text-center backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.5em] text-slate-500">Unlocked</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {unlockedCount}/{totalAchievements || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 text-center backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.5em] text-slate-500">Completion</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{completionRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 text-center backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.5em] text-slate-500">XP</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{user.xp}</p>
                  </div>
                </div>
              </div>

              {spotlightAchievement && (
                <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                  <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur p-6 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.5em] text-indigo-500">Spotlight Unlock</p>
                    <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl drop-shadow-sm">
                          {spotlightAchievement.icon || "🏆"}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">
                            {spotlightAchievement.title}
                          </h4>
                          <p className="text-sm text-slate-600 max-w-sm">
                            {spotlightAchievement.description}
                          </p>
                          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mt-2">
                            {TYPE_LABELS[spotlightAchievement.type] || spotlightAchievement.type || "Achievement"}
                          </p>
                        </div>
                      </div>

                      <SpotlightProgress achievement={spotlightAchievement} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur p-6 shadow-lg space-y-4">
                    <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Next Unlock</p>
                    {nextLockedAchievement ? (
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{nextLockedAchievement.icon || "🔒"}</div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">
                              {nextLockedAchievement.title}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {nextLockedAchievement.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <ProgressMeter achievement={nextLockedAchievement} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-600 text-sm">
                        All current achievements unlocked — new challenges dropping soon!
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Vault Completion</p>
                      <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{completionRate}% complete</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                {loadingAchievements ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-60 rounded-3xl bg-white/60 animate-pulse" />
                    ))}
                  </div>
                ) : achievements.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white text-center py-14 text-slate-500">
                    No achievements yet. Keep exploring quests to unlock your first badge!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {featuredAchievements.map((achievement) => (
                      <ProfileAchievementCard
                        key={achievement._id || achievement.slug || achievement.title}
                        achievement={achievement}
                        loading={loadingAchievements}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Link
                  to="/achievements"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-900/20 bg-slate-900 text-white px-5 py-2 text-sm font-semibold shadow hover:-translate-y-0.5 transition"
                >
                  Open Achievement Vault →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

/* ================= STAT CARD ================= */
const Stat = ({ label, value }) => (
  <div className="bg-white rounded-2xl p-5 text-center shadow">
    <p className="text-2xl font-extrabold text-indigo-600">{value}</p>
    <p className="text-sm text-slate-500">{label}</p>
  </div>
);

const CertificateCard = ({ certificate }) => {
  if (!certificate) return null;
  const issuedAt = certificate.issuedAt
    ? new Date(certificate.issuedAt)
    : new Date();

  const downloadPdf = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("Please sign in again to download your certificate.");
      return;
    }

    try {
      const res = await API.get(
        `/certificates/download/${certificate.certificateId}`
      );

      if (!res.ok) {
        throw new Error("Download failed");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${certificate.certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Certificate download failed", err);
      alert("Unable to download the certificate right now. Please try again.");
    }
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/90 backdrop-blur p-6 shadow-lg flex flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-emerald-500">{certificate.certificateId}</p>
        <h4 className="text-xl font-bold text-slate-900 mt-1">{certificate.moduleTitle}</h4>
        <p className="text-sm text-slate-500">Issued {issuedAt.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>XP: <span className="font-semibold text-slate-900">{certificate.earnedXp}</span></span>
        <span>Certificate</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={downloadPdf}
          className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow"
        >
          Download PDF
        </button>
        <a
          href={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/certificates/verify/${certificate.certificateId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
        >
          Verify
        </a>
      </div>
    </div>
  );
};

/* ================= ACHIEVEMENT UTILITIES ================= */
const SpotlightProgress = ({ achievement }) => {
  if (!achievement) return null;
  const { target, current, percent } = getAchievementProgress(achievement);
  const theme = rarityThemes[achievement.rarity] || rarityThemes.common;

  return (
    <div className="flex items-center gap-5">
      <div className={`relative h-24 w-24 rounded-full ${theme.ringBg} flex items-center justify-center`}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#6366f1 ${percent}%, rgba(15,23,42,0.1) ${percent}% 100%)`,
          }}
        />
        <div className="relative h-16 w-16 rounded-full bg-white flex flex-col items-center justify-center text-slate-900 shadow">
          <span className="text-xl font-bold">{percent}%</span>
          <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Progress</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-600">
          {achievement.type === "XP" ? `${Math.min(current, target)} / ${target} XP` : achievement.unlocked ? "Completed" : "Keep going"}
        </p>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mt-1">Target</p>
        <p className="text-sm font-semibold text-slate-900">
          {achievement.type === "XP" ? `${target} XP` : "Complete once"}
        </p>
      </div>
    </div>
  );
};

const ProgressMeter = ({ achievement }) => {
  if (!achievement) return null;
  const { target, current, percent } = getAchievementProgress(achievement);

  return (
    <div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-slate-900"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {achievement.type === "XP"
          ? `${Math.min(current, target)} / ${target} XP`
          : percent === 100
          ? "Completed"
          : "Pending completion"}
      </p>
    </div>
  );
};

const ProfileAchievementCard = ({ achievement, loading }) => {
  if (!achievement) return null;
  const theme = rarityThemes[achievement.rarity] || rarityThemes.common;
  const { target, current, percent } = getAchievementProgress(achievement);
  const textClass = theme.text || "text-slate-900";

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${theme.border} ${theme.glow} bg-gradient-to-br ${theme.gradient} p-5 ${textClass}`}>
      {!achievement.unlocked && !loading && (
        <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-slate-600">
          <div className="relative flex items-center justify-center">
            <span className="text-3xl animate-bounce">🔒</span>
            <span className="absolute h-10 w-10 rounded-full border border-slate-300 animate-ping" />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.4em] uppercase">Locked</p>
        </div>
      )}

      <div className="relative flex items-start justify-between">
        <div className={`text-4xl ${theme.accent}`}>{achievement.icon || "🏆"}</div>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.4em] px-3 py-1 rounded-full ${theme.badge}`}>
          {achievement.rarity || "common"}
        </span>
      </div>

      <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500 mt-4">
        {TYPE_LABELS[achievement.type] || achievement.type || "Achievement"}
      </p>
      <h4 className="text-xl font-bold mt-1">{achievement.title}</h4>
      <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>

      <div className="mt-5 flex items-center gap-4">
        <div className={`relative h-14 w-14 rounded-full ${theme.ringBg} flex items-center justify-center`}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(#c084fc ${percent}%, rgba(15,23,42,0.12) ${percent}% 100%)` }}
          />
          <div className="relative h-10 w-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-slate-900">
            {percent}%
          </div>
        </div>

        <div className="flex-1">
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-slate-900/80" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {achievement.type === "XP"
              ? `${Math.min(current, target)} / ${target} XP`
              : achievement.unlocked
              ? "Completed"
              : "Pending completion"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
