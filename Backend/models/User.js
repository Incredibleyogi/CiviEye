import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: {
    type: String,
    required: function () {
      return this.provider === "local";
    },
  },

  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },

  avatar: String,

  contactNo: String,
  gender: String,
  city: String,
  country: String,

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
    coordinates: {
      type: [Number], // [lng, lat]
      index: "2dsphere",
    },
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  bio: { type: String, default: "" },


  otp: String,
  otpExpiry: Number,
  otpLastSentAt: Number,
}, { timestamps: true });

export default mongoose.model("User", userSchema);
