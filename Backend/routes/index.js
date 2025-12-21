// routes/index.js
import express from "express";
import authRoutes from "./authRoutes.js";
import postRoutes from "./postRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/notifications", notificationRoutes);

export default router;
