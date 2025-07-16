
const Comment = require("../models/commentsModel");
const Post = require("../models/postsModel");

const createComment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { text, postId } = req.body;
    const userId = req.user.id;

    if (!text || !postId) {
      return res.status(400).json({ message: "Content and PostId are required" });
    }

    const newComment = new Comment({
      text,
      user: userId,
      postId,
    });

    await newComment.save();
await newComment.populate("user", "username profileImage");

    // ✅ هنا نضيف إرسال الإشعار
    const io = req.app.get("io"); // استرجاع io
    const Post = require("../models/postsModel");
    const onlineUsers = require("../socket/onlineUsers");

    const post = await Post.findById(postId).populate("user");
    if (post && post.user && post.user._id.toString() !== userId) {
      const recipientId = post.user._id.toString();
      const receiverSocketId = onlineUsers.get(recipientId);

    const Notification = require("../models/Notification");

const createdNotification = await Notification.create({
  recipient: recipientId,
  sender: userId,
  type: "comment",
  post: postId,
  message: `${req.user.userName} commented on your post.`,
});

const notificationData = {
  _id: createdNotification._id,
  type: createdNotification.type,
  message: createdNotification.message,
  postId: createdNotification.post,
  senderId: createdNotification.sender,
  isRead: createdNotification.isRead,
  createdAt: createdNotification.createdAt,
};


      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveNotification", notificationData);
      } else {
        console.log(`User ${recipientId} not online, notification not sent.`);
      }
    }

    res.status(201).json({
      message: "Comment created successfully",
      comment: newComment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .populate("user", "username profileImage");

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id } = req.params; 
    const { text } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    comment.text = text;
    await comment.save();

    res.status(200).json({ message: "Comment updated", comment });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params; 

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await comment.deleteOne();

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  createComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
};
