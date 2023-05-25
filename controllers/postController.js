const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/postModel.js");
const User = require("../models/userModel.js");

class postController {
  static allPost = (req, res) => {
    Post.find()
      .populate("postedBy", "_id name")

      .sort("-createdAt")
      .then((posts) => {
        res.json({ posts });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  static createPost = (req, res) => {
    const { title, body, pic } = req.body;
    if (!title || !body || !pic) {
      return res.status(422).json({ error: "Plase add all the fields" });
    }
    req.user.password = undefined;
    const post = new Post({
      title,
      body,
      photo: pic,
      postedBy: req.user,
    });
    post
      .save()
      .then((result) => {
        res.json({ post: result });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  static myPost = (req, res) => {
    Post.find({ postedBy: req.user._id })
      .populate("postedBy", "_id name")
      .then((mypost) => {
        res.json({ mypost });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  static likePost = async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      // console.log(req.user._id);
      if (!post.likes.includes(req.user._id)) {
        await post.updateOne({ $push: { likes: req.user._id } });
        res.status(200).json({
          status: "Success",
          Like: true,
          message: "The Post has Been liked",
          PostId: req.params.id,
          likeByUser: req.user.name,
        });
      } else {
        await post.updateOne({ $pull: { likes: req.user._id } });
        res.status(200).json({
          status: "Success",
          Like: false,
          message: "The Post has Been Disliked",
          PostId: req.params.id,
          likeByUser: req.user.name,
        });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  };

  static updatePost = async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      const buf = post?.postedBy.id;
      const postedById = buf.toString("hex");
      // console.log(postedById);
      // console.log(postedById === req.user.id);
      if (postedById === req.user.id) {
        await post.updateOne({ $set: req.body });
        res.status(200).json({
          status: "Success",
          message: "The Post has Been Updated",
          PostId: req.params.id,
        });
      } else {
        res.status(403).json({
          status: "failed",
          message: "You can Update only Your Post",
          PostId: req.params.id,
        });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  };
  static deletePost = async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const buf = post?.postedBy.id;
      const postedById = buf.toString("hex");

      if (postedById === req.user.id) {
        await post.deleteOne();
        res.status(200).json({
          status: "Success",
          message: "The Post has Been Deleted",
        });
      } else {
        res.status(403).json({
          status: "failed",
          message: "You can Delete only Your Post",
        });
      }
    } catch (err) {
      res.status(500).json(err);
    }
  };
}

module.exports = postController;
