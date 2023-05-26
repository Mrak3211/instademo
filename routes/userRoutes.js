const express = require("express");
const userRoutes = express.Router();
const userController = require("../controllers/userController.js");
const dotenv = require("dotenv");
const requireLogin = require("../middlewares/auth-middleware.js");
const user = require("../models/userModel.js");

userRoutes.post("/register", userController.userRegistration);
userRoutes.post("/login", userController.userLogin);
userRoutes.post("/logout", requireLogin, userController.userLogout);
userRoutes.put("/userUpdate/:id", requireLogin, userController.userUpdate);
userRoutes.put("/:id/follow", requireLogin, userController.userFollow);
// userRoutes.put("/:id/unfollow", requireLogin, userController.userUnFollow);

module.exports = userRoutes;
