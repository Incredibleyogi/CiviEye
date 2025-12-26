// routes/AdminRoutes.js
import express from "express";
import { respondToPost } from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/respond/:postId", protect, adminOnly, respondToPost);

export default router;
