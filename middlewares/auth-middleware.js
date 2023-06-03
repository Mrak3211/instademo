// auth-middleware.js

const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel.js");

const checkUserAuth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt || req.headers.authorization;

    if (!token) {
      return res.redirect("/login");
    }
    const tokenWithoutBearer = token.startsWith("Bearer ")
      ? token.split(" ")[1]
      : token;

    const { userID } = jwt.verify(
      tokenWithoutBearer,
      process.env.JWT_SECRET_KEY
    );
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
