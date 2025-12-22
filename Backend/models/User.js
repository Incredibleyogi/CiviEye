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
  location: {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  role: { type: String, enum: ["user", "admin"], default: "user" }
  ,
  coordinates: {
    type: [Number], // [lng, lat]
    index: "2dsphere",
  },
}
,

  // OTP (for verification / reset)
  otp: String,
  otpExpiry: Number,
  otpLastSentAt: Number 

}, { timestamps: true });



export default mongoose.model("User", userSchema);
