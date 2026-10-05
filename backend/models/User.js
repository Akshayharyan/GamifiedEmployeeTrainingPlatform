const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "https://avatar.iran.liara.run/public",
    },

    /* ================= GAMIFICATION ================= */
    xp: {
      type: Number,
      default: 0,
    },

    level: {
      type: Number,
      default: 1,
    },

    badges: {
      type: [String],
      default: [],
    },

    /* ================= USER META ================= */
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },

    role: {
      type: String,
      enum: ["admin", "trainer", "employee"],
      default: "employee",
    },

    /* ================= TOKENS ================= */
    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/* ================= PASSWORD HASH ================= */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* ================= PASSWORD MATCH ================= */
userSchema.methods.matchPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

/* ================= HIDE PASSWORD ================= */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
