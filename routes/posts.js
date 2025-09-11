const express = require('express');
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Get all published posts
router.get('/', async (req, res) => {
  try {
    const { category, tag, page = 1, limit = 10, search, sort } = req.query;
    
    let query = { isPublished: true };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    const sortBy = sort === 'views' ? { viewCount: -1 } : { createdAt: -1 };

    const posts = await Post.find(query)
      .populate('author', 'name email role')
      .populate('tags', 'name displayName color')
      .populate('comments.author', 'name email')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role')
      .populate('tags', 'name displayName color')
      .populate('comments.author', 'name email');

    if (!post || !post.isPublished) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post (teachers and admins only)
// Accepts multiple forms of input for better DX:
// - files under field name "attachments" OR "attachment"
// - tags as JSON string in "tags" OR repeated fields "tags[]" OR comma-separated "tags"
router.post('/', auth, authorize('teacher', 'admin'), upload.any(), async (req, res) => {
  try {
    let { title, content, summary } = req.body;
    let category = req.body.category || 'General';
    
    // Normalize attachments from any field name
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    const attachments = uploadedFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    }));

    // Normalize tags input
    let incomingTags = [];
    if (Array.isArray(req.body['tags[]'])) {
      incomingTags = req.body['tags[]'];
    } else if (typeof req.body.tags === 'string') {
      try {
        const parsed = JSON.parse(req.body.tags);
        if (Array.isArray(parsed)) incomingTags = parsed;
      } catch (e) {
        // Fallback: comma-separated or single value
        incomingTags = req.body.tags.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Map tag names (with optional leading #) to Tag documents
    const Tag = require('../models/Tag');
    const tagIds = [];
    for (const raw of incomingTags) {
      const name = String(raw).replace(/^#/,'').trim();
      if (!name) continue;
      let tagDoc = await Tag.findOne({ name: name.toLowerCase() });
      if (!tagDoc) {
        tagDoc = await Tag.create({ name: name.toLowerCase(), displayName: raw, createdBy: req.user._id });
      }
      tagIds.push(tagDoc._id);
    }

    const post = new Post({
      title,
      content,
      category,
      author: req.user._id,
      tags: tagIds,
      attachments,
      summary
    });

    await post.save();
    await post.populate('author', 'name email role');
    await post.populate('tags', 'name displayName color');

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push({ user: req.user._id });
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: likeIndex === -1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      author: req.user._id,
      content
    });

    await post.save();
    await post.populate('comments.author', 'name email');

    res.json(post.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/unsave post
router.post('/:id/save', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const saveIndex = post.saves.findIndex(
      save => save.user.toString() === req.user._id.toString()
    );

    if (saveIndex > -1) {
      // Unsave
      post.saves.splice(saveIndex, 1);
    } else {
      // Save
      post.saves.push({ user: req.user._id });
    }

    await post.save();
    res.json({ saved: saveIndex === -1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post (owner teacher or admin)
router.delete('/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const postId = req.params.id;
    const requesterId = req.user._id?.toString();
    const role = req.user.role;
    const post = await Post.findById(postId).select('author');
    if (!post) {
      console.log('Delete: post not found', postId);
      return res.status(404).json({ message: 'Post not found' });
    }
    if (role === 'teacher' && post.author.toString() !== requesterId) {
      console.log('Delete: not owner', { postAuthor: post.author.toString(), requesterId });
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    await Post.findByIdAndDelete(postId);
    return res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
 