import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Award, Compass, ShieldCheck, Sparkles, Target } from "lucide-react";

const normalizeModuleId = (moduleId) => {
  if (!moduleId) return null;
  if (typeof moduleId === "string") return moduleId;
  if (typeof moduleId === "object" && moduleId._id) return String(moduleId._id);
  return String(moduleId);
};

const NavStat = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left">
    <p className="text-[10px] uppercase tracking-[0.5em] text-slate-500">{label}</p>
    <div className="mt-1 flex items-center gap-2 text-slate-900">
      {icon}
      <span className="text-lg font-bold">{value}</span>
    </div>
  </div>
);

function TrainerNavbar({ totalModules = 0, totalAchievements = 0 }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.6em] text-slate-500">SkillQuest</p>
            <h1 className="text-2xl font-black text-slate-900">Trainer Console</h1>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => navigate("/trainer")}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Overview
            </button>
            <button
              onClick={() => navigate("/achievements")}
              className="rounded-full border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Achievement Vault
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 lg:flex">
            <NavStat
              icon={<Compass className="h-4 w-4 text-indigo-500" />}
              label="Modules"
              value={totalModules}
            />
            <NavStat
              icon={<Award className="h-4 w-4 text-amber-500" />}
              label="Achievements"
              value={totalAchievements}
            />
          </div>

          <button
            onClick={logout}
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const ModuleAchievementCard = ({ achievement }) => (
  <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white shadow-lg">
    <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/70">
      <span>Achievement</span>
      <span>Minted</span>
    </div>
    <div className="mt-3 flex items-center gap-3">
      <span className="text-4xl drop-shadow-sm">{achievement.icon || "🏆"}</span>
      <div>
        <h5 className="text-lg font-semibold">{achievement.title}</h5>
        <p className="text-xs text-white/80">{achievement.description}</p>
      </div>
    </div>
  </div>
);

function AddAchievementForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    await onCreate({ title, description, icon });
    setLoading(false);
    setTitle("");
    setDescription("");
    setIcon("🏆");
  };

  return (
    <div className="rounded-2xl border border-dashed border-indigo-300 bg-white/90 p-4 text-sm shadow-inner">
      <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-indigo-500">Mint Achievement</p>
      <div className="space-y-2">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          placeholder="Achievement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          placeholder="Icon (emoji)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
        />
      </div>
      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:opacity-90 disabled:cursor-not-allowed"
      >
        {loading ? "Minting…" : "Create Achievement"}
      </button>
    </div>
  );
}

