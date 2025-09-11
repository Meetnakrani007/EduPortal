const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/chats", require("./routes/chats"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/knowledge", require("./routes/knowledge"));
app.use("/api/files", require("./routes/files"));
app.use("/api/tags", require("./routes/tags"));

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/edusupport", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Socket.io events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('typing', ({ roomId, user }) => {
    socket.to(roomId).emit('typing', { user });
  });

  socket.on('stopTyping', ({ roomId, user }) => {
    socket.to(roomId).emit('stopTyping', { user });
  });

  socket.on('newMessage', (data) => {
    // Broadcast new message to room
    socket.to(data.roomId).emit('newMessage', data);
  });

  socket.on('messageSeen', ({ roomId, messageId, user }) => {
    socket.to(roomId).emit('messageSeen', { messageId, user });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
