// postRoutes.js

const express = require("express");
const postRoutes = express.Router();
const {
  PostController,
  uploadSingle,
} = require("../controllers/postController.js");
const dotenv = require("dotenv");
const requireLogin = require("../middlewares/auth-middleware.js");
const checkUserAuth = require("../middlewares/auth-middleware.js");
const post = require("../models/postModel.js");
const Post = require("../models/postModel.js");

postRoutes.get("/allpost", requireLogin, PostController.allPost);
postRoutes.get("/feed", checkUserAuth, PostController.userFeed);
postRoutes.get("/public/uploads");

postRoutes.post(
  "/createpost",
  requireLogin,
  uploadSingle,
  PostController.createPost
);
postRoutes.get("/createpost", requireLogin, (req, res) => {
  res.render("createPost", { pageTitle: "Create Post", res });
});

postRoutes.get("/myposts", requireLogin, PostController.myPost);
postRoutes.get("/:id/isLike", requireLogin, PostController.isLiked);
postRoutes.put("/:id/like", requireLogin, PostController.likePost);
postRoutes.get("/:id/like", requireLogin, PostController.likePost);
postRoutes.put("/:id/unlike", requireLogin, PostController.unLikePost);
postRoutes.get("/:id/unlike", requireLogin, PostController.unLikePost);
postRoutes.put(
  "/:id/updatePost",
  requireLogin,
  uploadSingle,
  PostController.updatePost
);
postRoutes.post(
  "/:id/updatePost",
  requireLogin,
  uploadSingle,
  PostController.updatePost
);
postRoutes.get(
  "/:id/updatePost",
  requireLogin,
  PostController.renderUpdatePost
);
postRoutes.delete("/:id/deletePost", requireLogin, PostController.deletePost);

module.exports = postRoutes;
