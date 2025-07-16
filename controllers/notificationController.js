const Notification = require("../models/Notification");

// جلب كل الإشعارات لمستخدم معين (مرتبة حديثة أولاً)
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate("sender", "username profileImage")
      .populate("post", "content")
      .populate("comment", "text");

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// تحديث حالة الإشعار إلى مقروء
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// حذف إشعار (اختياري لو حبيت تضيفه)
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createNotification = async (req, res) => {
  try {
    const { recipient, sender, type, post, comment, message } = req.body;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
      message,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  createNotification
};
