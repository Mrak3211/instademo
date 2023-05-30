// userRoutes.js

const express = require("express");
const userRoutes = express.Router();
const userController = require("../controllers/userController.js");
const dotenv = require("dotenv");
const requireLogin = require("../middlewares/auth-middleware.js");
const User = require("../models/userModel.js");
const Post = require("../models/postModel.js");

userRoutes.get("/", async (req, res) => {
  if (!req.cookies.jwt) {
    return res.redirect("/login");
  }
  try {
    const postt = await Post.find()
      .populate("postedBy", "_id name")
      .sort("-createdAt");
    res.render("home", { postt });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

userRoutes.post("/signup", userController.userRegistration);
userRoutes.get("/register", userController.viewRegistration);

userRoutes.post("/login", userController.userLogin);
userRoutes.get("/login", userController.viewLogin);

userRoutes.get("/myProfile", requireLogin, userController.renderMyProfile);
userRoutes.put("/updateProfile", requireLogin, userController.updateMyProfile);
userRoutes.post(
  "/updateProfile",
  requireLogin,
  userController.updateUserProfile
);
userRoutes.get(
  "/updateProfile",
  requireLogin,
  userController.updateUserProfile
);

userRoutes.post("/logout", requireLogin, userController.userLogout);
userRoutes.get("/logout", requireLogin, userController.userLogout);
userRoutes.put("/userUpdate/:id", requireLogin, userController.userUpdate);
userRoutes.put("/:id/follow", requireLogin, userController.userFollow);
userRoutes.put(
  "/followRequest",
  requireLogin,
  userController.updateFollowRequest
);
userRoutes.put("/:id/unfollow", requireLogin, userController.userUnFollow);

module.exports = userRoutes;
