require("dotenv").config({
  path: require("path").resolve(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");

// ===============================
// INIT
// ===============================
const app = express();
connectDB();

// ===============================
// DEBUG
// ===============================
console.log("ENV LOADED:", process.env.OPENAI_API_KEY ? "YES" : "NO");

// ===============================
// IMPORT ROUTES
// ===============================
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const questRoutes = require("./routes/questRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const activityRoutes = require("./routes/activityRoutes");
const userRoutes = require("./routes/userRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const graderRoutes = require("./routes/graderRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const moduleProgressRoutes = require("./routes/moduleProgressRoutes");
const judgeRoutes = require("./routes/judgeRoutes");
const codeRoutes = require("./routes/codeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

// 🔥 NEW CLEAN BOSS ROUTES
console.log("Loading trainerBossRoutes...");
const trainerBossRoutes = require("./routes/trainerBossRoutes");
console.log("trainerBossRoutes loaded:", typeof trainerBossRoutes);
const bossBattleRoutes = require("./routes/bossRoutes");         // Employee battle side

// 🎮 MCQ BATTLE ROUTES
const mcqBattleRoutes = require("./routes/mcqBattleRoutes");

// 🎮 KNOWLEDGE RUNNER GAME ROUTES
const gameRoutes = require("./routes/gameRoutes");

// ===============================
// MIDDLEWARE
// ===============================
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Serve boss images statically
app.use(
  "/bosses",
  express.static(path.join(__dirname, "../frontend/public/bosses"))
);

// ===============================
// REGISTER ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/grader", graderRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/certificates", certificateRoutes);

app.use("/api/achievements", achievementRoutes);
app.use("/api/judge", judgeRoutes);

// ===============================
// 🔥 BOSS SYSTEM (CLEAN STRUCTURE)
// ===============================

// Trainer Boss Designer
app.use("/api/trainer/boss", trainerBossRoutes);

// Employee Boss Battle
app.use("/api/boss", bossBattleRoutes);

// ===============================
// 🎮 MCQ BATTLE SYSTEM
// ===============================
app.use("/api/mcq-battle", mcqBattleRoutes);

// ===============================
// 🎮 KNOWLEDGE RUNNER GAME SYSTEM
// ===============================
app.use("/api/game", gameRoutes);

// Module progress (keep near end)
app.use("/api", moduleProgressRoutes);

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("API running");
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});