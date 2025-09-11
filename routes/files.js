const express = require('express');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Download file
router.get('/download/:type/:filename', auth, (req, res) => {
  try {
    const { type, filename } = req.params;
    const allowedTypes = ['tickets', 'chats', 'posts', 'knowledge'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', type, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get file history for user
router.get('/history', auth, async (req, res) => {
  try {
    // This would typically aggregate files from tickets, chats, posts, etc.
    // For now, return empty array as placeholder
    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;