const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + '_' + Date.now() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    console.error('File rejected by filter:', file.originalname, file.mimetype);
    cb(new Error('Only .jpg, .jpeg, .png files are allowed'));
  }
};

const upload = multer({ storage, fileFilter });

// Get all teachers (for chat selection)
router.get('/teachers', auth, async (req, res) => {
  try {
    const teachers = await User.find({ 
      role: 'teacher', 
      isActive: true 
    }).select('name email department avatar');
    
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { darkMode, fontSize, dyslexiaFont, highContrast } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'preferences.darkMode': darkMode,
          'preferences.fontSize': fontSize,
          'preferences.dyslexiaFont': dyslexiaFont,
          'preferences.highContrast': highContrast
        }
      },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    console.log('Avatar upload:', req.file);
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Save avatar URL to user
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: avatarUrl } },
      { new: true }
    ).select('-password');
    res.json({ url: avatarUrl, user });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin summary (admin only)
router.get('/admin/summary', auth, authorize('admin'), async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    const Post = require('../models/Post');
    const totalUsers = await User.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const totalPosts = await Post.countDocuments();
    res.json({ totalUsers, totalTickets, totalPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: users with ticket stats
router.get('/admin/users-with-stats', auth, authorize('admin'), async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    const users = await User.find().select('name email role createdAt');
    const userIds = users.map(u => u._id);
    const agg = await Ticket.aggregate([
      { $match: { student: { $in: userIds } } },
      { $group: { _id: '$student',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        underReview: { $sum: { $cond: [{ $eq: ['$status', 'under review'] }, 1, 0] } },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
      }}
    ]);
    const statsMap = new Map(agg.map(a => [String(a._id), a]));
    const data = users.map(u => {
      const s = statsMap.get(String(u._id)) || { total: 0, resolved: 0, underReview: 0, open: 0 };
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        tickets: s
      };
    });
    res.json({ users: data });
  } catch (error) {
    console.error('admin users-with-stats error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: delete a user
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Optionally, you could soft-delete or anonymize related data here.
    return res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('delete user error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;