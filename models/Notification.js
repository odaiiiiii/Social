const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      // المستخدم اللي توصله الإشعار
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      // المستخدم اللي سبب الإشعار (مثل اللي بعت طلب الصداقة أو عمل لايك)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    type: {
      type: String,
      enum: ["friend_request", "like", "comment", "message"],
      required: true,
    },

    post: {
      // مرتبط بأي بوست؟ (للايك أو التعليق)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: false,
    },
    comment: {
      // مرتبط بأي تعليق؟ (اختياري، إذا الإشعار بسبب تعليق)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    message: {
      // رسالة نصية تظهر في الإشعار (اختياري، ممكن تولدها أو تخزنها)
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
