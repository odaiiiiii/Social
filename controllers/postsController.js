const Post = require("../models/postsModel");
const Comment = require("../models/commentsModel");
const Friend = require("../models/friendsModel");
const onlineUsers = require("../socket/onlineUsers");

// create post
const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let mediaUrl = null;
    let mediaType = "none";
    const userId = req.user.id;

    if (req.file) {
      mediaUrl = `/uploadsPosts/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";
    }

    const newPost = new Post({
      user: userId,
      content,
      mediaUrl,
      mediaType: mediaType || "none",
    });
    await newPost.save();
    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// getAllPosts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username profileImage");

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// getSinglePost
const getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "username profileImage"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// deletePost
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await Comment.deleteMany({ postId: post._id });

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// updatePost
const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (content !== undefined) {
      post.content = content;
    }

    if (req.file) {
      post.mediaUrl = `/uploadsPosts/${req.file.filename}`;
      post.mediaType = req.file.mimetype.startsWith("image")
        ? "image"
        : "video";
    }

    await post.save();

    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// likeOrUnlikePost
const likeOrUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).populate("user", "username");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user.id;

    const alreadyLiked = post.likes
      .filter((id) => id !== null)
      .map((id) => id.toString())
      .includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id && id.toString() !== userId);
      await post.save();
      return res.status(200).json({ message: "Post unliked" });
    } else {
      post.likes.push(userId);
      await post.save();

      // إشعار اللايك
 if (post.user && post.user._id.toString() !== userId) {
  const recipientId = post.user._id.toString();
  const receiverSocketId = onlineUsers.get(recipientId);
  const io = req.app.get("io");

  const Notification = require("../models/Notification");

  // أول شيء نحفظ الإشعار في الـ DB
  const createdNotification = await Notification.create({
    recipient: recipientId,
    sender: userId,
    type: "like",
    post: postId,
    message: `${req.user.userName} liked your post.`,
  });

  // نحضّر بيانات الإشعار لإرسالها عبر الـ socket
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
    console.log(`⚠️ User ${recipientId} not online, like notification not sent.`);
  }
}


      return res.status(200).json({ message: "Post liked" });
    }
  } catch (err) {
    console.error("🚨 Like/Unlike error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// getMyPosts
const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const myPosts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "username profileImage");

    res.status(200).json(myPosts);
  } catch (error) {
    console.error("Error fetching my posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// getFriendsPosts
const getFriendsPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await Friend.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    });

    const friendIds = friends.map((friend) => {
      return friend.from.toString() === userId ? friend.to : friend.from;
    });

    if (friendIds.length === 0) {
      return res.status(200).json([]);
    }

    const posts = await Post.find({ user: { $in: friendIds } })
      .sort({ createdAt: -1 })
      .populate("user", "username profileImage");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching friends' posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// getPostsByUserId
const getPostsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "username profileImage");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Get posts by user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createPost,
  getSinglePost,
  getAllPosts,
  deletePost,
  likeOrUnlikePost,
  updatePost,
  getFriendsPosts,
  getMyPosts,
  getPostsByUserId,
};
