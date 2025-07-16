const Friend = require("../models/friendsModel");
const Notification = require("../models/Notification");

// Send a friend request from the logged-in user to another user
const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.body.receiverId;

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself." });
    }

    const existingRequest = await Friend.findOne({
      $or: [
        { from: senderId, to: receiverId },
        { from: receiverId, to: senderId },
      ],
    });
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Friend request already exists." });
    }

    const newRequest = new Friend({
      from: senderId,
      to: receiverId,
      status: "pending",
    });
    await newRequest.save();
    await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: "friend_request",
      message: "sent you a friend request.",
    });
    res
      .status(201)
      .json({ message: "Friend request sent.", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all pending friend requests received by the logged-in user
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingRequests = await Friend.find({
      to: userId,
      status: "pending",
    }).populate("from", "username profileImage");

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Get pending friend requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all pending friend requests sent by the logged-in user
const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const sentRequests = await Friend.find({
      from: userId,
      status: "pending",
    }).populate("to", "username profileImage");

    res.status(200).json(sentRequests);
  } catch (error) {
    console.error("Get sent friend requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept or reject a friend request based on the user's action
const respondToRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId, action } = req.body;

    const friendRequest = await Friend.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (friendRequest.to.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to respond to this request." });
    }

    if (action === "accept") {
      friendRequest.status = "accepted";
      await friendRequest.save();

      return res
        .status(200)
        .json({ message: "Friend request accepted.", request: friendRequest });
    } else if (action === "reject") {
      friendRequest.status = "rejected";
      await friendRequest.save();

      return res
        .status(200)
        .json({ message: "Friend request rejected.", request: friendRequest });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'accept' or 'reject'." });
    }
  } catch (error) {
    console.error("Respond to friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel a pending friend request sent by the current user
const cancelRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.body;
    const friendRequest = await Friend.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (friendRequest.from.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this request." });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        message: "Cannot cancel a request that is already responded to.",
      });
    }

    await Friend.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Friend request cancelled successfully." });
  } catch (error) {
    console.error("Cancel friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a list of friends for the current user (those with accepted friend requests)
const getFriendsList = async (req, res) => {
  try {
    const userId = req.user.id;
    const friends = await Friend.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("from", "username email profileImage")
      .populate("to", "username email profileImage");

    const friendsList = friends.map((friend) => {
      let user = null;
      if (friend.from._id.toString() === userId) {
        user = friend.to;
      } else {
        user = friend.from;
      }

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
          ? `http://localhost:5000/uploadsProfile/${user.profileImage}`
          : "http://localhost:5000/uploadsProfile/profile.png",
      };
    });

    res.status(200).json({ friends: friendsList });
  } catch (error) {
    console.error("Get friends list error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const unfriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.body.friendId;

    if (!friendId) {
      return res.status(400).json({ message: "Friend ID is required." });
    }

    const deleted = await Friend.findOneAndDelete({
      status: "accepted",
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId },
      ],
    });

    if (!deleted) {
      return res.status(404).json({ message: "Friendship not found." });
    }

    res.status(200).json({ message: "Friendship cancelled successfully." });
  } catch (error) {
    console.error("Unfriend error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const searchFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.username || "";

    // جلب العلاقات المقبولة
    const friends = await Friend.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    }).populate([
      { path: "from", select: "username profileImage" },
      { path: "to", select: "username profileImage" },
    ]);

    // استخراج الطرف الآخر من العلاقة
    const matchedFriends = friends
      .map((friend) => {
        return friend.from._id.toString() === userId ? friend.to : friend.from;
      })
      .filter((friend) =>
        friend.username.toLowerCase().includes(search.toLowerCase())
      )
      .map((friend) => ({
        _id: friend._id,
        username: friend.username,
        profileImage: friend.profileImage
          ? `http://localhost:5000/uploadsProfile/${friend.profileImage}`
          : "http://localhost:5000/uploadsProfile/profile.png",
      }));

    res.status(200).json({ friends: matchedFriends });
  } catch (error) {
    console.error("Search friends error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  respondToRequest,
  cancelRequest,
  getFriendsList,
  unfriend,
  searchFriends,
};
