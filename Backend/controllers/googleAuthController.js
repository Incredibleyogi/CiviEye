//controllers/googleAuthController.js
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import { signToken } from "../config/jwt.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =======================
   GOOGLE LOGIN
======================= */
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    /* =======================
       VALIDATE INPUT
    ======================= */
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    /* =======================
       VERIFY GOOGLE TOKEN
    ======================= */
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    /* =======================
       FIND OR CREATE USER
    ======================= */
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Google data
     user = await User.create({
  name,
  email,
  avatar: picture,
  provider: "google",
  isVerified: true,
});

    }

    /* =======================
       GENERATE JWT TOKEN
    ======================= */
    const jwtToken = signToken({ id: user._id });


    res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Google authentication failed" });
  }
};
