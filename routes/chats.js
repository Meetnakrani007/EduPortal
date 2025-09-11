const express = require('express');
const multer = require('multer');
const path = require('path');
const Chat = require('../models/Chat');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chats/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Get or create chat between student and teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Only students can initiate chats
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access this endpoint' });
    }

    let chat = await Chat.findOne({
      student: req.user._id,
      teacher: teacherId
    }).populate('student', 'name email')
     .populate('teacher', 'name email')
     .populate('messages.sender', 'name email role');

    if (!chat) {
      chat = new Chat({
        student: req.user._id,
        teacher: teacherId,
        messages: []
      });
      await chat.save();
      await chat.populate('student', 'name email');
      await chat.populate('teacher', 'name email');
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all chats for current user
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else {
      // Admin can see all chats
      query = {};
    }

    const chats = await Chat.find(query)
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .sort({ lastActivity: -1 });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat by ticketId (assuming one chat per ticket)
router.get('/by-ticket/:ticketId', auth, async (req, res) => {
  try {
    const { ticketId } = req.params;
    let chat = await Chat.findOne({ ticket: ticketId })
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .populate('messages.sender', 'name email role');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Permission check: only participants (student or assigned teacher) or admin can access
    if (
      req.user.role === 'student' && chat.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (
      req.user.role === 'teacher' && chat.teacher._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/message', auth, upload.array('attachments', 3), async (req, res) => {
  try {
    const { message } = req.body;
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check permissions
    const isParticipant = chat.student.toString() === req.user._id.toString() || 
                         chat.teacher.toString() === req.user._id.toString();
    
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];
    const msgText = message && message.trim() ? message : (attachments.length > 0 ? '[file]' : '');
    if (!msgText) {
      return res.status(400).json({ message: 'Message or file is required.' });
    }
    chat.messages.push({
      sender: req.user._id,
      message: msgText,
      attachments,
      readBy: [{ user: req.user._id }]
    });

    await chat.save();
    await chat.populate('messages.sender', 'name email role');

    const newMsg = chat.messages[chat.messages.length - 1];
    res.json(newMsg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message by ticketId (for ticket-based chat)
router.post('/by-ticket/:ticketId', auth, upload.array('attachments', 3), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const Ticket = require('../models/Ticket');
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!ticket.assignedTo) return res.status(400).json({ message: 'Ticket is not assigned to a teacher yet.' });
    let chat = await Chat.findOne({ ticket: ticketId });
    if (!chat) {
      chat = new Chat({ student: ticket.student, teacher: ticket.assignedTo, ticket: ticket._id, messages: [] });
      await chat.save();
    }
    // Log user and ticket info for debugging
    console.log('User', req.user._id, 'is sending a message to ticket', ticketId, 'chat', chat._id);
    // Temporarily remove permission check for testing
    // const isParticipant = chat.student.toString() === req.user._id.toString() || chat.teacher.toString() === req.user._id.toString();
    // if (!isParticipant && req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied' });
    // }
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];
    chat.messages.push({
      sender: req.user._id,
      message,
      attachments,
      readBy: [{ user: req.user._id }]
    });
    await chat.save();
    await chat.populate('messages.sender', 'name email role');
    const newMsg = chat.messages[chat.messages.length - 1];
    newMsg.chat = chat._id;
    res.json(newMsg);
    // If student sends a message and ticket is open, set status to 'under review'
    if (req.user.role === 'student' && ticket.status === 'open') {
      ticket.status = 'under review';
      await ticket.save();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as seen
router.patch('/:chatId/message/:messageId/seen', auth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const msg = chat.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (!msg.seenBy.includes(req.user._id)) {
      msg.seenBy.push(req.user._id);
      await chat.save();
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark chat as resolved
router.put('/:chatId/resolve', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check permissions
    const isParticipant = chat.student.toString() === req.user._id.toString() || 
                         chat.teacher.toString() === req.user._id.toString();
    
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    chat.status = 'resolved';
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;