import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function QuickActions({ modules = [], fetchData }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { token } = useAuth();

  // Start Module API call
  const startModule = async (moduleObj) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleId: moduleObj.id,
          moduleTitle: moduleObj.title,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Started module: ${moduleObj.title}`);
        fetchData(); // refresh dashboard
        setShowModal(false);
      } else {
        alert(data.message || "Error starting module");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>

      <div className="flex gap-4">
        {/* START MODULE BUTTON */}
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 py-3 border border-gray-600 text-purple-400 rounded-lg hover:bg-purple-500/20 transition"
        >
          Start New Module
        </button>

        {/* LEADERBOARD BUTTON */}
        <button
          onClick={() => navigate("/leaderboard")}
          className="flex-1 py-3 border border-gray-600 text-purple-400 rounded-lg hover:bg-purple-500/20 transition"
        >
          View Leaderboard
        </button>
      </div>

      {/* MODULE PICKER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-[#1e293b] p-6 rounded-xl w-96 text-white shadow-xl">
            <h3 className="text-xl font-bold mb-4">Select a Module</h3>

            {modules.length === 0 && (
              <p className="text-gray-400">No modules available.</p>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {modules.map((m) => (
                <button
                  key={m.id}
                  disabled={loading}
                  onClick={() => startModule(m)}
                  className="w-full text-left p-3 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg transition"
                >
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-sm text-gray-300">
                    {m.quests.length} quests • {m.xp} XP
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickActions;
