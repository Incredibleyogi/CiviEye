import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic identity
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  contactNo: String,
  gender: String,
  city: String,
  country: String,

  // Auth status
  isVerified: {
    type: Boolean,
    default: false,
  },

  // OTP (for verification / reset)
  otp: Number,
  otpExpiry: Number,
  otpLastSentAt: Number 

}, { timestamps: true });



export default mongoose.model("User", userSchema);
