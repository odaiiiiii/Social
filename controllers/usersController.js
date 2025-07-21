const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const baseURL = process.env.SOCKET_URL;

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const fullUser = {
      ...user._doc,
      profileImage: `${baseURL}/uploadsProfile/${user.profileImage}`

    };

    res.json(fullUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Username is required" });
    }

    const users = await User.find({
      username: { $regex: `^${username}`, $options: "i" },
    }).select("_id username profileImage");
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      profileImage: `${baseURL}/uploadsProfile/${user.profileImage}`

    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { username, country, gender } = req.body;
    const profileImage = req.file?.filename;

    const updatedFields = { username, country, gender };

    if (profileImage) {
      updatedFields.profileImage = profileImage;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true }
    );
    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        country: updatedUser.country,
        gender: updatedUser.gender,
        profileImage: `${baseURL}/uploadsProfile/${updatedUser.profileImage}`

      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getProfile, updateProfile, changePassword,searchUsers };
