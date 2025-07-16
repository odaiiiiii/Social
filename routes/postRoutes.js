
const express = require("express");
const router = express.Router();
const {createPost,getSinglePost,getAllPosts,deletePost,likeOrUnlikePost,updatePost,getFriendsPosts,getMyPosts,getPostsByUserId} = require("../controllers/postsController")
const  authToken  = require("../middlewares/authToken")
const upload = require("../middlewares/uploadPostsMedia");

router.post("/create", authToken, upload.single("media"), createPost);

router.get("/friendsposts", authToken, getFriendsPosts); 

router.get("/myPosts",authToken,getMyPosts)

router.get("/", authToken, getAllPosts);

router.get("/:id", authToken, getSinglePost); 

router.delete("/:id", authToken, deletePost);

router.put("/:id/like", authToken, likeOrUnlikePost);

router.put("/:id", authToken, upload.single("media"), updatePost);

router.get("/user/:id", authToken, getPostsByUserId);

module.exports = router