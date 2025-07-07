require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Import des routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const groupRoutes = require("./routes/groupRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Import du gestionnaire de sockets
const handleSocketConnection = require("./socket/socketHandler");

const app = express();
const httpServer = createServer(app);

// Configuration CORS
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
    })
);

app.use(express.json());

// Servir les fichiers statiques (images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configuration Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/upload", uploadRoutes);

// Gestion des connexions Socket.IO
handleSocketConnection(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Socket.IO server ready`);
});
