import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  ExternalLink,
  Play,
  Lock,
  Zap,
  ShieldCheck,
  Pause,
  RotateCcw,
  Rewind,
  FastForward,
  Bookmark,
  Sparkles,
  Clock,
  Layers,
} from "lucide-react";
import ModuleLoadingScreen from "../../components/ModuleLoadingScreen";

const accentFont = {
  fontFamily: "'Space Grotesk','Clash Display','Segoe UI',sans-serif",
};

export default function TopicVideoPage() {
  const { moduleId, topicIndex } = useParams();
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();

  const [topic, setTopic] = useState(null);
  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const [markedComplete, setMarkedComplete] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const safePlayerCall = useCallback((callback, fallbackValue = null) => {
    try {
      if (!player || typeof callback !== "function") return fallbackValue;
      const value = callback(player);
      return value === undefined ? fallbackValue : value;
    } catch (error) {
      return fallbackValue;
    }
  }, [player]);

  useEffect(() => {
    const fetchTopic = async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/${moduleId}/topics/${topicIndex}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setTopic(data || null);
    };

    fetchTopic();
  }, [moduleId, topicIndex, token]);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(async () => {
      const nextDuration = safePlayerCall((p) => p.getDuration(), 0);
      const current = safePlayerCall((p) => p.getCurrentTime(), 0);

      if (nextDuration > 0) {
        setDuration(nextDuration);
      }

      if (current >= 0) {
        setCurrentTime(current);
      }

      if (nextDuration > 0) {
        const percent = Math.floor((current / nextDuration) * 100);
        setProgress(percent);

        if (percent >= 90 && !markedComplete) {
          setCanProceed(true);
          setMarkedComplete(true);
          clearInterval(interval);

          await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/complete-video`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              moduleId,
              topicIndex: Number(topicIndex),
            }),
          });

          await refreshUser();
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [player, markedComplete, moduleId, topicIndex, token, refreshUser, safePlayerCall]);

  const getVideoSource = (url) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      const host = String(parsed.hostname || "").toLowerCase();

      if (host.includes("youtu.be")) {
        const id = parsed.pathname.replace("/", "");
        return id ? { provider: "youtube", id, url } : null;
      }

      if (host.includes("youtube.com")) {
        if (parsed.pathname.includes("/embed/")) {
          const id = parsed.pathname.split("/embed/")[1];
          return id ? { provider: "youtube", id, url } : null;
        }

        const watchId = parsed.searchParams.get("v");
        if (watchId) return { provider: "youtube", id: watchId, url };
      }

      return { provider: "external", id: null, url };
    } catch {
      if (url.includes("/embed/")) {
        const id = url.split("/embed/")[1];
        if (id) return { provider: "youtube", id, url };
      }

      if (url.includes("watch?v=")) {
        const id = url.split("watch?v=")[1].split("&")[0];
        if (id) return { provider: "youtube", id, url };
      }

      return { provider: "external", id: null, url };
    }
  };

  const markVideoComplete = async () => {
    await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/modules/complete-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        moduleId,
        topicIndex: Number(topicIndex),
      }),
    });

    await refreshUser();

    setProgress(100);
    setCanProceed(true);
    setMarkedComplete(true);
  };

  const togglePlayback = () => {
    if (!player) return;

    if (isPlaying) {
      safePlayerCall((p) => p.pauseVideo());
      setPlayRequested(false);
    } else {
      setPlayRequested(true);
      safePlayerCall((p) => p.playVideo());
    }
  };

  const restartLesson = () => {
    if (!player) return;
    safePlayerCall((p) => p.seekTo(0, true));
    setPlayRequested(true);
    safePlayerCall((p) => p.playVideo());
  };

  const jumpBySeconds = (seconds) => {
    if (!player || duration <= 0) return;
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    safePlayerCall((p) => p.seekTo(target, true));
    setCurrentTime(target);
    if (duration > 0) {
      setProgress(Math.floor((target / duration) * 100));
    }
  };

  const seekToPercent = (percent) => {
    if (!player || duration <= 0) return;
    const normalized = Math.max(0, Math.min(100, Number(percent) || 0));
    const target = (normalized / 100) * duration;
    safePlayerCall((p) => p.seekTo(target, true));
    setCurrentTime(target);
    setProgress(Math.floor(normalized));
  };

  const formatTime = (value) => {
    const total = Math.max(0, Math.floor(Number(value) || 0));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  if (!topic) {
    return (
      <ModuleLoadingScreen
        title="Loading lesson"
        subtitle="Preparing video, checkpoints, and progress sync..."
      />
    );
  }

  const videoSource = getVideoSource(topic.videoUrl);
  const provider = videoSource?.provider || null;
  const videoId = provider === "youtube" ? videoSource.id : null;
  const difficulty = topic.difficulty || topic.level || "Intermediate";
  const estimatedTime = topic.duration || topic.estimatedTime || "12 min";
  const lessonTags = Array.isArray(topic.tags)
    ? topic.tags
    : Array.isArray(topic.keywords)
    ? topic.keywords.slice(0, 3)
    : ["Async", "Promises", "Debugging"];
  const checklist = Array.isArray(topic.objectives) && topic.objectives.length
    ? topic.objectives
    : [
        "Understand the core concept",
        "Watch demo implementation",
        "Note down tricky edge cases",
      ];
  const stats = [
    {
      label: "Watch Streak",
      value: `${progress}% complete`,
      icon: <Zap className="w-3.5 h-3.5 text-emerald-300" />,
    },
    {
      label: "Difficulty",
      value: difficulty,
      icon: <Layers className="w-3.5 h-3.5 text-sky-300" />,
    },
    {
      label: "Est. Time",
      value: estimatedTime,
      icon: <Clock className="w-3.5 h-3.5 text-amber-300" />,
    },
  ];

  if (!videoSource?.url) {
    return (
      <p className="text-center mt-32 text-red-500">
        Video not available for this topic.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-purple-50 px-4 pt-14 pb-24 lg:pt-12">
      <div className="max-w-4xl mx-auto mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          Cinematic Lesson Mode
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          {topic.title}
        </h1>

        <p className="text-gray-600 max-w-2xl mx-auto">
          Watch at least 90% of the lesson to unlock quizzes and coding challenges.
        </p>
      </div>

      <div className="max-w-7xl w-full mx-auto mb-10">
        <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-[1px] shadow-[0_40px_80px_rgba(15,23,42,0.35)]">
          <div className="rounded-[30px] bg-slate-950/80 backdrop-blur-xl p-6 lg:p-12 flex flex-col lg:flex-row gap-10 text-white">
            <div className="flex-1 space-y-5">
              <div className="relative overflow-hidden rounded-[34px] ring-1 ring-white/10 shadow-2xl" style={{ minHeight: 420 }}>
                <div className="relative w-full" style={{ paddingBottom: "45%" }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none z-10" />
                  {provider === "youtube" && !videoError ? (
                    <YouTube
                      videoId={videoId}
                      opts={{
                        width: "100%",
                        height: "100%",
                        host: "https://www.youtube-nocookie.com",
                        playerVars: {
                          autoplay: 0,
                          rel: 0,
                          controls: 0,
                          disablekb: 1,
                          modestbranding: 1,
                          iv_load_policy: 3,
                          fs: 0,
                          playsinline: 1,
                        },
                      }}
                      className="absolute inset-0 h-full w-full"
                      onReady={(e) => {
                        setPlayer(e.target);
                        const loadedDuration = safePlayerCall((p) => p.getDuration(), 0);
                        setDuration(loadedDuration || 0);
                        setIsPlaying(false);
                        setPlayRequested(false);
                      }}
                      onStateChange={(e) => {
                        const state = e?.data;
                        if (state === 1) {
                          setIsPlaying(true);
                          return;
                        }
                        if (state === 2 || state === 0) {
                          setIsPlaying(false);
                          setPlayRequested(false);
                        }
                      }}
                      onError={() => {
                        setVideoError(true);
                        setPlayer(null);
                        setIsPlaying(false);
                        setPlayRequested(false);
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-emerald-200">
                        <ExternalLink className="w-4 h-4" />
                        External lesson source detected
                      </div>
                      <p className="text-slate-300 max-w-md text-center px-6">
                        This topic uses a non-YouTube lesson source. Open the lesson in a new tab, complete it, then use manual completion to unlock challenges.
                      </p>
                      <a
                        href={videoSource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-900"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Lesson Source
                      </a>
                    </div>
                  )}
                </div>
                <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold z-20">
                  <Play className="w-4 h-4" />
                  Guided Lesson
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 py-4 text-sm z-20">
                  <span className="font-semibold tracking-wide">{estimatedTime} runtime</span>
                  <span className="text-white/70">Difficulty • {difficulty}</span>
                </div>

                {provider === "youtube" && !videoError && !isPlaying && (
                  <div className="absolute inset-0 z-20 bg-slate-950/85 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="inline-flex items-center gap-3 rounded-full border border-white/35 bg-white/20 px-6 py-3 text-white font-semibold hover:bg-white/30"
                    >
                      <Play className="w-5 h-5" />
                      {playRequested ? "Loading Lesson" : "Start Lesson"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                      {item.icon}
                      <p className="uppercase tracking-[0.3em] text-[10px]">{item.label}</p>
                    </div>
                    <p className="mt-2 text-xl font-black" style={accentFont}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="w-full lg:w-72 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Lesson Focus</p>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  {checklist.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Lesson Tags</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lessonTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20 transition">
                <Bookmark className="w-4 h-4" />
                Save lesson to queue
              </button>
            </aside>
          </div>

          {provider === "youtube" && !videoError && (
            <div className="px-6 pb-6 text-white">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between text-xs md:text-sm text-slate-200">
                  <div className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    SkillQuest Player
                  </div>
                  <div>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.min(100, Math.max(0, progress))}
                  onChange={(e) => seekToPercent(e.target.value)}
                  className="w-full accent-indigo-400"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/60">Playback</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => jumpBySeconds(-10)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                    >
                      <Rewind className="w-4 h-4" />
                      -10s
                    </button>
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpBySeconds(10)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                    >
                      <FastForward className="w-4 h-4" />
                      +10s
                    </button>
                    <button
                      type="button"
                      onClick={restartLesson}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-600 font-medium">Lesson Progress</span>
          <span className="font-bold text-indigo-600">{progress}%</span>
        </div>

        <div className="h-4 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!canProceed && !videoError && provider === "youtube" && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Watch at least 90% to continue
          </p>
        )}

        {!canProceed && (provider !== "youtube" || videoError) && (
          <div className="mt-4 flex flex-col items-start gap-3 text-sm">
            <p className="text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {videoError
                ? "Embedded playback failed, so you can manually unlock this lesson."
                : "This source is outside the in-app player. Use manual completion after finishing the lesson."}
            </p>

            <button
              onClick={markVideoComplete}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 font-semibold text-white shadow-lg"
            >
              <Zap className="w-4 h-4" />
              Mark Video Complete
            </button>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <button
          disabled={!canProceed}
          onClick={() =>
            navigate(`/modules/${moduleId}/topic/${topicIndex}/challenges`)
          }
          className={`
            inline-flex items-center gap-2 px-10 py-4 rounded-full text-lg font-semibold
            transition
            ${
              canProceed
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:scale-105 shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          <Zap className="w-5 h-5" />
          {canProceed ? "Start Quiz & Coding" : "Finish Video to Unlock"}
        </button>
      </div>
    </div>
  );
}
