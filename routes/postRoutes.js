const express = require("express");
const postRoutes = express.Router();
const postController = require("../controllers/postController.js");
const dotenv = require("dotenv");
const requireLogin = require("../middlewares/auth-middleware.js");
const post = require("../models/postModel.js");

postRoutes.get("/allpost", requireLogin, postController.allPost);
postRoutes.post("/createpost", requireLogin, postController.createPost);

postRoutes.get("/myposts", requireLogin, postController.myPost);
postRoutes.put("/:id/like", requireLogin, postController.likePost);
postRoutes.put("/:id/updatePost", requireLogin, postController.updatePost);
postRoutes.delete("/:id/deletePost", requireLogin, postController.deletePost);

module.exports = postRoutes;
