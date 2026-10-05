import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../utils/axios";
import TowerHUD from "../../components/knowledgeRunner/TowerHUD";
import TowerScene from "../../components/knowledgeRunner/TowerScene";
import ChallengePanel from "../../components/knowledgeRunner/ChallengePanel";
import GameOver from "../../components/GameOver";

const API_URL = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api`;

export default function KnowledgeRunner() {
  const { token } = useAuth();
  const { moduleId } = useParams();

  const [gameStatus, setGameStatus] = useState("loading"); // loading, playing, falling, victory, defeat
  const [sessionId, setSessionId] = useState(null);
  const [moduleName, setModuleName] = useState("Loading...");
  const [gameState, setGameState] = useState({
    totalQuestions: 0,
    currentQuestionIndex: 0,
    livesRemaining: 3,
    score: 0,
    correctAnswers: 0,
    accuracy: 0,
    currentQuestion: null,
  });

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [results, setResults] = useState(null);
  const [incomingResult, setIncomingResult] = useState(null);
  const [shakeTower, setShakeTower] = useState(false);
  const [showLevelUpFx, setShowLevelUpFx] = useState(false);
  const [showHitFx, setShowHitFx] = useState(false);

  const previousLivesRef = useRef(3);
  const previousCorrectRef = useRef(0);

  const totalLevels = Math.max(10, gameState.totalQuestions || 10);
  const playerLevel = Math.min(gameState.correctAnswers || 0, totalLevels);

  useEffect(() => {
    if (gameState.livesRemaining < previousLivesRef.current) {
      setShakeTower(true);
      setShowHitFx(true);
      const timeout = setTimeout(() => setShakeTower(false), 360);
      const fxTimeout = setTimeout(() => setShowHitFx(false), 430);
      previousLivesRef.current = gameState.livesRemaining;
      return () => {
        clearTimeout(timeout);
        clearTimeout(fxTimeout);
      };
    }
    previousLivesRef.current = gameState.livesRemaining;
  }, [gameState.livesRemaining]);

  useEffect(() => {
    if (gameState.correctAnswers > previousCorrectRef.current) {
      setShowLevelUpFx(true);
      const timeout = setTimeout(() => setShowLevelUpFx(false), 900);
      previousCorrectRef.current = gameState.correctAnswers;
      return () => clearTimeout(timeout);
    }
    previousCorrectRef.current = gameState.correctAnswers;
  }, [gameState.correctAnswers]);

  /* =========================================
     FETCH MODULE NAME
  ========================================= */
  useEffect(() => {
    const fetchModuleName = async () => {
      try {
        const res = await fetch(`${API_URL}/modules/${moduleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data && data.title) {
          setModuleName(data.title);
        }
      } catch (error) {
        console.error("Failed to fetch module:", error);
        setModuleName("Game");
      }
    };

    if (moduleId && token) {
      fetchModuleName();
    }
  }, [moduleId, token]);

  /* =========================================
     START GAME
  ========================================= */
  useEffect(() => {
    const startGame = async () => {
      try {
        const res = await fetch(`${API_URL}/game/retry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ moduleId }),
        });

        const data = await res.json();
        if (data.success) {
          setSessionId(data.sessionId);
          setGameState(data.gameState);
          setGameStatus("playing");
        }
      } catch (error) {
        console.error("Failed to start game:", error);
        setGameStatus("error");
      }
    };

    if (moduleId && token && gameStatus === "loading") {
      startGame();
    }
  }, [moduleId, token, gameStatus]);

  /* =========================================
     SUBMIT ANSWER
  ========================================= */
  const handleSubmitAnswer = useCallback(
    async (answerIndex) => {
      if (selectedAnswer !== null || answerSubmitted) return;

      setSelectedAnswer(answerIndex);
      setAnswerSubmitted(true);

      try {
        const res = await fetch(`${API_URL}/game/answer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId, answerIndex }),
        });

        const data = await res.json();
        if (data.success) {
          playFeedbackSound(data.answerCorrect);

          setTimeout(() => {
            if (data.gameEnded) {
              if (data.gameState.won) {
                setResults(data.gameState);
                setGameStatus("victory");
              } else {
                setGameState(data.gameState);
                setIncomingResult(data.gameState);
                setGameStatus("falling");

                setTimeout(() => {
                  setResults(data.gameState);
                  setIncomingResult(null);
                  setGameStatus("defeat");
                }, 1400);
              }
            } else {
              setGameState(data.gameState);
              setSelectedAnswer(null);
              setAnswerSubmitted(false);
            }
          }, 1200);
        }
      } catch (error) {
        console.error("Failed to submit answer:", error);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
      }
    },
    [selectedAnswer, answerSubmitted, sessionId, token]
  );

  /* =========================================
     RETRY GAME
  ========================================= */
  const handleRetry = async () => {
    try {
      const res = await fetch(`${API_URL}/game/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moduleId }),
      });

      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setGameState(data.gameState);
        setGameStatus("playing");
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setResults(null);
        setIncomingResult(null);
      }
    } catch (error) {
      console.error("Failed to retry game:", error);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!results?.certificateId || !token) return;

    try {
      const res = await API.get(
        `/certificates/download/${results.certificateId}`
      );

      if (!res.ok) {
        throw new Error("Failed to download certificate");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${moduleName || "certificate"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Certificate download failed:", error);
      alert("Could not download certificate. Please try again.");
    }
  };

  /* =========================================
     SOUND
  ========================================= */
  const playFeedbackSound = (isCorrect) => {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    if (isCorrect) {
      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
      oscillator.frequency.value = 300;
      gain.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  if (gameStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Starting Knowledge Runner...</p>
        </motion.div>
      </div>
    );
  }

  if (gameStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-400"
        >
          <p className="text-lg mb-4">Failed to start the game</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameStatus === "victory" || gameStatus === "defeat") {
    return (
      <GameOver
        status={gameStatus}
        results={results}
        moduleName={moduleName}
        onRetry={handleRetry}
        onDownloadCertificate={handleDownloadCertificate}
        onExit={() => window.history.back()}
      />
    );
  }

  if (gameStatus === "falling") {
    const fallingLevel = Math.max(0, incomingResult?.correctAnswers || gameState.correctAnswers || 0);
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#111827] via-[#241547] to-[#090f1f] flex items-center justify-center px-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-black text-white text-center">Knowledge Runner</h1>
          <p className="text-center text-rose-300 mt-2 mb-6 text-lg">All lives lost. You slipped from the tower.</p>

          <div className="relative h-[70vh] rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-indigo-950/80 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 20% 20%, #67e8f9 0, transparent 35%), radial-gradient(circle at 80% 10%, #a78bfa 0, transparent 30%), radial-gradient(circle at 50% 90%, #fb7185 0, transparent 25%)"
            }} />

            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-24 bg-gradient-to-b from-cyan-500/20 via-indigo-500/30 to-purple-500/20 border-x border-cyan-300/20" />

            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              initial={{ bottom: `${Math.max(8, (fallingLevel / totalLevels) * 85)}%`, rotate: 0 }}
              animate={{ bottom: "-8%", rotate: 80 }}
              transition={{ duration: 1.2, ease: "easeIn" }}
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-300 to-rose-500 shadow-[0_0_30px_rgba(251,113,133,0.8)] flex items-center justify-center text-slate-900 font-black text-lg">
                KR
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#130f09]">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 16% 14%, rgba(245,158,11,0.2), transparent 34%), radial-gradient(circle at 84% 18%, rgba(220,38,38,0.16), transparent 40%), linear-gradient(180deg, rgba(36,23,9,0.55) 0%, rgba(20,12,6,0.25) 40%, rgba(17,10,5,0.75) 100%)",
        }}
      />

      <TowerHUD
        gameState={gameState}
        moduleName={moduleName}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      <div className="relative z-10 mx-auto h-[calc(100vh-6.5rem)] w-full max-w-7xl px-3 pb-44 pt-24 md:h-[calc(100vh-7rem)] md:px-6 md:pb-8 md:pt-28">
        <div className="h-full w-full md:grid md:grid-cols-[minmax(0,1fr)_24rem] md:gap-6">
          <div className="h-full min-h-0">
            <TowerScene
              totalLevels={totalLevels}
              climbedLevels={playerLevel}
              stage={gameState.currentQuestionIndex + 1}
              shake={shakeTower}
              levelUpFx={showLevelUpFx}
              hitFx={showHitFx}
              gameStatus={gameStatus}
            />
          </div>

          <div className="hidden md:flex md:items-end md:justify-end md:pb-2">
            <ChallengePanel
              question={gameState.currentQuestion}
              onAnswerSelect={handleSubmitAnswer}
              selectedAnswer={selectedAnswer}
              isSubmitted={answerSubmitted}
              isCorrect={selectedAnswer === gameState.currentQuestion?.correctIndex}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-7xl justify-center px-3 pb-3 md:hidden">
        <ChallengePanel
          question={gameState.currentQuestion}
          onAnswerSelect={handleSubmitAnswer}
          selectedAnswer={selectedAnswer}
          isSubmitted={answerSubmitted}
          isCorrect={selectedAnswer === gameState.currentQuestion?.correctIndex}
        />
      </div>
    </div>
  );
}
