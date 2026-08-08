const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const { v4: uuidV4 } = require('uuid');

// @route   GET /api/workspaces
// @desc    Get all workspaces owned by the logged-in user
// @access  Private
router.get('/workspaces', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workspaces
// @desc    Create a new workspace
// @access  Private
router.post('/workspaces', auth, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const roomId = uuidV4();
    
    // Create standard default files for HTML/CSS/JS preview
    const defaultFiles = [
      {
        id: '1',
        name: 'index.html',
        type: 'file',
        parent: null,
        content: `<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello Code!</h1>\n  <script src="script.js"></script>\n</body>\n</html>`
      },
      {
        id: '2',
        name: 'style.css',
        type: 'file',
        parent: null,
        content: `h1 {\n  color: #2563EB;\n  font-family: sans-serif;\n  text-align: center;\n  margin-top: 50px;\n}`
      },
      {
        id: '3',
        name: 'script.js',
        type: 'file',
        parent: null,
        content: `console.log("Hello from collaborative script!");`
      }
    ];

    const workspace = new Workspace({
      title,
      owner: req.user.id,
      roomId,
      members: [req.user.username],
      files: defaultFiles
    });

    await workspace.save();
    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/workspaces/:id
// @desc    Delete a workspace
// @access  Private
router.delete('/workspaces/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user is owner
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this workspace' });
    }

    await Workspace.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workspace removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/join
// @desc    Join workspace by roomId (supports both logged-in users and guests)
// @access  Public
router.post('/join', async (req, res) => {
  const { roomId, username } = req.body;

  if (!roomId || !username) {
    return res.status(400).json({ message: 'Room ID and username are required' });
  }

  try {
    const workspace = await Workspace.findOne({ roomId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Add to members if not already listed
    if (!workspace.members.includes(username)) {
      workspace.members.push(username);
      await workspace.save();
    }

    res.json({
      workspace,
      role: workspace.owner.toString() === req.body.userId ? 'owner' : 'guest'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/workspaces/:roomId/files
// @desc    Save workspace files array to database
// @access  Public (so guests/members can trigger save too if needed, or simply for API simplicity)
router.put('/workspaces/:roomId/files', async (req, res) => {
  const { files } = req.body;
  if (!files) {
    return res.status(400).json({ message: 'Files array is required' });
  }
  try {
    const workspace = await Workspace.findOneAndUpdate(
      { roomId: req.params.roomId },
      { $set: { files } },
      { new: true }
    );
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
