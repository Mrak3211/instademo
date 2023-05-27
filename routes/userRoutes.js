// userRoutes.js

const express = require("express");
const userRoutes = express.Router();
const userController = require("../controllers/userController.js");
const dotenv = require("dotenv");
const requireLogin = require("../middlewares/auth-middleware.js");
const user = require("../models/userModel.js");

userRoutes.get("/", (req, res) => {
  res.render("home");
});

userRoutes.post("/signup", userController.userRegistration);
userRoutes.get("/register", userController.viewRegistration);

userRoutes.post("/login", userController.userLogin);
userRoutes.get("/login", userController.viewLogin);

userRoutes.get("/myProfile", requireLogin, userController.renderMyProfile );
// userRoutes.get("/myProfile", requireLogin, userController.renderMyProfile);
// userRoutes.put("/myProfile", requireLogin, userController.updateMyProfile);

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
