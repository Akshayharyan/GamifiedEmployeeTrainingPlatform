import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Lock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import bgImage from "../assets/bg.png";

function QuestList() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [quests, setQuests] = useState([]);
  const [moduleTitle, setModuleTitle] = useState("");

  useEffect(() => {
    async function fetchQuests() {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/${moduleId}/quests`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await res.json();
        setModuleTitle(data.moduleTitle || "Quest Path");
        setQuests(data.quests || []);
      } catch (err) {
        console.error("Error loading quests:", err);
      }
    }
    fetchQuests();
  }, [moduleId]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden font-[Poppins] relative">

      {/* FULL BACKGROUND (no gap below navbar) */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImage})`,
          filter: "brightness(0.60)",
          zIndex: -2,
        }}
      />

      {/* readability gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/85 z-[-1]" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center pt-0 pb-20">

        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-300 drop-shadow-[0_0_15px_rgba(255,255,0,0.45)] mb-12 text-center">
          {moduleTitle} Quest Path ⚔️
        </h1>

        {/* Quest Vertical Flow */}
        <div className="relative w-full max-w-3xl flex flex-col items-center gap-24 pb-10">

          {quests.map((quest, index) => {
            const isCompleted = quest.status === "Completed";
            const isCurrent = quest.status === "Current";
            const isLocked = quest.status === "Locked";
            const isFinal = index === quests.length - 1;

            return (
              <div key={quest.id} className="relative flex flex-col items-center">

                {/* straight line to next */}
                {index < quests.length - 1 && (
                  <div className="absolute top-full w-[4px] h-24 bg-gray-400/60 rounded-full"></div>
                )}

                {/* circle node */}
                <motion.div
                  whileHover={{ scale: isLocked ? 1 : 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    isCurrent && navigate(`/modules/${moduleId}/quests/${quest.id}`)
                  }
                  className={`w-32 h-32 md:w-40 md:h-40 rounded-full shadow-xl border-4 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300
                    ${
                      isFinal
                        ? "bg-purple-700 border-purple-400 animate-pulse"
                        : isCompleted
                        ? "bg-green-600 border-green-400"
                        : isCurrent
                        ? "bg-blue-600 border-blue-400 animate-pulse"
                        : "bg-gray-700 border-gray-600 opacity-85"
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle size={32} className="text-green-300 mb-1" />
                  ) : isCurrent ? (
                    <Star size={32} className="text-yellow-300 mb-1" />
                  ) : (
                    <Lock size={32} className="text-gray-300 mb-1" />
                  )}

                  <h3 className="text-white font-semibold px-2 text-xs md:text-sm leading-tight">
                    {quest.title}
                  </h3>
                  <p className="text-[11px] md:text-xs mt-1 text-gray-200">
                    +{quest.xp} XP
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/dashboard")}
          className="mt-12 px-10 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl font-bold text-black shadow-lg hover:shadow-yellow-400/40 border-2 border-yellow-700 transition-all"
        >
          🏰 Back to Dashboard
        </motion.button>
      </div>
    </div>
  );
}

export default QuestList;
