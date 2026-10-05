const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
} = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshUserToken);
router.post("/logout", auth, logoutUser);

module.exports = router;
