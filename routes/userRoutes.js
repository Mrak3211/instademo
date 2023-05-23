const express = require("express");
const userRoutes = express.Router();
const userController = require("../controllers/userController.js");
const dotenv = require("dotenv");
const user = require("../models/userModel.js");

userRoutes.post("/register", userController.userRegistration);
userRoutes.post("/login", userController.userLogin);
userRoutes.post("/logout", userController.userLogout);

module.exports = userRoutes;
