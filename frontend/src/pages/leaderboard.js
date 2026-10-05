import React, { useEffect, useMemo, useState } from "react";
import { Trophy, Users, Target, Medal, Search, Filter, Sparkles, Crown, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const accentFont = { fontFamily: "'Space Grotesk','Clash Display','Segoe UI',sans-serif" };

const podiumGradients = [
  "from-amber-100 via-white to-yellow-50",
  "from-slate-50 via-white to-indigo-50",
  "from-rose-100 via-white to-orange-50",
];

const filterOptions = [
  { id: "all", label: "All Players" },
  { id: "active", label: "Active this week" },
  { id: "veterans", label: "Level 10+" },
];

const getAvatarUrl = (player) => {
  if (player?.avatar) return player.avatar;
  const initials = encodeURIComponent(player?.name || "Player");
  return `https://ui-avatars.com/api/?background=E0E7FF&color=312E81&name=${initials}`;
};

const formatRelativeTime = (value) => {
  if (!value) return "No recent activity";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "No recent activity";

  const diff = Date.now() - timestamp;
  if (diff < 0) return "Just now";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(months / 12);
  return `${years} yr${years > 1 ? "s" : ""} ago`;
};

const StatTile = ({ icon, label, value, detail }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -4 }}
    className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-md hover:shadow-lg transition-shadow"
  >
    <div className="flex items-center gap-3">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="rounded-2xl bg-indigo-100 p-3 text-indigo-600"
      >
        {icon}
      </motion.div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900" style={accentFont}>{value}</p>
        <p className="text-xs text-emerald-600 font-medium">{detail}</p>
      </div>
    </div>
  </motion.div>
);

const PodiumCard = ({ player, tone, rank }) => {
  const joinedLabel = player.joinedAt
    ? new Date(player.joinedAt).toLocaleDateString()
    : "—";

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`relative rounded-3xl border border-white/70 bg-gradient-to-br ${tone} p-[2px] shadow-xl hover:shadow-2xl transition-shadow`}
    >
      {rank === 0 && (
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-3 -right-3 z-10"
        >
          <Crown className="h-8 w-8 text-yellow-500 fill-yellow-400" />
        </motion.div>
      )}
    <div className="rounded-[calc(1.5rem-2px)] bg-white/85 backdrop-blur px-6 py-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        <span>Rank #{player.rank}</span>
        <span>Lvl {player.level}</span>
      </div>
      <div className="flex items-center gap-4">
        <img
          src={getAvatarUrl(player)}
          alt={player.name}
          className="h-16 w-16 rounded-2xl object-cover border border-white"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getAvatarUrl({});
          }}
        />
        <div>
          <p className="text-xl font-black text-slate-900" style={accentFont}>{player.name}</p>
          <p className="text-sm text-slate-500">Joined {joinedLabel}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">XP</p>
          <p className="text-3xl font-black text-slate-900" style={accentFont}>{(player.xp || 0).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Badges</p>
          <p className="text-2xl font-black text-slate-900">{player.badges}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="rounded-xl bg-white px-3 py-1 font-semibold text-slate-700">{player.modulesCompleted} modules</span>
        <span>Last active {formatRelativeTime(player.lastActive)}</span>
      </div>
    </div>
    </motion.div>
  );
};

const LeaderboardRow = ({ player, maxXP }) => {
  const rank = player.rank ?? 0;
  const xp = player.xp || 0;
  const progressWidth = Math.max(8, Math.round((xp / maxXP) * 100));

  return (
    <motion.div
      whileHover={{ x: 8, scale: 1.01 }}
      className="grid grid-cols-[auto,1fr,auto] items-center gap-6 rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 px-6 py-5 shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="text-2xl font-black text-slate-300" style={accentFont}>{String(rank).padStart(2, "0")}</div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={getAvatarUrl(player)}
            alt={player.name}
            className="h-14 w-14 rounded-2xl object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getAvatarUrl({});
            }}
          />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-indigo-600 px-2 py-[2px] text-[10px] font-semibold text-white">
            {player.badges}★
          </span>
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-slate-900" style={accentFont}>{player.name}</p>
          <p className="text-sm text-slate-500">Lvl {player.level} • {player.modulesCompleted} modules</p>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">XP</p>
        <p className="text-2xl font-bold text-slate-900" style={accentFont}>{xp.toLocaleString()}</p>
        <p className="text-xs text-slate-500">Last active {formatRelativeTime(player.lastActive)}</p>
      </div>
    </motion.div>
  );
};

const LoadingState = () => (
  <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
    Loading leaderboard…
  </div>
);

const EmptyState = () => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
    No competitors yet. Invite your team to start earning XP!
  </div>
);

const ErrorState = ({ message }) => (
  <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
    {message}
  </div>
);

