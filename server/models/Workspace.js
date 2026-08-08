const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  members: [{
    type: String, // Storing usernames of members who joined
  }],
  files: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['file', 'folder'], required: true },
    parent: { type: String, default: null }, // ID of parent folder, or null
    content: { type: String, default: '' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Workspace', WorkspaceSchema);
