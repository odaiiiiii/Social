// 1. Import required modules
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// 2. Initialize Express app
const app = express();
const server = http.createServer(app);

// 3. Middleware setup
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    // origin: "http://localhost:5173",
origin: "https://your-frontend-site.netlify.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// 4. Serve static files for profile and post images
app.use("/uploadsProfile", express.static("uploads/uploadsProfile"));
app.use("/uploadsPosts", express.static("uploads/uploadsPosts"));

// 5. Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postsRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentsRoutes");
const friendRoutes = require("./routes/friendsRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");
const onlineUsers = require("./socket/onlineUsers");

// 6. Use routes with their base paths
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// 7. Connect to MongoDB database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed", err));

// 8. Setup Socket.io
const io = socketIo(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin:"https://timely-gnome-346710.netlify.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

// Import Notification model
const Notification = require("./models/Notification");

io.on("connection", (socket) => {

  socket.on("userConnected", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

socket.on("sendNotification", async ({ recipientId, notificationData }) => {
  try {
    // 1. أنشئ الإشعار في قاعدة البيانات
    const newNotification = await Notification.create({
      recipient: recipientId,
      sender: notificationData.sender,
      type: notificationData.type,
      message: notificationData.message,
      post: notificationData.post || null,
      comment: notificationData.comment || null,
    });

    // 2. أرسل الإشعار للعميل مع كل بياناته، خاصة _id
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

// 9. Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
