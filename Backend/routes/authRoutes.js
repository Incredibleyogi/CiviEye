import express from "express";
import {
  signup,
  login,
  verifyOtp,
  resendOtp
} from "../controllers/authController.js";

import { googleLogin } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

// 🔵 Google login
router.post("/google", googleLogin);

export default router;
