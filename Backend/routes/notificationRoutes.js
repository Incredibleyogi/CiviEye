import express from "express";
import { getNotifications, markRead,getNotificationCount } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/count", protect, getNotificationCount);
router.post("/mark-read", protect, markRead);

export default router;
