const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accept", "Decline"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Connection", connectionSchema);
