// userController.js

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
    res.render("registration", { err: "" });
  };

  static userRegistration = async (req, res) => {
    // const validationRules = [
    //   body("name").notEmpty().withMessage("Name is required"),
    //   body("email").isEmail().withMessage("Invalid email").normalizeEmail(),
    //   body("password").notEmpty().withMessage(" Password is required"),
    //   body("phoneNo")
    //     .notEmpty()
    //     .withMessage("Phone number is required")
    //     .isLength({ min: 10, max: 10 })
    //     .withMessage("Phone number must be 10 digits")
    //     .isNumeric()
    //     .withMessage("Phone number must contain only numeric digits"),
    //   body("DateOfBirth").notEmpty().withMessage("Date of birth is required"),
    // ];
    // await Promise.all(validationRules.map((validation) => validation.run(req)));

    // const errors = validationResult(req);
    // // if (!errors.isEmpty()) {
    // //   const err = "Validation errors";
    // //   res.render("registration", { err });
    // //   return res.status(400).json({
    // //     status: "failed",
    // //     message: "Validation errors",
    // //     errors: errors.array(),
    // //   });
    // }
    const { name, email, password, phoneNo, DateOfBirth } = req.body;
    const username = email.split("@")[0];
    const user = await userModel.findOne({ email: email });
    if (user) {
      const err = "Email Already Exists";
      res.render("registration", { err, res });
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
        res.redirect("/login");
      } catch (error) {
        console.error(error);
        const err = "Unable To Register";
        res.render("registration", { err, res });
      }
    } else {
      const err = "All Fields Are Required";
      res.render("registration", { err, res });
    }
  };

  static viewLogin = (req, res) => {
    if (req.cookies.jwt) {
      return res.redirect("/");
    }
    res.render("login", { err: "", res });
  };
  static userLogin = async (req, res) => {
    // const validationRules = [
    //   body("usernameOrEmail")
    //     .notEmpty()
    //     .withMessage("Username or Email is required"),
    //   body("password").notEmpty().withMessage("Password is required"),
    // ];
    // await Promise.all(validationRules.map((validation) => validation.run(req)));
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   const err = "Validation errors";
    //   res.render("login", { err });
    // }

    const { usernameOrEmail, password } = req.body;
    if (usernameOrEmail && password) {
      try {
        const user = await userModel.findOne({
          $or: [{ name: usernameOrEmail }, { email: usernameOrEmail }],
        });
        if (!user) {
          const err = "User not found";
          res.render("login", { err, res });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          const err = "Invalid password";
          res.render("login", { err, res });
        }
        const token = jwt.sign(
          { userID: user._id },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1d",
          }
        );
        await res.cookie("jwt", token, {
          httpOnly: true,
        });

        req.session.tokenn = token;
        res.redirect("/");
      } catch (error) {
        console.error(error);

        const err = "Unable to login";
        res.render("login", { err, res });
      }
    } else {
      const err = "All Fields Are Required";
      res.render("login", { err, res });
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
        return res.status(500).json(err);likedpost
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });
    res.status(200).json({
      success: true,
    });
  };
  static userLogout = async (req, res) => {
    try {
      res.cookie("jwt", "", {
        expires: new Date(0),
        httpOnly: true,
      });
      console.log("req.session=========>", req.slikedpostession);
      req.session.destroy();
      res.redirect("/login");
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: "failed", message: "Unable to logout" });
    }
  };
  static userFollow = async (req, res) => {
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
        const existingConnection = await Connection.findOne({
          senderId,
          receiverId,
        });
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
  static renderFollowerReq = async (req, res) => {
    try {
      const userId = req.user.id;
      const connection = await Connection?.find({
        receiverId: userId,
      }).populate("senderId");
      res.render("followersRequest", { connection, res });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Something went wrong",
      });
    }
  };
  static acceptReq = async (req, res) => {
    const reqId = req.params.id;
    // console.log("reqId=========>", reqId);
    const userId = req.user.id;
    const request = await Connection.findById(reqId);
    // console.log("request=======>", request);
    if (!request) {
      return res.status(404).json({
        status: "failed",
        message: "Request not found",
      });
    }
    const connections = await Connection.findById(reqId).populate("status");
    const extingUser = connections.status == "Accept";
    // console.log(pop.status == "Accept");
    if (extingUser) {
      return res.status(409).json({
        status: "failed",
        message: "You have already Accepted Request",
      });
    } else {
      const updateStatus = await connections.updateOne({ status: "Accept" });
      res.redirect("/followRequest");
    }
  };
  static declineReq = async (req, res) => {
    const reqId = req.params.id;
    // console.log("reqId=========>", reqId);
    const userId = req.user.id;
    const request = await Connection.findById(reqId);
    // console.log("request=======>", request);
    if (!request) {
      return res.status(404).json({
        status: "failed",
        message: "Request not found",
      });
    }
    const connections = await Connection.findById(reqId).populate("status");
    const removedUser =
      connections.status == "Accept" || connections.status == "Decline";
    // console.log(pop.status == "Accept");
    if (removedUser) {
      return res.status(409).json({
        status: "failed",
        message: "You Does not Accepted Request",
      });
    } else {
      const updateStatus = await connections.updateOne({ status: "Decline" });
      res.redirect("/followRequest");
    }
  };

  static updateFollowRequest = async (req, res) => {
    const { requestId, status } = req.body;
    const { Accept } = req.params;
    try {
      const connection = await Connection.findById(requestId);
      if (!connection) {
        return res.status(404).json({
          status: "failed",
          message: "Connection request not found",
        });
      }
      const user = await User.findById(connection.senderId);
      const senderIdUsername = user.username;
      // console.log("senderIdUsername======>", senderIdUsername);
      const { Accept, Decline } = req.body;
      // console.log("connection.status======>", connection.status);
      connection.status = status;
      await connection.save();
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
  // static followingCount = async (req, res) => {
  //   const userId = req.user.id;
  //   try {
  //     const connection = await Connection.find({ senderId: userId });
  //     const followingcount = connection.length;
  //     console.log("count============>", followingcount);
  //     res.render("profile", { followingcount, res  });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({
  //       status: "failed",
  //       message: "Something went wrong",
  //     });
  //   }
  // };
  // static followerCount = async (req, res) => {
  //   const userId = req.user.id;
  //   // console.log("userId================>", userId);
  //   try {
  //     const connection = await Connection.find({ receiverId: userId });
  //     // console.log("connection======>", connection);
  //     const followercount = connection.length;
  //     console.log("count============>", followercount);
  //     res.render("profile", { followercount, res  });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({
  //       status: "failed",
  //       message: "Something went wrong",
  //     });
  //   }
  // };

  static userUnFollow = async (req, res) => {
    const receiverId = req.params.id;
    const senderId = req.user.id;
    try {
      const connection = await Connection.findOne({
        senderId,
        receiverId,
      });
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
      const following = await Connection.find({
        senderId: req.user.id,
        status: "Accept",
      });
      const followingCount = following.length.toString();
      const follower = await Connection.find({
        receiverId: req.user.id,
        status: "Accept",
      });
      const followerCount = follower.length.toString();
      res.render("profile", { user, followerCount, followingCount, res });
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
        res.render("updateProfile", { user, res });
      })
      .catch((error) => {
        res.render("error", { error, res });
      });
  };

  static updateMyProfile = async (req, res) => {
    try {
      const { email, phoneNo, dateOfBirth } = req.body;

      const user = await userModel.findById(req.user._id);

      if (!user) {
        return res
          .status(404)
          .json({ status: "failed", message: "User not found" });
      }
      user.email = email;
      user.phoneNo = phoneNo;
      logout;
      user.dateOfBirth = dateOfBirth;
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
  static getUserByUsername = async (req, res) => {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username: username });
      if (!user) {
        throw new Error("user does not exist");
      }
      const { password, jwtToken, __v, role, ...otherInfo } = user._doc;
      res.render("getuserbyusername", { user, res });
    } catch (e) {
      res.status(500).send({
        status: "failure",
        message: e.message,
      });
    }
  };
}

module.exports = userController;