const ModuleCard = ({
  module,
  achievement,
  achievementsLoading,
  onManageTopics,
  onConfigureBoss,
  onSelectGame,
  onCreateAchievement,
}) => {
  const topicsCount = module?.topicsCount || module?.topics?.length || 0;
  const moduleStatus = achievement ? "Badge ready" : "Needs badge";
  const statusClass = achievement ? "text-emerald-600" : "text-rose-500";
  
  // Game type display
  const gameType = module?.gameType || "boss-arena";
  const gameLabel = gameType === "knowledge-runner" ? "🎮 Knowledge Runner" : "⚔️ Boss Arena";
  const gameColor = gameType === "knowledge-runner" ? "text-purple-600" : "text-red-600";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-6 h-32 w-32 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400">Module</p>
            <h4 className="mt-1 text-2xl font-bold text-slate-900 leading-tight">{module.title}</h4>
            <p className="mt-2 text-sm text-slate-500 line-clamp-3">
              {module.description || "No description provided yet."}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-500">Topics</p>
            <p className="text-2xl font-black text-indigo-700">{topicsCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Status</p>
            <p className={`mt-1 text-lg font-semibold ${statusClass}`}>{moduleStatus}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Game Type</p>
            <p className={`mt-1 text-sm font-semibold ${gameColor}`}>{gameLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Module ID</p>
            <p className="mt-1 text-sm font-semibold text-slate-700 truncate">{module.moduleId}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.4em] text-slate-500">
            <span>Module Achievement</span>
            <span>{achievement ? "Locked in" : "1 slot"}</span>
          </div>
          {achievementsLoading ? (
            <div className="h-28 rounded-2xl bg-white/70 animate-pulse" />
          ) : achievement ? (
            <ModuleAchievementCard achievement={achievement} />
          ) : (
            <AddAchievementForm onCreate={onCreateAchievement} />
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onManageTopics}
            className="flex-1 rounded-2xl border border-transparent bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition"
          >
            Manage Topics
          </button>
          <button
            onClick={onSelectGame}
            className="flex-1 rounded-2xl border border-purple-300 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 hover:border-purple-500 transition"
          >
            Select Game
          </button>
          <button
            onClick={onConfigureBoss}
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-500 transition"
          >
            Configure Boss
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-white via-slate-50 to-indigo-50 text-slate-500">
    <Sparkles className="h-8 w-8 text-indigo-500 animate-spin" />
    <p className="text-sm font-semibold tracking-wide uppercase">Loading trainer modules…</p>
  </div>
);

export default function TrainerModulesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [achievementsByModule, setAchievementsByModule] = useState({});
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  const totalModuleAchievements = useMemo(
    () => Object.keys(achievementsByModule).length,
    [achievementsByModule]
  );

  const pendingAchievements = Math.max(modules.length - totalModuleAchievements, 0);

  const heroStats = useMemo(
    () => [
      {
        label: "Assigned Modules",
        value: modules.length,
        icon: <Compass className="h-4 w-4 text-indigo-500" />,
      },
      {
        label: "Badges Minted",
        value: totalModuleAchievements,
        icon: <Award className="h-4 w-4 text-amber-500" />,
      },
      {
        label: "Awaiting Achievement",
        value: pendingAchievements,
        icon: <Target className="h-4 w-4 text-rose-500" />,
      },
    ],
    [modules.length, totalModuleAchievements, pendingAchievements]
  );

  useEffect(() => {
    const loadModules = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/assigned`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const moduleList = Array.isArray(data)
          ? data
          : Array.isArray(data.modules)
          ? data.modules
          : [];

        setModules(moduleList);
      } catch (err) {
        console.error("Failed to load modules:", err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [token]);

  useEffect(() => {
    const fetchModuleAchievements = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/achievements/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!Array.isArray(data)) {
          setAchievementsByModule({});
          return;
        }

        const grouped = data.reduce((acc, achievement) => {
          if (achievement.type !== "MODULE_COMPLETE") return acc;
          const moduleKey = normalizeModuleId(achievement.moduleId);
          if (!moduleKey || acc[moduleKey]) return acc;
          acc[moduleKey] = achievement;
          return acc;
        }, {});

        setAchievementsByModule(grouped);
      } catch (err) {
        console.error("Failed to load module achievements:", err);
        setAchievementsByModule({});
      } finally {
        setAchievementsLoading(false);
      }
    };

    fetchModuleAchievements();
  }, [token]);

  const createAchievement = async (moduleId, formData) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/trainer/achievements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...formData,
        type: "MODULE_COMPLETE",
        moduleId,
      }),
    });

    const data = await res.json();
    if (!data?.success || !data?.achievement) return;

    const moduleKey = normalizeModuleId(moduleId);
    setAchievementsByModule((prev) => ({
      ...prev,
      [moduleKey]: data.achievement,
    }));
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <TrainerNavbar
        totalModules={modules.length}
        totalAchievements={totalModuleAchievements}
      />

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-12">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 p-10 shadow-[0_40px_110px_rgba(79,70,229,0.12)]">
          <div className="pointer-events-none absolute -right-10 -top-12 h-60 w-60 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-4 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.6em] text-indigo-500">Trainer Mission</p>
              <h2 className="mt-3 text-4xl font-black text-slate-900">
                Curate cinematic modules, mint achievements, and prep bosses.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Each module card below is a control center. Drop in achievements, update lessons, and wire boss battles without leaving this screen.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-700">
                  <Sparkles className="h-4 w-4" /> Achievement Designer
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600">
                  <ShieldCheck className="h-4 w-4" /> Boss Ready
                </span>
              </div>
            </div>

            <div className="grid w-full gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-md sm:grid-cols-3 lg:w-auto">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    {stat.icon}
                    <p className="text-[10px] uppercase tracking-[0.4em]">{stat.label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Module Roster</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">Assigned Modules</h3>
              <p className="text-sm text-slate-500">
                Pair each module with a signature badge so employees instantly see what mastering it means.
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {pendingAchievements > 0
                ? `${pendingAchievements} module${pendingAchievements === 1 ? "" : "s"} still need an achievement`
                : "All modules have an assigned achievement"}
            </div>
          </div>

          {modules.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              No modules assigned yet. Once modules arrive, you can mint their first achievements from here.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const moduleKey = normalizeModuleId(module.moduleId);
                const moduleAchievement = achievementsByModule[moduleKey];

                return (
                  <ModuleCard
                    key={module.moduleId}
                    module={module}
                    achievement={moduleAchievement}
                    achievementsLoading={achievementsLoading}
                    onManageTopics={() => navigate(`/trainer/modules/${module.moduleId}/edit`)}
                    onConfigureBoss={() => navigate(`/trainer/modules/${module.moduleId}/boss`)}
                    onSelectGame={() => navigate(`/trainer/modules/${module.moduleId}/game`)}
                    onCreateAchievement={(payload) => createAchievement(module.moduleId, payload)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
