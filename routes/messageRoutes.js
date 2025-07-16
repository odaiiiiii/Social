const express = require("express");
const router = express.Router();

const { sendMessage,getConversation } = require("../controllers/messageController");
const authToken = require("../middlewares/authToken");

router.post("/", authToken, sendMessage);
router.get("/:userId/:friendId", authToken, getConversation);

module.exports = router;
