import express from "express";
import {
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/password.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
