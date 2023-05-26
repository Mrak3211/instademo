const userModel = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const { body, validationResult } = require("express-validator");

class userController {
  static userRegistration = async (req, resp) => {
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
        console.log(newUser);
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
        const receverUser = await User.findById(req.params.id);
        const senderUser = await User.findById(req.user.id);
        // console.log("receverUser========>", receverUser);
        // console.log("senderUser=========>", senderUser);
        // console.log(!receverUser.followers.includes(senderUser.id));
        console.log(receverUser.username);
        if (!receverUser.followers.includes(senderUser.id)) {
        } else {
          res.status(400).send({
            status: "Failed",
            message: `You Already Followed ${receverUser.username}`,
          });
        }
      } catch (error) {
        res.status(404).send({
          status: "Failed",
          message: "Something Went Wrong",
        });
      }
    } else {
      res.status(400).send({
        status: "Failed",
        message: "You Cannot Follow Yourself",
      });
    }
  };
}

module.exports = userController;
