const express = require('express');
const Tag = require('../models/Tag');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ usageCount: -1, name: 1 });
    res.json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create tag
router.post('/', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { name, displayName, description, color } = req.body;
    
    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    const tag = new Tag({
      name: name.toLowerCase(),
      displayName,
      description,
      color,
      createdBy: req.user._id
    });

    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular tags
router.get('/popular', async (req, res) => {
  try {
    const tags = await Tag.find()
      .sort({ usageCount: -1 })
      .limit(10);
    
    res.json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;