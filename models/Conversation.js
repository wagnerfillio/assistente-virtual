//models/Conversation.js
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  userMessage: String,
  category: String,
  feedback: {
    type: Boolean,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Conversation", conversationSchema);
