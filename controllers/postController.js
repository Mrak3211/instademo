const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/postModel.js");

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
  static like = (req, res) => {
    Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { likes: req.user._id },
      },
      {
        new: true,
      }
    ).exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.json(result);
      }
    });
  };
  static unLike = (req, res) => {
    Post.findByIdAndUpdate(
      req.body.postId,
      {
        $pull: { likes: req.user._id },
      },
      {
        new: true,
      }
    ).exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.json(result);
      }
    });
  };
}

module.exports = postController;
