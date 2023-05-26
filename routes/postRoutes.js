const express = require("express");
const postRoutes = express.Router();
const {
  PostController,
  uploadSingle,
} = require("../controllers/postController.js");
const dotenv = require("dotenv");
const requireLogin = require("../middlewares/auth-middleware.js");
const post = require("../models/postModel.js");
// const upload = require("../controllers/postController.js");
// const uploadsingle = require("../middlewares/multer.js");
// const uploadsingle = require("../controllers/postController.js");

postRoutes.get("/allpost", requireLogin, PostController.allPost);
postRoutes.get("/public/uploads");

postRoutes.post(
  "/createpost",
  requireLogin,
  uploadSingle,
  PostController.createPost
);

postRoutes.get("/myposts", requireLogin, PostController.myPost);
postRoutes.put("/:id/like", requireLogin, PostController.likePost);
postRoutes.put(
  "/:id/updatePost",
  requireLogin,
  uploadSingle,
  PostController.updatePost
);
postRoutes.delete("/:id/deletePost", requireLogin, PostController.deletePost);

module.exports = postRoutes;
