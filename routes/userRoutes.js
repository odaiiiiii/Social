const express = require("express");
const router = express.Router();
const {getProfile,updateProfile,changePassword,searchUsers} = require("../controllers/usersController")
const authToken =require("../middlewares/authToken")
const upload = require("../middlewares/upload");

router.get("/profile",authToken,getProfile);

router.get("/search", authToken, searchUsers);

router.put("/updateProfile",authToken,upload.single("profileImage"),updateProfile);

router.put("/changePassword", authToken, changePassword);



module.exports = router;