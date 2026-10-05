const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Progress = require("../models/progress");

// Helper: Generate Access Token (short-lived: 15 minutes)
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

// Helper: Generate Refresh Token (long-lived: 7 days)
const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// Helper: Generate both tokens
const generateTokens = (user) => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
});

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "employee",
    });

    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🟢 LOGIN HIT:", email, password);

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    console.log("🟢 USER FOUND:", !!user);

    if (!user) {
      console.log("🔴 NO USER");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🟢 PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const freshUser = await User.findById(user._id).select("-password");

    // 🔥 FETCH PROGRESS
    const progress = await Progress.findOne({ userId: freshUser._id });

    const enrichedUser = {
      ...freshUser.toObject(),
      completedModules: progress?.completedModules || [],
      startedModules: progress?.startedModules || [],
      topics: progress?.topics || [],
    };

    const { accessToken, refreshToken } = generateTokens(freshUser);

    // Store refresh token in database
    freshUser.refreshToken = refreshToken;
    await freshUser.save();

    res.json({
      user: enrichedUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("🔴 LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// REFRESH TOKEN
exports.refreshUserToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

// LOGOUT
exports.logoutUser = async (req, res) => {
  try {
    const user = req.user;
    user.refreshToken = null;
    await user.save();

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
