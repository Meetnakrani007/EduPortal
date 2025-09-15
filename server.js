const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io available to routes
app.set("io", io);

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
  .then(async () => {
    console.log("MongoDB connected");
    // Seed default admin in development if configured
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    try {
      let admin = await User.findOne({ email: adminEmail });
      if (!admin) {
        admin = new User({
          name: "Admin User",
          email: adminEmail,
          password: adminPassword,
          role: "admin",
          department: "IT",
        });
        await admin.save();
        console.log("Seeded admin user:", adminEmail);
      } else {
        let changed = false;
        if (admin.role !== "admin") {
          admin.role = "admin";
          changed = true;
        }
        // Ensure known password so you can log in
        admin.password = adminPassword; // will be hashed by pre-save hook
        changed = true;
        if (changed) {
          await admin.save();
          console.log("Updated admin user and password for:", adminEmail);
        }
      }
    } catch (e) {
      console.error("Admin seeding error:", e.message);
    }
  })
  .catch((err) => console.log(err));

// Socket.io events
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("typing", ({ roomId, user }) => {
    socket.to(roomId).emit("typing", { user });
  });

  socket.on("stopTyping", ({ roomId, user }) => {
    socket.to(roomId).emit("stopTyping", { user });
  });

  socket.on("newMessage", (data) => {
    // Broadcast new message to room
    socket.to(data.roomId).emit("newMessage", data);
  });

  socket.on("messageSeen", ({ roomId, messageId, user }) => {
    socket.to(roomId).emit("messageSeen", { messageId, user });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
