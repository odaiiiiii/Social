const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ Middleware to log every request and cookies from client
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  console.log("Cookies sent by client:", req.cookies);
  next();
});

// ✅ السماح بالكوكيز بين الدومين والفرونت
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: true, // يسمح لأي دومين للتجربة (غير آمن للإنتاج)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// 🖼️ static file serving
app.use("/uploadsProfile", express.static("uploads/uploadsProfile"));
app.use("/uploadsPosts", express.static("uploads/uploadsPosts"));

// ✅ المسارات
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postsRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentsRoutes");
const friendRoutes = require("./routes/friendsRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");
const onlineUsers = require("./socket/onlineUsers");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed", err));

// ✅ Socket.IO
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

const Notification = require("./models/Notification");

io.on("connection", (socket) => {
  socket.on("userConnected", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("sendNotification", async ({ recipientId, notificationData }) => {
    try {
      const newNotification = await Notification.create({
        recipient: recipientId,
        sender: notificationData.sender,
        type: notificationData.type,
        message: notificationData.message,
        post: notificationData.post || null,
        comment: notificationData.comment || null,
      });

      const receiverSocketId = onlineUsers.get(recipientId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveNotification", newNotification);
      }
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  });

  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", {
        senderId,
        text,
        createdAt: new Date(),
      });
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log("User disconnected:", userId);
        break;
      }
    }
  });
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
