const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/postModel.js");
const User = require("../models/userModel.js");
const path = require("path");
const fs = require("fs");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uname = req.user.id;
    console.log(uname);
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
  static allPost(req, res) {
    Post.find()
      .populate("postedBy", "_id name")
      .sort("-createdAt")
      .then((posts) => {
        res.json({ posts });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  }

  static createPost(req, res) {
    const { title, body } = req.body;
    const pic = req.file;
    if (!title || !body || !pic) {
      return res.status(422).json({ error: "Please add all the fields" });
    }
    req.user.password = undefined;
    const post = new Post({
      title,
      body,
      photo: pic.path,
      postedBy: req.user,
    });
    post
      .save()
      .then((result) => {
        res.json({ post: result });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  }

  static updatePost(req, res) {
    const { title, body } = req.body;
    const pic = req.file;
    if (!title || !body || !pic) {
      return res.status(422).json({ error: "Please add all the fields" });
    }
    Post.findById(req.params.id)
      .then((post) => {
        const buff = post.postedBy.id.toString("hex");
        const pic = req.file;
        if (buff === req.user.id) {
          // Delete old image
          fs.unlinkSync(post.photo);
          // Update post
          post.title = title;
          post.body = body;
          post.photo = pic.path;
          post
            .save()
            .then((result) => {
              res.json({ post: result });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: "A error occurred" });
            });
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
  }

  static myPost(req, res) {
    Post.find({ postedBy: req.user._id })
      .populate("postedBy", "_id name")
      .then((mypost) => {
        res.json({ mypost });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  }

  static likePost(req, res) {
    Post.findById(req.params.id)
      .then((post) => {
        if (!post.likes.includes(req.user._id)) {
          post.likes.push(req.user._id);
          post
            .save()
            .then(() => {
              res.status(200).json({
                status: "Success",
                Like: true,
                message: "The Post has been liked",
                PosobjecttId: req.params.id,
                likeByUser: req.user.name,
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: "An error occurred" });
            });
        } else {
          post.likes.pull(req.user._id);
          post
            .save()
            .then(() => {
              res.status(200).json({
                status: "Success",
                Like: false,
                message: "The Post has been disliked",
                PostId: req.params.id,
                likeByUser: req.user.name,
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: "An error occurred" });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: "An error occurred" });
      });
  }

  static deletePost(req, res) {
    Post.findById(req.params.id)
      .then((post) => {
        if (post.postedBy.id === req.user.id) {
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
