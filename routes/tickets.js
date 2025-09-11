const express = require('express');
const multer = require('multer');
const path = require('path');
const Ticket = require('../models/Ticket');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tickets/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Create ticket
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    // Accept assignedTo (teacher) from the request
    const { title, description, category, priority, tags, assignedTo, message } = req.body;
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];

    // Use message as description if provided (for Open Ticket form)
    const desc = description || message;

    const ticket = new Ticket({
      title: title || `${category} Ticket`,
      description: desc,
      category,
      priority,
      student: req.user._id,
      assignedTo: assignedTo || undefined,
      tags: tags ? JSON.parse(tags) : [],
      attachments,
      status: 'open'
    });

    await ticket.save();
    await ticket.populate('student', 'name email');
    await ticket.populate('assignedTo', 'name email');
    await ticket.populate('tags', 'name displayName color');

    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tickets (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Students can only see their own tickets
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }
    // Teachers can only see tickets assigned to them
    else if (req.user.role === 'teacher') {
      query.assignedTo = req.user._id;
    }
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await Ticket.find(query)
      .populate('student', 'name email')
      .populate('assignedTo', 'name email')
      .populate('tags', 'name displayName color')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ticket
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('student', 'name email')
      .populate('assignedTo', 'name email')
      .populate('tags', 'name displayName color')
      .populate('replies.author', 'name email role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (req.user.role === 'student' && ticket.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'teacher' && (!ticket.assignedTo || ticket.assignedTo._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reply to ticket
router.post('/:id/reply', auth, upload.array('attachments', 3), async (req, res) => {
  try {
    const { message } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (req.user.role === 'student' && ticket.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];

    ticket.replies.push({
      author: req.user._id,
      message,
      attachments
    });

    // If student sends first reply and ticket is open, set status to 'under review'
    if (req.user.role === 'student' && ticket.status === 'open') {
      ticket.status = 'under review';
    }

    await ticket.save();
    await ticket.populate('replies.author', 'name email role');

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ticket status
router.put('/:id/status', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'resolved' && { resolvedAt: new Date() }),
        ...(status === 'closed' && { closedAt: new Date() })
      },
      { new: true }
    ).populate('student', 'name email')
     .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PDFDocument = require('pdfkit'); // or use puppeteer for HTML-to-PDF

router.get('/:id/transcript', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('student', 'name email')
      .populate('assignedTo', 'name email')
      .populate('tags', 'name displayName color');
    if (!ticket || ticket.status !== 'resolved') {
      return res.status(404).json({ message: 'Ticket not found or not resolved' });
    }
    // Permission checks:
    // - Teacher: only if assigned
    // - Admin: allowed
    // - Student: allowed if owns the ticket OR a published post exists for this ticket
    let canDownload = false;
    if (req.user.role === 'admin') {
      canDownload = true;
    } else if (req.user.role === 'teacher') {
      canDownload = !!(ticket.assignedTo && ticket.assignedTo._id.toString() === req.user._id.toString());
    } else if (req.user.role === 'student') {
      const isOwner = ticket.student && ticket.student._id.toString() === req.user._id.toString();
      if (isOwner) {
        canDownload = true;
      } else {
        const Post = require('../models/Post');
        const publishedPost = await Post.findOne({ ticketId: ticket._id, isPublished: true }).select('_id');
        canDownload = !!publishedPost;
      }
    }
    if (!canDownload) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Fetch chat messages
    const Chat = require('../models/Chat');
    const chat = await Chat.findOne({ ticket: ticket._id })
      .populate('messages.sender', 'name email role avatar');
    // Generate PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=\"ticket-${ticket._id}-transcript.pdf\"`);
      res.send(pdfData);
    });
    // Set dark background for the page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#23272f');
    doc.fillColor('#fff'); // Set default text color to white
    const margin = 40;
    // Styled header
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#fff').text('Ticket Transcript', { align: 'center' });
    doc.moveDown(0.7);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#b3b3b3').text(`Ticket ID: `, { continued: true }).font('Helvetica').fillColor('#fff').text(`${ticket._id}`);
    doc.font('Helvetica-Bold').fillColor('#b3b3b3').text(`Title: `, { continued: true }).font('Helvetica').fillColor('#fff').text(`${ticket.title}`);
    doc.font('Helvetica-Bold').fillColor('#b3b3b3').text(`Category: `, { continued: true }).font('Helvetica').fillColor('#fff').text(`${ticket.category}`);
    doc.font('Helvetica-Bold').fillColor('#b3b3b3').text(`Status: `, { continued: true }).font('Helvetica').fillColor('#fff').text(`${ticket.status}`);
    doc.font('Helvetica-Bold').fillColor('#b3b3b3').text(`Student: `, { continued: true }).font('Helvetica').fillColor('#fff').text(`${ticket.student.name} (${ticket.student.email})`);
    doc.font('Helvetica-Bold').fillColor('#b3b3b3').text(`Teacher: `, { continued: true }).font('Helvetica').fillColor('#fff').text(`${ticket.assignedTo.name} (${ticket.assignedTo.email})`);
    doc.moveDown(0.7);
    // Divider
    doc.moveTo(margin, doc.y).lineTo(doc.page.width - margin, doc.y).strokeColor('#444').lineWidth(1).stroke();
    doc.moveDown(1);
    doc.fontSize(17).font('Helvetica-Bold').fillColor('#fff').text('Message History:');
    doc.moveDown(0.5);

    const studentId = ticket.student._id.toString();
    const teacherId = ticket.assignedTo._id.toString();
    const bubbleColors = {
      student: '#353b48', // blue/gray for student (left)
      teacher: '#353b48'  // same as student for teacher (right)
    };
    const textColor = '#fff';
    const initialBg = {
      student: '#3b82f6', // blue
      teacher: '#10b981'  // green
    };
    const profileTextColor = '#fff';
    const teacherProfileBg = '#10b981';
    const studentProfileBg = '#3b82f6';
    const teacherProfileText = '#fff';
    const studentProfileText = '#fff';
    const pageWidth = doc.page.width;
    const profileSize = 44;
    const bubbleMaxWidth = 340;
    const bubbleMinWidth = 120;
    const bubbleMinHeight = 48;
    const bubbleRadius = 18;
    const bubblePaddingX = 18;
    const bubblePaddingY = 10;
    let y = doc.y;
    const verticalGap = 24;

    if (chat && chat.messages.length) {
      chat.messages.forEach((msg, idx) => {
        y = doc.y; // always start at the current y for each message
        const isStudent = msg.sender._id.toString() === studentId;
        const alignRight = !isStudent;
        // Calculate bubble width based on content
        doc.font('Helvetica-Bold').fontSize(14);
        const nameWidth = doc.widthOfString(msg.sender.name, { width: bubbleMaxWidth - 2 * bubblePaddingX });
        doc.font('Helvetica').fontSize(12);
        const messageWidth = doc.widthOfString(msg.message, { width: bubbleMaxWidth - 2 * bubblePaddingX });
        let attachmentsWidth = 0;
        if (msg.attachments && msg.attachments.length > 0) {
          doc.font('Helvetica-Oblique').fontSize(11);
          msg.attachments.forEach(att => {
            const attWidth = doc.widthOfString(att.originalName || att.filename, { width: bubbleMaxWidth - 2 * bubblePaddingX });
            if (attWidth > attachmentsWidth) attachmentsWidth = attWidth;
          });
        }
        let bubbleContentWidth = Math.max(nameWidth, messageWidth, attachmentsWidth) + 2 * bubblePaddingX;
        if (bubbleContentWidth < bubbleMinWidth) bubbleContentWidth = bubbleMinWidth;
        if (bubbleContentWidth > bubbleMaxWidth) bubbleContentWidth = bubbleMaxWidth;
        // Bubble and profile positions
        const bubbleX = alignRight ? pageWidth - margin - bubbleContentWidth - profileSize - 8 : margin + profileSize + 8;
        const profileX = alignRight ? pageWidth - margin - profileSize : margin;
        // Calculate bubble height based on message and attachments
        let bubbleHeight = bubbleMinHeight;
        doc.font('Helvetica-Bold').fontSize(14);
        const nameHeight = doc.heightOfString(msg.sender.name, { width: bubbleMaxWidth - 2 * bubblePaddingX });
        doc.font('Helvetica').fontSize(12);
        const messageHeight = doc.heightOfString(msg.message, { width: bubbleMaxWidth - 2 * bubblePaddingX });
        let attachmentsHeight = 0;
        if (msg.attachments && msg.attachments.length > 0) {
          doc.font('Helvetica-Oblique').fontSize(11);
          msg.attachments.forEach(att => {
            attachmentsHeight += doc.heightOfString(att.originalName || att.filename, { width: bubbleMaxWidth - 2 * bubblePaddingX });
          });
        }
        bubbleHeight = nameHeight + messageHeight + attachmentsHeight + 3 * bubblePaddingY;
        if (bubbleHeight < bubbleMinHeight) bubbleHeight = bubbleMinHeight;
        // Before drawing, check if bubble will fit on current page
        if (y + bubbleHeight + verticalGap > doc.page.height - margin) {
          doc.addPage();
          // Reapply dark background and text color for new page
          doc.rect(0, 0, doc.page.width, doc.page.height).fill('#23272f');
          doc.fillColor('#fff');
          y = margin;
          doc.y = y;
        }
        // Draw profile circle (avatar or initials)
        if (msg.sender.avatar) {
          try {
            const avatarPath = path.join(__dirname, '..', 'uploads', 'avatars', msg.sender.avatar);
            doc.image(avatarPath, profileX, y, { width: profileSize, height: profileSize, fit: [profileSize, profileSize] });
          } catch (e) {
            // fallback to initials
            doc.circle(profileX + profileSize/2, y + profileSize/2, profileSize/2).fill(isStudent ? studentProfileBg : teacherProfileBg);
            doc.fillColor(isStudent ? studentProfileText : teacherProfileText).font('Helvetica-Bold').fontSize(18)
              .text(msg.sender.name.charAt(0).toUpperCase(), profileX, y + 12, { width: profileSize, align: 'center' });
          }
        } else {
          doc.circle(profileX + profileSize/2, y + profileSize/2, profileSize/2).fill(isStudent ? studentProfileBg : teacherProfileBg);
          doc.fillColor(isStudent ? studentProfileText : teacherProfileText).font('Helvetica-Bold').fontSize(18)
            .text(msg.sender.name.charAt(0).toUpperCase(), profileX, y + 12, { width: profileSize, align: 'center' });
        }
        // Draw message bubble
        doc.save();
        doc.roundedRect(bubbleX, y, bubbleContentWidth, bubbleHeight, bubbleRadius).fill(bubbleColors[isStudent ? 'student' : 'teacher']);
        doc.restore();
        // Sender name
        doc.fillColor('#fff').font('Helvetica-Bold').fontSize(14)
          .text(msg.sender.name, bubbleX + bubblePaddingX, y + bubblePaddingY, { width: bubbleContentWidth - 2 * bubblePaddingX, align: 'left' });
        // Message text
        doc.font('Helvetica').fontSize(12).fillColor('#fff')
          .text(msg.message, bubbleX + bubblePaddingX, y + bubblePaddingY + nameHeight + 2, { width: bubbleContentWidth - 2 * bubblePaddingX, align: 'left' });
        // Attachments
        let attachY = y + bubblePaddingY + nameHeight + 2 + messageHeight + 4;
        if (msg.attachments && msg.attachments.length > 0) {
          doc.font('Helvetica-Oblique').fontSize(11).fillColor('#60a5fa');
          msg.attachments.forEach(att => {
            doc.text(att.originalName || att.filename, bubbleX + bubblePaddingX, attachY, { width: bubbleContentWidth - 2 * bubblePaddingX, align: 'left', link: `${process.env.BASE_URL}/uploads/chats/${att.filename}` });
            attachY += doc.heightOfString(att.originalName || att.filename, { width: bubbleContentWidth - 2 * bubblePaddingX });
          });
        }
        doc.fillColor('#fff');
        // Move down for next message
        doc.y = y + bubbleHeight + verticalGap;
      });
    } else {
      doc.text('No chat messages.');
    }
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Publish helpful post from resolved ticket
router.put('/:id/publish-helpful-post', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('student', 'name email')
      .populate('assignedTo', 'name email')
      .populate('tags', 'name displayName color');
    
    if (!ticket || ticket.status !== 'resolved') {
      return res.status(404).json({ message: 'Ticket not found or not resolved' });
    }

    // Check if teacher is assigned to this ticket
    if (ticket.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to publish this ticket' });
    }

    // Fetch chat messages
    const Chat = require('../models/Chat');
    const chat = await Chat.findOne({ ticket: ticket._id })
      .populate('messages.sender', 'name email role avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found for this ticket' });
    }

    // Create content from chat messages
    let content = `Ticket: ${ticket.title}\n`;
    content += `Category: ${ticket.category}\n`;
    content += `Student: ${ticket.student.name}\n`;
    content += `Teacher: ${ticket.assignedTo.name}\n\n---\n\n`;

    chat.messages.forEach(msg => {
      const timestamp = new Date(msg.createdAt).toLocaleString();
      content += `${msg.sender.name} [${timestamp}]:\n${msg.content}\n\n`;
      
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          content += `📎 ${att.originalName}: ${att.path}\n`;
        });
        content += '\n';
      }
    });

    // Create the post
    const Post = require('../models/Post');
    const post = new Post({
      title: `Transcript: ${ticket.title}`,
      content: content,
      author: req.user.id,
      category: ticket.category,
      tags: ticket.tags,
      ticketId: ticket._id,
      summary: req.body.summary || ''
    });

    await post.save();
    await post.populate('author', 'name email');
    await post.populate('tags', 'name displayName color');

    res.json({ message: 'Helpful post created successfully', post });
  } catch (error) {
    console.error('Error publishing helpful post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;