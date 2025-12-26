// controllers/postController.js
import fs from "fs";
import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";
import { getImageEmbedding } from "../utils/imageEmbedding.js";
import { getTextEmbedding } from "../utils/duplicateCheckAI.js";
import { createAndSendNotification } from "../utils/socketEvents.js";
import sharp from "sharp";

const { getIo } = await import("../config/socket.js");

/* ===========================
   CREATE POST (MULTER BASED)
=========================== */
export const createPost = async (req, res) => {
  try {
    const { title, description, category, address } = req.body;
    let location;

    // Parse location safely
    if (req.body.location) {
      try {
        location = typeof req.body.location === "string"
          ? JSON.parse(req.body.location)
          : req.body.location;
      } catch (err) {
        return res.status(400).json({ message: "Invalid location format" });
      }
    } else {
      return res.status(400).json({ message: "Location is required" });
    }

    // Validate coordinates
    if (!location.coordinates || !Array.isArray(location.coordinates)) {
      return res.status(400).json({ message: "Coordinates are required" });
    }

    // Check other required fields
    if (!title || !description || !category || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check file upload
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "posts",
    });

    // FIX: Get userId properly from both req.user and req.userId
    const userId = req.userId || req.user?._id || req.user?.id;

    // Create Post - FIX: Use 'image' field instead of 'media' to match Post model
    const newPost = new Post({
      title,
      description,
      category,
      address,
      location,
      image: result.secure_url, // FIX: Changed from 'media' to 'image'
      user: userId,
    });

    const savedPost = await newPost.save();
    
    // Populate user before returning
    await savedPost.populate("user", "name email avatar");
    
    res.status(201).json({ post: savedPost });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===========================
   REMAINING CONTROLLERS
=========================== */

export const getNearbyPosts = async (req, res) => {
  try {
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat);
    const radius = parseInt(req.query.radius || "500", 10);

    if (isNaN(lng) || isNaN(lat)) {
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("user", "name email avatar");
      return res.json({ posts });
    }

    const posts = await Post.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    })
      .limit(200)
      .populate("user", "name email avatar");

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", "name email avatar");
    if (!post) return res.status(404).json({ message: "Not found" });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    // FIX: Get userId properly
    const userId = req.userId || req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "name email avatar");
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // FIX: Get userId properly and convert to string for comparison
    const userId = (req.userId || req.user?._id || req.user?.id)?.toString();
    
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // FIX: Get userId properly
    const userId = (req.userId || req.user?._id || req.user?.id)?.toString();
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // FIX: Use .some() with toString() for proper ObjectId comparison
    const hasLiked = post.likes.some(id => id.toString() === userId);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      if (post.user.toString() !== userId) {
        await createAndSendNotification(post.user, {
          title: "Post Liked",
          message: "Someone liked your post",
          data: { postId: post._id },
        });
      }
    }

    await post.save();
    res.json({ message: "Like updated", likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    // FIX: Add null check for post
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // FIX: Get userId properly
    const userId = req.userId || req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    post.comments.push({
      user: userId,
      message: req.body.text,
    });

    await post.save();

    if (post.user.toString() !== userId.toString()) {
      await createAndSendNotification(post.user, {
        title: "New Comment",
        message: "Someone commented on your post",
        data: { postId: post._id },
      });
    }

    res.json({ message: "Comment added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePostStatus = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // FIX: Get userId properly and convert to string
    const userId = (req.userId || req.user?._id || req.user?.id)?.toString();

    if (
      post.user.toString() !== userId &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.status = req.body.status;
    await post.save();

    if (post.user.toString() !== userId) {
      await createAndSendNotification(post.user, {
        title: "Status Updated",
        message: `Your issue is now marked as ${req.body.status}`,
        data: { postId: post._id },
      });
    }

    res.json({ message: "Status updated", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .select("comments")
      .populate("comments.user", "name avatar");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
