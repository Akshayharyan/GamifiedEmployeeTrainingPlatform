import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Gamepad2, Swords, Loader, CheckCircle, AlertCircle } from "lucide-react";

export default function TrainerGamePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGame, setSelectedGame] = useState("boss-arena");
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  /* =========================================
     LOAD MODULE DETAILS
  ========================================= */
  useEffect(() => {
    const loadModule = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/${moduleId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();
        if (data) {
          setModule(data);
          setSelectedGame(data.gameType || "boss-arena");
        }
      } catch (error) {
        console.error("Error loading module:", error);
      } finally {
        setLoading(false);
      }
    };

    if (moduleId && token) {
      loadModule();
    }
  }, [moduleId, token]);

  /* =========================================
     SAVE GAME TYPE
  ========================================= */
  const handleSaveGameType = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/${moduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameType: selectedGame,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlert({
          type: "success",
          message: `✓ Successfully saved "${selectedGame === 'boss-arena' ? 'Boss Battle Arena' : 'Knowledge Runner'}" for this module!`
        });
        setTimeout(() => {
          navigate(`/trainer`);
        }, 1500);
      } else {
        const errorData = await res.json();
        setAlert({
          type: "error",
          message: `✗ Failed to save: ${errorData.message || "Unknown error"}`
        });
      }
    } catch (error) {
      console.error("Error saving game type:", error);
      setAlert({
        type: "error",
        message: `✗ Error: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/trainer")}
            className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-wider">Game Selection</p>
            <h1 className="text-3xl font-bold text-white">{module?.title}</h1>
          </div>
        </div>

        {/* Alert Box */}
        {alert && (
          <div className={`mb-6 p-4 rounded-lg border-2 flex items-center gap-3 ${
            alert.type === 'success'
              ? 'bg-green-500/10 border-green-500 text-green-300'
              : 'bg-red-500/10 border-red-500 text-red-300'
          }`}>
            {alert.type === 'success' ? (
              <CheckCircle size={20} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0" />
            )}
            <p className="font-medium">{alert.message}</p>
          </div>
        )}

        {/* Game Options */}
        <div className="space-y-6">
          <p className="text-slate-300 mb-6">Choose which game type employees will play for this module:</p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Boss Arena Option */}
            <div
              onClick={() => setSelectedGame("boss-arena")}
              className={`cursor-pointer p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                selectedGame === "boss-arena"
                  ? "border-red-500 bg-red-500/10"
                  : "border-slate-600 bg-slate-800/50 hover:border-red-400"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-500/20">
                  <Swords size={28} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Boss Battle Arena</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Epic boss fight experience. Employees battle a boss and answer MCQs to deal damage.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">✓ Multi-phase boss fights</p>
                    <p className="text-xs text-slate-400">✓ Dynamic difficulty scaling</p>
                    <p className="text-xs text-slate-400">✓ Challenging & engaging</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="game"
                  value="boss-arena"
                  checked={selectedGame === "boss-arena"}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Knowledge Runner Option */}
            <div
              onClick={() => setSelectedGame("knowledge-runner")}
              className={`cursor-pointer p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                selectedGame === "knowledge-runner"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-slate-600 bg-slate-800/50 hover:border-purple-400"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Gamepad2 size={28} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Knowledge Runner</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Modern endless runner game. Employees answer 20 MCQs without losing 3 lives.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">✓ 3 lives system</p>
                    <p className="text-xs text-slate-400">✓ Real-time scoring</p>
                    <p className="text-xs text-slate-400">✓ Modern game aesthetics</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="game"
                  value="knowledge-runner"
                  checked={selectedGame === "knowledge-runner"}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Game Details Card */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Current Selection</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Game Type:</p>
                <p className="text-white font-semibold">
                  {selectedGame === "boss-arena" ? "🗡️ Boss Battle Arena" : "🎮 Knowledge Runner"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">Topic Count:</p>
                <p className="text-white font-semibold">
                  {module?.topics?.length || 0} topics
                </p>
              </div>
            </div>

            {selectedGame === "boss-arena" && (
              <p className="text-xs text-amber-300 mt-4">
                ⚠️ Make sure you configure a Boss beforehand for this module.
              </p>
            )}
            
            {selectedGame === "knowledge-runner" && (
              <p className="text-xs text-green-300 mt-4">
                ✓ No additional setup needed. MCQs will be automatically extracted from topics.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => navigate("/trainer")}
              className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-semibold hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGameType}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader size={18} className="animate-spin" />}
              Save Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
