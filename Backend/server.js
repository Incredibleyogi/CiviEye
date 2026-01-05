// server.js
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import passRoutes from "./routes/passroutes.js";
import AdminRoutes from "./routes/AdminRoutes.js";

const app = express();
app.disable('etag');

// Middleware
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true, // needed for Google OAuth redirects
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/password", passRoutes);
app.use("/api/admin", AdminRoutes);

// Database
connectDB();

// HTTP + Socket Server
const server = http.createServer(app);
initSocket(server);

// Base route (optional)
app.get("/", (req, res) => {
  res.send("CivicEye API Running...");
});

// Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
});
