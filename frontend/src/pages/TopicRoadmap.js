import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Lock, CheckCircle, Zap, Trophy, Skull } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function TopicRoadmap() {

const { moduleId } = useParams();
const navigate = useNavigate();
const { token } = useAuth();

const containerRef = useRef(null);
const nodeRefs = useRef([]);

const [topics, setTopics] = useState([]);
const [moduleTitle, setModuleTitle] = useState("");
const [moduleGameType, setModuleGameType] = useState("boss-arena");
const [progressPercent, setProgressPercent] = useState(0);
const [paths, setPaths] = useState([]);
const [loading, setLoading] = useState(true);

/* ================= FETCH TOPICS ================= */

useEffect(() => {

const fetchTopics = async () => {
  if (!token) {
    console.warn("⚠️ No token available for TopicRoadmap");
    setLoading(false);
    return;
  }

  try {

    const res = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/${moduleId}/topics`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    setTopics(data.topics || []);
    setModuleTitle(data.moduleTitle || "Learning Path");
    setModuleGameType(data.gameType || "boss-arena");
    setProgressPercent(data.progressPercent || 0);

  } catch (err) {
    console.error("Error loading topics:", err);
  }

  setLoading(false);

};

fetchTopics();

}, [moduleId, token]);

/* ================= BOSS UNLOCK ================= */

const bossUnlocked =
topics.length > 0 &&
topics.every((t) => t.status === "completed");

const isCssModule = (moduleTitle || "").toLowerCase().includes("css");

const handleFinalBattleClick = () => {
  // Keep CSS module flow on the existing BossBattleArena path (uses CSS-specific game inside).
  if (isCssModule) {
    navigate(`/employee/boss/${moduleId}`, { state: { moduleTitle } });
    return;
  }

  if (moduleGameType === "knowledge-runner") {
    navigate(`/employee/game/${moduleId}`, { state: { moduleTitle } });
    return;
  }

  navigate(`/employee/boss/${moduleId}`, { state: { moduleTitle } });
};

/* ================= CONNECTOR PATHS ================= */

useEffect(() => {

if (!containerRef.current || nodeRefs.current.length < 2) return;

const containerRect = containerRef.current.getBoundingClientRect();
const newPaths = [];

for (let i = 0; i < nodeRefs.current.length - 1; i++) {

  const from = nodeRefs.current[i];
  const to = nodeRefs.current[i + 1];

  if (!from || !to) continue;

  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();

  const x1 = a.left + a.width / 2 - containerRect.left;
  const y1 = a.top + a.height / 2 - containerRect.top;
  const x2 = b.left + b.width / 2 - containerRect.left;
  const y2 = b.top + b.height / 2 - containerRect.top;

  const curve = Math.abs(y2 - y1) * 0.4;

  newPaths.push({
    d: `M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}`,
    completed: topics[i]?.status === "completed",
    active: topics[i]?.status === "active",
  });

}

setPaths(newPaths);

}, [topics]);

if (loading) {
return (
<p className="text-center mt-32 text-gray-500 animate-pulse">
Loading learning journey…
</p>
);
}

return (
<div
ref={containerRef}
className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-purple-50 px-4 pt-24 pb-40 relative overflow-hidden"
>

  {/* HEADER */}

  <div className="text-center mb-16">

    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-100 text-indigo-600 font-semibold mb-4">
      <Trophy className="w-4 h-4" />
      {moduleTitle}
    </div>

    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
      Your Learning Journey
    </h1>

    <div className="max-w-md mx-auto">

      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">

        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
        />

      </div>

      <p className="text-sm text-gray-500 mt-2">
        {progressPercent}% Completed
      </p>

    </div>

  </div>

  {/* SVG CONNECTORS */}

  <svg className="absolute inset-0 w-full h-full pointer-events-none">

    {paths.map((p, i) => (
      <motion.path
        key={i}
        d={p.d}
        fill="none"
        stroke={
          p.completed
            ? "#22c55e"
            : p.active
            ? "#6366f1"
            : "#cbd5e1"
        }
        strokeWidth="4"
        strokeDasharray={p.completed ? "0" : "6 6"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: i * 0.2 }}
      />
    ))}

  </svg>

  {/* ROADMAP */}

  <div className="max-w-3xl mx-auto relative z-10">

    {topics.map((topic, i) => {

      const left = i % 2 === 0;

      return (

        <motion.div
          key={i}
          className={`flex mb-32 ${left ? "justify-start" : "justify-end"}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
        >

          <div className="flex items-center gap-6">

            <motion.button
              ref={(el) => (nodeRefs.current[i] = el)}
              disabled={topic.status === "locked"}
              onClick={() =>
                topic.status !== "locked" &&
                navigate(`/modules/${moduleId}/topic/${i}/video`)
              }
              animate={
                topic.status === "active"
                  ? { scale: [1, 1.1, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.6 }}
              className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-white shadow-2xl
                ${
                  topic.status === "completed"
                    ? "bg-emerald-500"
                    : topic.status === "active"
                    ? "bg-indigo-500 ring-4 ring-indigo-300"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
            >

              {topic.status === "completed" && <CheckCircle />}
              {topic.status === "active" && <Play />}
              {topic.status === "locked" && <Lock />}

            </motion.button>

            <div className="bg-white rounded-3xl p-6 w-80 shadow-xl border">

              <h3 className="font-bold text-gray-900 text-lg mb-3">
                {topic.title}
              </h3>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                <Zap className="w-3 h-3" />
                {topic.xp} XP
              </span>

            </div>

          </div>

        </motion.div>

      );

    })}

    {/* FINAL BOSS */}

    <motion.div
      className="flex justify-center mt-32"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >

      <div
        className={`rounded-3xl p-10 text-center w-96 shadow-2xl
          ${
            bossUnlocked
              ? "bg-gradient-to-br from-red-600 to-purple-700 text-white"
              : "bg-gray-200 text-gray-400"
          }`}
      >

        <div className="flex justify-center mb-4">

          <motion.div
            animate={bossUnlocked ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Skull size={56} />
          </motion.div>

        </div>

        <h2 className="text-2xl font-extrabold mb-3">
          FINAL BOSS
        </h2>

        <p className="mb-6 text-sm opacity-80">
          Defeat the boss to complete the module
        </p>

        <button
          disabled={!bossUnlocked}
          onClick={handleFinalBattleClick}
          className={`px-6 py-3 rounded-xl font-bold shadow-lg
            ${
              bossUnlocked
                ? "bg-white text-purple-700 hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          ⚔ Enter Boss Arena
        </button>

      </div>

    </motion.div>

  </div>

</div>

);
}