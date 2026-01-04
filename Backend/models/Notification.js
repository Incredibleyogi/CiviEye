import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
  title: { type: String, required: true },
  message: { type: String, required: true },
   type: { type: String, enum: ['like', 'comment', 'status_update', 'admin_response', 'nearby_post'], default: 'nearby_post' },
  data: { type: Object, default: {} }, // extra payload like { postId }
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
