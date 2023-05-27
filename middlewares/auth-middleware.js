const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel.js");

const checkUserAuth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    // console.log(token);
    if (!token) {
      return res
        .status(401)
        .json({ status: "failed", message: "Unauthorized User, No Token" });
    }

    const { userID } = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await userModel.findById(userID).select("-password");
    if (!req.user) {
      return res
        .status(401)
        .json({ status: "failed", message: "Unauthorized User" });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ status: "failed", message: "Unauthorized User" });
  }
};

module.exports = checkUserAuth;
