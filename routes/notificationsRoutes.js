const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authToken = require("../middlewares/authToken");

// جلب إشعارات المستخدم (محمي بتوكن)
router.get("/", authToken, notificationController.getNotifications);

// تحديث حالة إشعار إلى مقروء
router.put("/:id/read", authToken, notificationController.markAsRead);

// حذف إشعار (اختياري)
router.delete("/:id", authToken, notificationController.deleteNotification);

router.post("/", authToken, notificationController.createNotification);

module.exports = router;
