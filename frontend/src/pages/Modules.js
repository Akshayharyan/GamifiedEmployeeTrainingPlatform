import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Modules() {

const { token } = useAuth();
const navigate = useNavigate();

const [modules, setModules] = useState([]);
const [loading, setLoading] = useState(true);

/* ================= FETCH ================= */

useEffect(() => {

const fetchModules = async () => {
  try {

    const res = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    setModules(data.modules || []);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

if (token) {
  fetchModules();
}

}, [token]);

/* ================= ACTION ================= */

const handleAction = async (mod) => {

if (!mod.started) {
  await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ moduleId: mod._id })
  });
}

navigate(`/modules/${mod._id}/topics`);

};

/* ================= LOADING ================= */

if (loading) {
return (
<div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
<div className="animate-pulse text-xl font-semibold text-indigo-600">
Loading Learning Universe...
</div>
</div>
);
}

/* ================= UI ================= */

return (
<div
className="
min-h-screen
bg-gradient-to-br
from-indigo-50 via-sky-50 to-purple-100
px-10 py-12
"
>

  {/* HEADER */}

  <div className="mb-12">

    <h1
      className="
      text-5xl font-extrabold
      bg-gradient-to-r
      from-indigo-600 to-purple-600
      bg-clip-text text-transparent
      "
    >
      🚀 Learning Command Center
    </h1>

    <p className="text-gray-600 mt-3 text-lg">
      Level up your skills. Defeat modules. Unlock bosses.
    </p>

  </div>

  {/* GRID */}

  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">

    {modules.map((mod) => {

      let status = "not_started";
      if (mod.completed) status = "completed";
      else if (mod.started) status = "in_progress";

      const progress = mod.progressPercent || 0;

      return (

        <div
          key={mod._id}
          className="group relative"
        >

          <div
            className="
            pointer-events-none absolute inset-0 rounded-[2.75rem]
            bg-gradient-to-r from-indigo-500/25 via-sky-400/15 to-fuchsia-500/25
            opacity-0 blur-3xl
            transition-all duration-700
            group-hover:opacity-80
            "
            aria-hidden="true"
          />

          <div
            className="
            relative rounded-[2.2rem] p-[1.5px]
            bg-gradient-to-br from-white/70 via-white/10 to-white/40
            border border-white/30
            shadow-[0_20px_60px_rgba(15,23,42,0.08)]
            group-hover:shadow-[0_25px_70px_rgba(79,70,229,0.25)]
            transition-all duration-500
            hover:-translate-y-3
            overflow-hidden
            "
          >

            <div className="relative rounded-[2rem] bg-white/85 backdrop-blur-2xl p-7 overflow-hidden">

              <div
                className="
                pointer-events-none absolute inset-x-8 top-6 h-px
                bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent
                opacity-0 group-hover:opacity-100
                transition duration-500
                "
                aria-hidden="true"
              />

              <div
                className="
                pointer-events-none absolute -top-10 right-0 h-32 w-32
                bg-indigo-400/30 blur-3xl rounded-full
                opacity-0 group-hover:opacity-70
                transition duration-700
                "
                aria-hidden="true"
              />

            {/* STATUS */}

            <div className="flex justify-between mb-5">

              <span className="text-sm text-gray-500">
                Skill Module
              </span>

              <span
                className={`
                px-3 py-1 rounded-full text-xs font-bold
                ${
                  status === "completed"
                    ? "bg-green-100 text-green-700"
                    : status === "in_progress"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600"
                }
                `}
              >
                {status === "completed"
                  ? "Completed"
                  : status === "in_progress"
                  ? "In Progress"
                  : "Not Started"}
              </span>

            </div>

            {/* TITLE */}

            <h2
              className="
              text-2xl font-bold text-gray-900
              tracking-tight
              group-hover:text-indigo-600
              transition
              "
            >
              {mod.title}
            </h2>

            <p className="text-gray-600 mt-2 text-sm min-h-[40px]">
              {mod.description}
            </p>

            {/* PROGRESS */}

            <div className="mt-6">

              <div className="flex justify-between text-sm mb-2">

                <span className="font-medium text-gray-600">
                  Progress
                </span>

                <span className="font-bold text-indigo-600">
                  {progress}%
                </span>

              </div>

              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">

                <div
                  style={{ width: `${progress}%` }}
                  className="
                  h-full rounded-full
                  bg-gradient-to-r
                  from-indigo-500
                  via-purple-500
                  to-pink-500
                  transition-all duration-700
                  animate-pulse
                  "
                />

              </div>

            </div>

            {/* XP BADGE */}

            <div className="mt-6 flex justify-between items-center">

              <div
                className="
                px-4 py-2 rounded-full
                bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300
                text-white font-bold text-sm shadow-[0_8px_25px_rgba(249,115,22,0.35)]
                "
              >
                ⚡ {mod.totalXp || 100} XP
              </div>

              <button
                onClick={() => handleAction(mod)}
                className="
                px-6 py-2
                rounded-xl
                font-semibold
                text-white
                bg-gradient-to-r
                from-indigo-600
                to-purple-600
                hover:scale-105
                hover:shadow-lg
                transition
                "
              >
                {status === "completed"
                  ? "Review"
                  : status === "not_started"
                  ? "Start"
                  : "Continue"}
              </button>

            </div>

            </div>

          </div>
        </div>

      );
    })}

  </div>

</div>

);
}