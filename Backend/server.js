// server.js
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:8080",
  "https://poetic-cheesecake-c2e17a.netlify.app",
  "https://civi-eye.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      console.warn('[CORS] Rejected origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // required for cookies and Google OAuth redirects
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Log origin for auth endpoints to help diagnose cookie/credential issues in production
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/auth')) {
    console.log('[auth] origin header:', req.headers.origin);
  }
  next();
});

// Parse cookies from incoming requests
app.use(cookieParser());
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
