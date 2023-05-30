const userModel = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const Connection = require("../models/connection.js");
const { body, validationResult } = require("express-validator");

class userController {
  static viewRegistration = (req, res) => {
    if (req.cookies.jwt) {
      return res.redirect("/");
    }
    res.render("registration");
  };

  static userRegistration = async (req, resp) => {
    console.log(req.body);
    const validationRules = [
      body("name").notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
      body("password").notEmpty().withMessage("Password is required"),
      body("phoneNo")
        .notEmpty()
        .withMessage("Phone number is required")
        .isLength({ min: 10, max: 10 })
        .withMessage("Phone number must be 10 digits")
        .isNumeric()
        .withMessage("Phone number must contain only numeric digits"),
      body("DateOfBirth").notEmpty().withMessage("Date of birth is required"),
    ];

    // Run validation
    await Promise.all(validationRules.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return resp.status(400).json({
        status: "failed",
        message: "Validation errors",
        errors: errors.array(),
      });
    }
    const { name, email, password, phoneNo, DateOfBirth } = req.body;
    const username = email.split("@")[0];
    const user = await userModel.findOne({ email: email });
    if (user) {
      return resp
        .status(409)
        .json({ status: "failed", message: "Email Already Exists" });
    }
    if (name && email && password && phoneNo && DateOfBirth) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const newUser = new userModel({
          name: name,
          email: email,
          password: hashPassword,
          phoneNo: phoneNo,
          DateOfBirth: DateOfBirth,
          username: username,
        });
        await newUser.save();
        // console.log(newUser);
        return resp
          .status(201)
          .json({ status: "success", message: "User Registered Successfully" });
      } catch (error) {
        console.error(error);
        return resp
          .status(500)
          .json({ status: "failed", message: "Unable To Register" });
      }
    } else {
      return resp
        .status(400)
        .json({ status: "failed", message: "All Fields Are Required" });
    }
  };

  static viewLogin = (req, res) => {
    if (req.cookies.jwt) {
      return res.redirect("/");
    }
    res.render("login");
  };
  static userLogin = async (req, resp) => {
    const validationRules = [
      body("usernameOrEmail")
        .notEmpty()
        .withMessage("Username or Email is required"),
      body("password").notEmpty().withMessage("Password is required"),
    ];
    // Run validation
    await Promise.all(validationRules.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return resp.status(400).json({
        status: "failed",
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { usernameOrEmail, password } = req.body;
    if (usernameOrEmail && password) {
      try {
        const user = await userModel.findOne({
          $or: [{ name: usernameOrEmail }, { email: usernameOrEmail }],
        });
        if (!user) {
          return resp
            .status(404)
            .json({ status: "failed", message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return resp
            .status(401)
            .json({ status: "failed", message: "Invalid password" });
        }
        const token = jwt.sign(
          { userID: user._id },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1d",
          }
        );
        await resp.cookie("jwt", token, {
          httpOnly: true,
        });
        return resp.status(200).json({
          status: "success",
          message: "Login successful",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            token: token,
          },
        });
      } catch (error) {
        console.error(error);
        return resp
          .status(500)
          .json({ status: "failed", message: "Unable to login" });
      }
    } else {
      return resp
        .status(400)
        .json({ status: "failed", message: "All Fields Are Required" });
    }
  };

  static userUpdate = async (req, res, next) => {
    const { name, email, password, phoneNo, DateOfBirth, username } = req.body;
    const newUserData = {
      name,
      email,
      password,
      phoneNo,
      DateOfBirth,
      username,
    };
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (userExists && userExists._id.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("User Already Exists", 404));
    }
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });
    res.status(200).json({
      success: true,
    });
  };

  static userLogout = async (req, resp) => {
    try {
      // Clear the JWT cookie by setting an expired token
      resp.cookie("jwt", "", {
        expires: new Date(0),
        httpOnly: true,
      });

      return resp
        .status(200)
        .json({ status: "success", message: "Logout successful" });
    } catch (error) {
      console.error(error);
      return resp
        .status(500)
        .json({ status: "failed", message: "Unable to logout" });
    }
  };
  static userFollow = async (req, res) => {
    // console.log(req.params.id); // Recever id
    // console.log(req.user.id); // Sender id
    if (req.user.id !== req.params.id) {
      try {
        const receiverId = req.params.id;
        const senderId = req.user.id;
        const receiverUser = await User.findById(receiverId);
        const senderUser = await User.findById(senderId);

        if (!receiverUser || !senderUser) {
          return res.status(404).json({
            status: "failed",
            message: "User not found",
          });
        }
        // console.log("receverUser========>", receverUser);
        // console.log("senderUser=========>", senderUser);
        // console.log(!receverUser.followers.includes(senderUser.id));
        // console.log(receverUser.username);
        // console.log({ followers: senderUser.id });

        const existingConnection = await Connection.findOne({
          senderId,
          receiverId,
        });
        // console.log("existingConnection============>", existingConnection);
        if (existingConnection) {
          return res.status(409).json({
            status: "failed",
            message: "Connection request already exists",
          });
        }
        const newConnection = new Connection({
          senderId,
          receiverId,
        });
        await newConnection.save();
        // receiverUser.followers.push(senderId);
        // senderUser.followings.push(receiverId);
        // await receiverUser.save();
        // await senderUser.save();
        res.status(200).json({
          status: "success",
          senderId: senderUser.id,
          receiverId: receiverUser.id,
          message: `Follow request sent to ${receiverUser.username}`,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          status: "failed",
          message: "Something went wrong",
        });
      }
    } else {
      res.status(400).json({
        status: "failed",
        message: "You cannot follow yourself",
      });
    }
  };
  static updateFollowRequest = async (req, res) => {
    const { requestId, status } = req.body;
    try {
      const connection = await Connection.findById(requestId);
      if (!connection) {
        return res.status(404).json({
          status: "failed",
          message: "Connection request not found",
        });
      }
      // console.log("status=============>", status);
      // console.log("connection.status=============>", connection.status);
      connection.status = status;
      await connection.save();
      // if (status === 'accepted') {
      // Update followers and followings arrays based on the connection status
      // const receiverUser = await User.findByIdAndUpdate(connection.receiverId, {
      //   $addToSet: { followers: connection.senderId },
      // });
      // const senderUser = await User.findByIdAndUpdate(connection.senderId, {
      //   $addToSet: { followings: connection.receiverId },
      // });
      // if (!receiverUser || !senderUser) {
      //   return res.status(404).json({
      //     status: "failed",
      //     message: "User not found",
      //   });
      // }
      // }
      res.status(200).json({
        status: "success",
        message: "Connection request updated successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Something went wrong",
      });
    }
  };

  static userUnFollow = async (req, res) => {
    // console.log(req.params.id); // Recever id
    // console.log(req.user.id); // Sender id
    const receiverId = req.params.id;
    const senderId = req.user.id;
    // console.log(receiverId);
    // console.log(senderId);
    try {
      const connection = await Connection.findOne({
        senderId,
        receiverId,
      });
      // console.log("connection=======>", connection);
      // console.log("senderId=======>", senderId);
      // console.log("receiverId=======>", receiverId);
      if (!connection) {
        return res.status(404).json({
          status: "failed",
          message: "Connection not found",
        });
      }
      if (connection.status === "Pending") {
        return res.status(400).json({
          status: "failed",
          message: "Connection request is already pending",
        });
      }
      connection.status = "Pending";
      await connection.save();
      res.status(200).json({
        status: "success",
        message: "Unfollowed user successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Something went wrong",
      });
    }
  };
  static renderMyProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      res.render("profile", { user });
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  };
  static getMyProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  };
  static updateUserProfile = (req, res) => {
    const { name, email, phoneNo, dateOfBirth } = req.body;
    User.findByIdAndUpdate(
      req.user.id,
      { name, email, phoneNo, dateOfBirth },
      { new: true }
    )
      .then((updatedUser) => {
        const user = req.user;
        res.render("updateProfile", { user });
      })
      .catch((error) => {
        res.render("error", { error });
      });
  };

  static updateMyProfile = async (req, res) => {
    try {
      const { email, phoneNo, dateOfBirth } = req.body;

      // Find the user in the database by ID
      const user = await userModel.findById(req.user._id);

      if (!user) {
        return res
          .status(404)
          .json({ status: "failed", message: "User not found" });
      }

      // Update the user's profile details
      user.email = email;
      user.phoneNo = phoneNo;
      user.dateOfBirth = dateOfBirth;

      // Save the updated user in the database
      await user.save();

      res
        .status(200)
        .json({ status: "success", message: "Profile updated successfully" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  };
}

module.exports = userController;
