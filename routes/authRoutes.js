const express = require("express");
const router = express.Router();
const { register, login, logout } = require("../controllers/authController");
const { registerValidation, loginValidation } = require("../middlewares/authValidator");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const authToken = require("../middlewares/authToken");

// Register route
router.post("/register", upload.single("profileImage"), registerValidation, validate, register);

// Login route
router.post("/login", loginValidation, validate, login);

router.post("/logout", logout);

// يتحقق من تسجيل الدخول ويرجع بيانات المستخدم
router.get("/check-auth", authToken, (req, res) => {
  console.log("check-auth route called. User info:", req.user);
  res.json({ loggedIn: true, user: req.user });
});

module.exports = router;
