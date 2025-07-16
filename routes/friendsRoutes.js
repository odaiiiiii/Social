

const express = require("express");
const router = express.Router();
const authToken = require("../middlewares/authToken");

const { sendFriendRequest,getPendingRequests,getSentRequests ,unfriend,respondToRequest,cancelRequest,getFriendsList,searchFriends} = require("../controllers/friendsControllers");

router.post("/send", authToken, sendFriendRequest);

router.get("/pending", authToken, getPendingRequests);

router.post("/unfriend", authToken, unfriend);

router.get("/sent", authToken, getSentRequests);

router.put("/respond", authToken, respondToRequest);

router.post("/cancel", authToken, cancelRequest);

router.get("/list", authToken, getFriendsList);

router.get("/search", authToken, searchFriends); 

module.exports = router;