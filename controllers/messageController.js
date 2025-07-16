const Message = require("../models/MessageModel");
const FriendRequest = require("../models/friendsModel");
const Notification = require("../models/Notification");
const onlineUsers = require("../socket/onlineUsers");


// Send Message 
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id; 
    const { receiverId, text } = req.body;

    // Verify they are friends
    const isFriend = await FriendRequest.findOne({
      status: "accepted",
      $or: [
        { from: senderId, to: receiverId },
        { from: receiverId, to: senderId },
      ],
    });

    if (!isFriend) {
      return res.status(403).json({ message: "You are not friends with this user." });
    }

    // Create and save message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      text,
    });

    await message.save();

    // Create notification for the receiver
    const newNotification = new Notification({
     recipient: receiverId,
  sender: senderId,
  type: "message",
  message: `You have a new message from ${req.user.userName}.`,
    });

    await newNotification.save();

    // Emit socket event for new message notification
    const io = req.app.get("io"); // استرجاع io من app
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
     const populatedMessage = await message
  .populate("sender", "username profileImage")
  .execPopulate?.(); // إذا كنت تستخدم Mongoose < 7

// أو لو Mongoose >= 7
const fullMessage = await Message.findById(message._id)
  .populate("sender", "username profileImage");

io.to(receiverSocketId).emit("newMessageNotification", fullMessage);

    }

    res.status(201).json(message);
  } catch (error) {
     console.error("Send Message Error:", error);
  res.status(500).json({ message: error.message || "Server error" });
  }
};

//  Messages between users
const getConversation = async (req, res) => {
  try {
    const userId = req.params.userId;
    const friendId = req.params.friendId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    }).sort({ createdAt: 1 }); 

    res.status(200).json(messages);
  } catch (error) {
   console.error("Send Message Error:", error);
  res.status(500).json({ message: error.message || "Server error" });
  }
};

module.exports = {
  sendMessage,
  getConversation
};
 