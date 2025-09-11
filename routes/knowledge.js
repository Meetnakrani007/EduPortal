const express = require('express');
const multer = require('multer');
const path = require('path');
const Knowledge = require('../models/Knowledge');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/knowledge/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Get all published knowledge articles
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    let query = { isPublished: true };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await Knowledge.find(query)
      .populate('author', 'name email role')
      .populate('tags', 'name displayName color')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Knowledge.countDocuments(query);

    res.json({
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single knowledge article
router.get('/:id', async (req, res) => {
  try {
    const article = await Knowledge.findById(req.params.id)
      .populate('author', 'name email role')
      .populate('tags', 'name displayName color');

    if (!article || !article.isPublished) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create knowledge article (teachers and admins only)
router.post('/', auth, authorize('teacher', 'admin'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, content, category, tags, isPublished = false } = req.body;
    
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];

    const article = new Knowledge({
      title,
      content,
      category,
      author: req.user._id,
      tags: tags ? JSON.parse(tags) : [],
      attachments,
      isPublished
    });

    await article.save();
    await article.populate('author', 'name email role');
    await article.populate('tags', 'name displayName color');

    res.status(201).json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update knowledge article
router.put('/:id', auth, authorize('teacher', 'admin'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, content, category, tags, isPublished } = req.body;
    
    const article = await Knowledge.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check if user is author or admin
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];

    article.title = title || article.title;
    article.content = content || article.content;
    article.category = category || article.category;
    article.tags = tags ? JSON.parse(tags) : article.tags;
    article.isPublished = isPublished !== undefined ? isPublished : article.isPublished;
    article.lastUpdated = new Date();
    
    if (attachments.length > 0) {
      article.attachments.push(...attachments);
    }

    await article.save();
    await article.populate('author', 'name email role');
    await article.populate('tags', 'name displayName color');

    res.json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;