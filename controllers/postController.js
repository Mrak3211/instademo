// postController.js

const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/postModel.js");
const User = require("../models/userModel.js");
const Like = require("../models/likeModel.js");
const path = require("path");
const fs = require("fs");
const Connection = require("../models/connection.js");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uname = req.user.id;
    // console.log(uname);
    const uploadPath = path.join(__dirname, `../public/uploads/${uname}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage });
const uploadSingle = upload.single("pic");

class PostController {
  static allPost = async (req, res) => {
    try {
      const postt = await Post.find()
        .populate("postedBy", "_id name")
        .sort("-createdAt");

      res.render("allPost", { postt });
      // console.log("postt=======>", postt);
    } catch (error) {
      res.status(500).json({ error: "An error occurred" });
    }
  };

  static userFeed = async (req, res) => {
    try {
      const userId = req.user.id;
      // const user = await User.findById(userId);
      // console.log("userId=====>", userId);
      const connections = await Connection?.find({ senderId: userId });
      // console.log("connections=====>", connections);

      const followingUserIds = connections.map(
        (connection) => connection.receiverId
      );
      // console.log("followingUserIds=====>", followingUserIds);
      const feed = await Post.find()
        .where("postedBy")
        .in(followingUserIds)
        .populate("postedBy", "_id name");
      res.render("feed", { feed });
      // console.log("feed in postController===============>", feed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "An error occurred" });
    }
  };

  static createPost(req, res) {
    const { title, body } = req.body;
    const pic = req.file;
    if (!title || !body || !pic) {
      return res.status(422).json({ error: "Please add all the fields" });
    }
    req.user.password = undefined;
    const uname = req.user.id;
    const folderName = `${uname}`;
    filename: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    };
    const post = new Post({
      title,
      body,
      photo: `${folderName}/${pic.filename}`,
      postedBy: req.user,
    });
    post.save();
    res
      // .then((result) => {
      //   res.json({ post: result });
      // })
      .redirect("/myposts")
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  }
  static renderUpdatePost = async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .then((postt) => {
        if (!postt) {
          return res.status(404).json({
            status: "failed",
            message: "Post not found",
          });
        }
        res.render("updatePost", { postt });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  };
  static updatePost = async (req, res) => {
    const { title, body } = req.body;
    const pic = req.file;
    if (!title || !body || !pic) {
      return res.status(422).json({ error: "Please add all the fields" });
    }
    Post.findById(req.params.id)
      .then((post) => {
        const buff = post.postedBy.id.toString("hex");
        const pic = req.file;
        // console.log("buff === req.user.id=====>", buff === req.user.id);
        if (buff === req.user.id) {
          if (post.photo) {
            const filePath = path.join("./public/uploads", post.photo);
            // console.log("fs.unlink(filePath)=========>", filePath);
            fs.unlinkSync(filePath, (error) => {
              if (error) {
                console.error("Error occurred while deleting the file:", error);
              } else {
                console.log("File deleted successfully.");
              }
            });
          }
          const uname = req.user.id;
          const folderName = `${uname}`;
          filename: (req, file, cb) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            cb(null, fileName);
          };
          post.title = title;
          post.body = body;
          post.photo = `${folderName}/${pic.filename}`;
          post.save();
          res.redirect("/myposts");
          //   .catch((err) => {
          //   console.log(err);
          //   res.status(500).json({ error: "A error occurred" });
          // });
        } else {
          res.status(403).json({
            status: "Failed",
            message: "You can only update your own post",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  };

  static myPost = async (req, res) => {
    try {
      const mypostt = await Post?.find({
        postedBy: req.user.id,
      }).populate("postedBy", "_id name");
      res.render("myPost", { mypostt });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "An error occurred" });
    }
  };

  static likePost = async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id;
      // console.log(postId);
      // console.log(userId);
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          status: "failed",
          message: "Post not found",
        });
      }
      const existingLike = await Like.findOne({
        postId: postId,
        senderId: userId,
      });
      if (existingLike) {
        return res.status(409).json({
          status: "failed",
          message: "You have already liked this post",
        });
      }
      const like = new Like({
        postId: postId,
        senderId: userId,
      });
      await like.save();
      res.status(200).json({
        status: "success",
        message: "Post liked successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Unable to like the post",
      });
    }
  };

  static unLikePost = async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id;
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          status: "failed",
          message: "Post not found",
        });
      }
      const like = await Like.findOne({ postId: postId, senderId: userId });
      if (!like) {
        return res.status(409).json({
          status: "failed",
          message: "You have not liked this post",
        });
      }
      // console.log(like);
      await like.deleteOne();
      res.status(200).json({
        status: "success",
        message: "Post unliked successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Unable to unlike the post",
      });
    }
  };

  static deletePost(req, res) {
    Post.findById(req.params.id)
      .then((post) => {
        const buff = post.postedBy.id.toString("hex");
        if (buff === req.user.id) {
          post
            .deleteOne()
            .then(() => {
              res.status(200).json({
                status: "Success",
                message: "The Post has been deleted",
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: "An error occurred" });
            });
        } else {
          res.status(403).json({
            status: "Failed",
            message: "You can only delete your own post",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  }
}

module.exports = { PostController, uploadSingle };
