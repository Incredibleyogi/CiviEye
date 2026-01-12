// controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { signToken } from "../config/jwt.js";
import sendOTPEmail from "../utils/sendOTPEmail.js";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../utils/cloudinary.js";

/* =======================
   SIGNUP
======================= */
export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, lat, lng } = req.body;

    /* =======================
       BASIC VALIDATIONS
    ======================= */
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    /* =======================
       USER EXISTENCE CHECK
    ======================= */
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    /* =======================
       HASH PASSWORD
    ======================= */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* =======================
       OTP GENERATION (HASHED)
    ======================= */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    /* =======================
       USER OBJECT
    ======================= */
    const userData = {
      name,
      email,
      password: hashedPassword,
      otp: hashedOtp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
      otpLastSentAt: Date.now(),
      isVerified: false,
    };

    /* =======================
       OPTIONAL LOCATION
    ======================= */
    if (lat && lng) {
      userData.location = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)], // GeoJSON order
      };
    }

    const user = await User.create(userData);

    /* =======================
       SEND OTP EMAIL
    ======================= */
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: "Signup successful. OTP sent to email",
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   VERIFY OTP
======================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ⏱️ Check expiry
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // 🔐 Compare hashed OTP
    const isOtpValid = await bcrypt.compare(otp.toString(), user.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Verify account
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpLastSentAt = null;
    await user.save();

    res.json({
      message: "Account verified successfully. Please login.",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   LOGIN
======================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your account first",
      });
    }

    const token = signToken({ id: user._id });

    // Safe user response - include avatar and bio
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      bio: user.bio || null,
    };

    res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   RESEND OTP
======================= */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // ⏱️ OTP COOLDOWN (60 seconds)
    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt < 60 * 1000
    ) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP",
      });
    }

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔐 Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    user.otpLastSentAt = Date.now();
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ message: "New OTP sent to email" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   UPDATE PROFILE
======================= */
export const updateProfile = async (req, res) => {
  try {
    // FIX: Use req.user._id instead of req.user.id
    const userId = req.user?._id || req.user?.id || req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const user = await User.findById(userId);
    
    // FIX: Add null check for user
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;
    
    // Only update avatar if provided (for non-file updates)
    if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    // Return safe user object
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      bio: user.bio || null,
    };

    res.json({ message: "Profile updated", user: safeUser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   GET CURRENT USER
======================= */
export const getCurrentUser = async (req, res) => {
  try {
    // FIX: Support both req.user._id and req.userId
    const userId = req.user?._id || req.user?.id || req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const user = await User.findById(userId).select("-password -otp -otpExpiry -otpLastSentAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   UPDATE AVATAR
======================= */
export const updateAvatar = async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: "Image is required" });
    }

    // FIX: Support both req.user._id and req.userId
    const userId = req.user?._id || req.user?.id || req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const upload = await cloudinary.uploader.upload(imageBase64, {
      folder: "civiceye/avatars",
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: upload.secure_url },
      { new: true }
    ).select("-password -otp -otpExpiry -otpLastSentAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Avatar updated", user });
  } catch (err) {
    console.error("Update avatar error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   GET USER BY ID (Public Profile)
======================= */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "-password -otp -otpExpiry -otpVerified -createdAt -updatedAt -__v"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

