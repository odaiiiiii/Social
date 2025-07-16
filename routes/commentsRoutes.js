
const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
} = require("../controllers/commentsControllers");
const authToken = require("../middlewares/authToken");

router.post("/create", authToken, createComment);

router.get("/post/:postId", authToken, getCommentsByPostId);

router.put("/update/:id", authToken, updateComment);

router.delete("/delete/:id", authToken, deleteComment);

module.exports = router;
