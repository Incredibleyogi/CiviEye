// routes/authRoutes.js
import express from "express";
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
  updateProfile,
  getCurrentUser,updateAvatar
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

import { googleLogin } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/profile/avatar", protect, updateAvatar);

router.put("/update-profile", protect, updateProfile);
router.get("/me", protect, getCurrentUser);


// 🔵 Google login
router.post("/google", googleLogin);

export default router;
