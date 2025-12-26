import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String, // Cloudinary URL
  imagePublicId: String, // Cloudinary public id
  thumbnail: String, // small version
  mediaType: {
  type: String,
  enum: ["image", "video"],
  default: "image"
},
  category: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
  // GeoJSON
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  address: String,
  status: { type: String, default: "Unresolved" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Embeddings for duplicate detection
  imageEmbedding: { type: [Number], default: [] }, // float array
  textEmbedding: { type: [Number], default: [] }, // optional if using text embeddings
  createdAt: { type: Date, default: Date.now }
});

postSchema.index({ location: "2dsphere" });

export default mongoose.model("Post", postSchema);
