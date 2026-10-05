import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import ActivityFeed from "../components/ActivityFeed";

import {
  Sparkles,
  Flame,
  Trophy,
  Zap,
  ArrowRight,
  PlayCircle,
  Target,
  BookOpen,
} from "lucide-react";

function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DASHBOARD ================= */
  const fetchData = useCallback(async () => {
    if (!token) {
      console.warn("⚠️ No token available for dashboard");
      return;
    }
    
    try {
      const [dashRes, achievRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/dashboard/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/achievements/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const data = await dashRes.json();
      const achievementData = await achievRes.json();

      console.log("✅ DASHBOARD API DATA:", data);
      console.log("📊 Stats:", data.stats);
      console.log("📋 Recent Activity:", data.recentActivity);
      console.log("🏆 ACHIEVEMENTS:", achievementData);
      console.log("🔥 Learning Streak from backend:", data.stats?.learningStreak);

      if (!dashRes.ok) {
        console.error("❌ Dashboard API error:", data.message);
        throw new Error(data.message);
      }

      setProfile(data);
      setAchievements(Array.isArray(achievementData) ? achievementData : []);
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      console.log("🔄 Dashboard: Token available, fetching data...");
      fetchData();
    }
  }, [token, fetchData]);

  /* ================= LOADING ================= */
  if (loading || !profile) {
    return (
      <div className="text-center mt-24 text-black text-lg animate-pulse">
        Loading Dashboard…
      </div>
    );
  }

  const { user, stats = {}, recentActivity = [], modules = [], badges: topBadges = [] } = profile;

  /* ================= STATS FIX (FUNCTIONAL) ================= */

  // ✅ XP (works already)
  const totalXP =
    stats.totalPoints ??
    stats.totalXP ??
    user?.xp ??
    0;

  // ✅ Badges earned (NOW from real achievements API)
  const badgesEarned = achievements.length > 0
    ? achievements.filter((a) => a.unlocked).length
    : (stats.badgesEarned ??
       stats.totalBadges ??
       (Array.isArray(user?.badges) ? user.badges.length : null) ??
       (Array.isArray(topBadges) ? topBadges.length : null) ??
       0);

  // ✅ Streak (works with multiple backend formats)
  const streakFromBackend =
    stats.learningStreak ??
    stats.streak ??
    user?.streak ??
    null;

  // 🔥 If backend doesn't send streak, calculate from recentActivity dates
  const calculateStreakFromActivity = (activityList) => {
    if (!Array.isArray(activityList) || activityList.length === 0) return 0;

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const normalizeDayValue = (input) => {
      const date = new Date(input);
      if (Number.isNaN(date.getTime())) return null;
      date.setUTCHours(0, 0, 0, 0);
      return date.getTime();
    };

    const activeDayValues = Array.from(
      new Set(
        activityList
          .map((a) => a.date || a.createdAt || a.updatedAt)
          .map((value) => normalizeDayValue(value))
          .filter((value) => typeof value === "number")
      )
    ).sort((a, b) => b - a);

    if (activeDayValues.length === 0) return 0;

    const todayValue = normalizeDayValue(new Date());
    if (typeof todayValue !== "number") return 0;

    const daysSinceLast = Math.round((todayValue - activeDayValues[0]) / MS_PER_DAY);
    if (daysSinceLast > 1) return 0;

    let streak = 1;

    for (let i = 1; i < activeDayValues.length; i++) {
      const diff = Math.round((activeDayValues[i - 1] - activeDayValues[i]) / MS_PER_DAY);

      if (diff === 1) streak++;
      else if (diff > 1) break;
    }

    return streak;
  };

  const learningStreak =
    typeof streakFromBackend === "number"
      ? streakFromBackend
      : calculateStreakFromActivity(recentActivity);

  console.log("🔥 Final Learning Streak:", learningStreak);
  console.log("🔥 Streak from backend:", streakFromBackend);
  console.log("🔥 Recent activity count:", recentActivity?.length || 0);

  /* ================= MODULE PROGRESS FIX ================= */
  const getModuleProgress = (m) => {
    // completed => 100%
    if (m?.completed === true) return 100;

    // numeric progress
    if (typeof m?.progress === "number") return Math.min(Math.max(m.progress, 0), 100);

    // string progress like "60"
    if (typeof m?.progress === "string" && !isNaN(Number(m.progress)))
      return Math.min(Math.max(Number(m.progress), 0), 100);

    // progressPercent
    if (typeof m?.progressPercent === "number")
      return Math.min(Math.max(m.progressPercent, 0), 100);

    // nested progressPercent
    if (typeof m?.moduleProgress?.progressPercent === "number")
      return Math.min(Math.max(m.moduleProgress.progressPercent, 0), 100);

    // completedTopics / totalTopics
    if (
      typeof m?.completedTopics === "number" &&
      typeof m?.totalTopics === "number" &&
      m.totalTopics > 0
    ) {
      return Math.round((m.completedTopics / m.totalTopics) * 100);
    }

    // calculate from topics
    if (Array.isArray(m?.topics) && m.topics.length > 0) {
      const completed = m.topics.filter((t) => t.completed === true).length;
      return Math.round((completed / m.topics.length) * 100);
    }

    return 0;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Sidebar />

      {/* MAIN */}
      <main className="flex-1 ml-72 px-10 py-10 space-y-8">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2"
        >
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50 shadow-lg p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 hover:shadow-xl transition-shadow">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Your Learning Dashboard
              </div>

              <h1 className="text-4xl font-extrabold text-black leading-tight">
                Welcome back,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {user?.name}
                </span>{" "}
                👋
              </h1>

              <p className="text-slate-600 mt-2 max-w-xl">
                Keep going! Complete lessons, solve challenges, earn XP and level
                up 🚀
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/modules")}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition"
              >
                Explore Modules <ArrowRight className="inline w-5 h-5 ml-1" />
              </button>

              <button
                onClick={() => navigate("/leaderboard")}
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-black font-bold hover:bg-slate-50 transition"
              >
                Leaderboard 🏆
              </button>
            </div>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Total XP"
            value={totalXP}
            gradient="from-teal-500 to-emerald-500"
          />

          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Badges Earned"
            value={badgesEarned}
            gradient="from-yellow-500 to-orange-500"
            onClick={() => navigate("/achievements")}
          />

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Learning Streak</p>
                <p className="text-2xl font-extrabold text-black">
                  {learningStreak} Days
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                    i < learningStreak ? "bg-orange-500" : "bg-orange-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* CONTINUE LEARNING */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-black">
              Continue Learning
            </h2>

            <button
              onClick={() => navigate("/modules")}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              View all modules →
            </button>
          </div>

          {modules.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8 text-center">
              <p className="text-black font-semibold">
                You haven’t started learning yet.
              </p>
              <p className="text-slate-600 mt-1">
                Start a module and begin earning XP 🎯
              </p>

              <button
                onClick={() => navigate("/modules")}
                className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow hover:shadow-lg transition"
              >
                Start Learning
              </button>
            </div>
          )}

          <motion.div
            className="grid md:grid-cols-2 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {modules.map((m, index) => {
              const moduleVariants = {
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              };
              const moduleId = m.id || m._id;
              const progress = getModuleProgress(m);
              const completed = progress >= 100 || m.completed === true;

              return (
                <motion.div
                  key={moduleId || index}
                  variants={moduleVariants}
                  className="group"
                >
                  <div
                    onClick={() => navigate(`/modules/${moduleId}/topics`)}
                    className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-md p-6 cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-black">
                        {m.title || "Untitled Module"}
                      </h3>

                      <p className="text-sm text-slate-600 mt-1">
                        {completed
                          ? "All topics completed 🎉"
                          : "Resume where you left off"}
                      </p>
                    </div>

                    {completed ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold">
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        In Progress
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-slate-700 font-semibold mb-2">
                      <span>Progress</span>
                      <span className="text-black">{progress}%</span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">
                      <PlayCircle className="w-5 h-5" />
                      {completed ? "Review Module" : "Continue Learning"}
                    </span>

                    <span className="text-slate-400 group-hover:text-indigo-600 transition">
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ACTIVITY */}
        <div>
          <ActivityFeed recentActivity={recentActivity} />
        </div>
      </main>
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ icon, label, value, gradient, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-md p-6 hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-r ${gradient} shadow-lg`}
        >
          {icon}
        </motion.div>

        <div>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