const FilterPill = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
      active
        ? "border-indigo-500 bg-indigo-600 text-white shadow"
        : "border-slate-200 text-slate-600 hover:border-slate-400"
    }`}
  >
    {label}
  </button>
);

const Leaderboard = () => {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    let ignore = false;

    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const [leaderRes, achievRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/leaderboard`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/achievements/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const leaderData = await leaderRes.json();
        const achievementData = await achievRes.json();

        if (!leaderRes.ok) throw new Error(leaderData.message || "Unable to load leaderboard");
        if (!ignore) {
          setPlayers(Array.isArray(leaderData.leaderboard) ? leaderData.leaderboard : []);
          setAchievements(Array.isArray(achievementData) ? achievementData : []);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load leaderboard");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (token) {
      loadLeaderboard();
    } else {
      setPlayers([]);
      setAchievements([]);
      setLoading(false);
    }

    return () => {
      ignore = true;
    };
  }, [token]);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return players.filter((player) => {
      const matchesSearch = player?.name?.toLowerCase().includes(normalizedSearch);
      if (!matchesSearch) return false;

      if (selectedFilter === "active") {
        const last = player.lastActive ? new Date(player.lastActive).getTime() : 0;
        if (!last) return false;
        return now - last <= sevenDays;
      }

      if (selectedFilter === "veterans") {
        return (player.level || 0) >= 10;
      }

      return true;
    });
  }, [players, searchTerm, selectedFilter]);

  const summary = useMemo(() => {
    if (!players.length) {
      return { totalXP: 0, averageXP: 0, modulesCompleted: 0, badgeCount: 0 };
    }

    const totalXP = players.reduce((sum, player) => sum + (player.xp || 0), 0);
    const modulesCompleted = players.reduce(
      (sum, player) => sum + (player.modulesCompleted || 0),
      0
    );
    const badgeCount = players.reduce((sum, player) => sum + (player.badges || 0), 0);
    const averageXP = Math.round(totalXP / players.length);

    return { totalXP, averageXP, modulesCompleted, badgeCount };
  }, [players]);

  const userBadgesEarned = useMemo(() => {
    return achievements.filter((a) => a.unlocked).length || 0;
  }, [achievements]);

  const maxXP = useMemo(() => {
    const source = filteredPlayers.length ? filteredPlayers : players;
    return source.reduce((max, player) => Math.max(max, player.xp || 0), 1);
  }, [filteredPlayers, players]);

  const leaderboardSet = filteredPlayers.length ? filteredPlayers : players;
  const topThree = leaderboardSet.slice(0, 3);
  const challengers = leaderboardSet.slice(3);
  const resultCount = leaderboardSet.length;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-16 left-10 h-40 w-40 rounded-full bg-indigo-100 blur-[90px]" />
        <div className="absolute bottom-10 right-5 h-48 w-48 rounded-full bg-amber-100 blur-[110px]" />
      </div>
      <main className="relative w-full max-w-7xl mx-auto px-6 py-12">
        <section className="rounded-3xl border border-slate-100 bg-white shadow-xl p-8 relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-40 pointer-events-none">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.15),transparent_60%)]" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.5em] text-indigo-500">
                <Sparkles className="h-4 w-4" /> Live Standings
              </p>
              <h1 className="mt-3 text-4xl font-black text-slate-900" style={accentFont}>
                Employee Leaderboard
              </h1>
              <p className="mt-2 max-w-xl text-slate-600">
                Compare real XP, badge count, and module completions across all employees. The board refreshes automatically whenever someone levels up.
              </p>
              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-inner focus:border-indigo-400 focus:outline-none"
                    placeholder="Search teammates or rivals"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {filterOptions.map((option) => (
                    <FilterPill
                      key={option.id}
                      label={option.label}
                      active={selectedFilter === option.id}
                      onClick={() => setSelectedFilter(option.id)}
                    />
                  ))}
                  <span className="rounded-full border border-dashed border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400">
                    {resultCount} showing
                  </span>
                </div>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              <StatTile icon={<Trophy className="h-5 w-5" />} label="Total XP" value={summary.totalXP.toLocaleString()} detail="All players" />
              <StatTile icon={<Target className="h-5 w-5" />} label="Average XP" value={summary.averageXP.toLocaleString()} detail="Per player" />
              <StatTile icon={<Users className="h-5 w-5" />} label="Modules" value={summary.modulesCompleted} detail="Completed" />
              <StatTile icon={<Medal className="h-5 w-5" />} label="Your Badges" value={userBadgesEarned} detail="Achievements" />
            </div>
          </div>
          {error && <div className="mt-6"><ErrorState message={error} /></div>}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black text-slate-900" style={accentFont}>Top performers</h2>
          <p className="text-sm text-slate-500">Celebrating the current podium</p>

          {loading ? (
            <div className="mt-6"><LoadingState /></div>
          ) : !leaderboardSet.length ? (
            <div className="mt-6"><EmptyState /></div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {topThree.map((player, idx) => (
                <PodiumCard key={player.id || player.rank} player={player} tone={podiumGradients[idx] || podiumGradients[0]} rank={idx} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.5em] text-amber-600">
                <Medal className="h-4 w-4" /> Your Progress
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900" style={accentFont}>Badges Earned</h2>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-bold text-white shadow-lg cursor-pointer"
              onClick={() => window.location.href = "/achievements"}
            >
              View All ({achievements.length})
            </motion.div>
          </div>
          <p className="text-slate-600 mb-6">You've unlocked {userBadgesEarned} out of {achievements.length} total badges</p>
          <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achievements.length ? (userBadgesEarned / achievements.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
            />
          </div>
          <p className="text-sm text-slate-500 text-right">{Math.round(achievements.length ? (userBadgesEarned / achievements.length) * 100 : 0)}% Complete</p>
        </section>

        {leaderboardSet.length > 3 && (
          <section className="mt-12 space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm uppercase tracking-[0.5em] text-slate-500 flex items-center gap-2"><Zap className="h-4 w-4" /> Challengers</p>
                <h3 className="text-2xl font-black text-slate-900" style={accentFont}>Ranks 04 — {leaderboardSet.length.toString().padStart(2, "0")}</h3>
              </div>
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300">
                <Filter className="h-4 w-4" /> Export Standings
              </button>
            </motion.div>

            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {challengers.map((player) => (
                <motion.div
                  key={player.id || player.rank}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  <LeaderboardRow player={player} maxXP={maxXP} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
