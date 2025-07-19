const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { username, email, password, gender, dateOfBirth, country } = req.body;
    const profileImage = req.file?.filename || "profile.png";

    const emailLower = email.toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashPass = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email: emailLower,
      password: hashPass,
      gender,
      dateOfBirth,
      country,
      profileImage,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, userName: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Log the token for debugging
    console.log("Login successful, setting cookie with token:", token);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None", // لجعل الكوكيز cross-site
      secure: true,     // يجب HTTPS في البيئة الحية
      maxAge: 24 * 60 * 60 * 1000, // 1 يوم
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, logout };
