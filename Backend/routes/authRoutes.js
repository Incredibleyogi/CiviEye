// routes/authRoutes.js
import express from "express";
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
  updateProfile,
  getUserById ,
  getCurrentUser,
  updateAvatar,
  updateUserRole,
  logout
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";

import { googleLogin } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/logout", logout);
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.get("/user/:userId", protect, getUserById);
router.put("/update-profile", protect, updateProfile);
router.get("/me", protect, getCurrentUser);
router.patch("/users/:userId/role", protect, updateUserRole);  // Admin only - Update user role

// 🔵 Google login
router.post("/google", googleLogin);

export default router;
