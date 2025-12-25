import Post from "../models/Post.js";
import cloudinary from "../utils/cloudinary.js";
import { getImageEmbedding } from "../utils/imageEmbedding.js";
import { getTextEmbedding } from "../utils/duplicateCheckAI.js";
import { createAndSendNotification } from "../utils/socketEvents.js";
import sharp from "sharp";
import User from "../models/User.js";


/**
 * Helper to upload buffer to cloudinary
 */
const uploadBufferToCloudinary = (buffer, folder = "civiceye/posts") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

const createThumbnailBuffer = async (buf) => {
  return await sharp(buf).resize(600).jpeg({ quality: 65 }).toBuffer();
};


export const createPost = async (req, res) => {
  try {
    const { title, description, category, address, location, imageBase64 } = req.body;
    const userId = req.user?.id || req.user?._id || null;

    if (!location?.coordinates) return res.status(400).json({ message: "Location required" });

    let buffer = null;
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    }

    // Upload full image
    let uploaded = null;
    let thumbUploaded = null;
    if (buffer) {
      uploaded = await uploadBufferToCloudinary(buffer);
      const thumbBuf = await createThumbnailBuffer(buffer);
      thumbUploaded = await uploadBufferToCloudinary(thumbBuf);
    }

    // get embeddings
    let imageEmbedding = [];
    try {
      if (buffer) imageEmbedding = await getImageEmbedding(buffer);
    } catch (err) {
      console.warn("image embedding issue:", err.message);
    }

    let textEmbedding = [];
    try {
      textEmbedding = await getTextEmbedding(description || "");
    } catch (err) {
      console.warn("text embedding failed:", err.message);
    }

    // save post
    const newPost = await Post.create({
      title,
      description,
      category,
      address,
      image: uploaded?.secure_url || "",
      imagePublicId: uploaded?.public_id || "",
      thumbnail: thumbUploaded?.secure_url || "",
      location: {
        type: "Point",
        coordinates: location.coordinates,
      },
      user: userId,
      imageEmbedding,
      textEmbedding,
    });

    // nearby post notification
    const MAX_DISTANCE = 2000; // meters (1 km)

try {
  const nearbyUsers = await User.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: location.coordinates,
        },
        $maxDistance: MAX_DISTANCE,
      },
    },
    _id: { $ne: userId }, // exclude post owner
  }).select("_id");

  for (const nearbyUser of nearbyUsers) {
    await createAndSendNotification(nearbyUser._id, {
      title: "Nearby issue reported",
      message: "A new issue was reported near your location",
      data: {
        postId: newPost._id,
        category: newPost.category,
      },
    });
  }
} catch (err) {
  console.warn("Nearby notification failed:", err.message);
}

    // emit global new_post and send notifications to online users (simple strategy)
    const { getIo } = await import("../config/socket.js");
    const io = getIo();
    if (io) io.emit("new_post", { post: newPost });

    // Example: notify all users (not recommended at scale). Better: notify subscribed users.
    // Here we create notification for the owner as confirmation
    if (userId) {
      await createAndSendNotification(userId, {
        title: "Post created",
        message: "Your issue has been posted successfully",
        data: { postId: newPost._id },
      });
    }

    return res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    console.error("createPost err:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getNearbyPosts = async (req, res) => {
  try {
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat);
    const radius = parseInt(req.query.radius || "500", 10);

    // If latitude/longitude are not provided, return recent posts (fallback)
    if (isNaN(lng) || isNaN(lat)) {
      const posts = await Post.find().sort({ createdAt: -1 }).limit(200);
      return res.json({ posts });
    }

    const posts = await Post.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    }).limit(200);

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", "name email");
    if (!post) return res.status(404).json({ message: "Not found" });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getMyPosts = async (req, res) => {
  const posts = await Post.find({ user: req.userId })
    .sort({ createdAt: -1 });

  res.json(posts);
};


/*
=======================
 DELETE POST (OWNER ONLY)
=======================
*/
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId; // set by auth middleware

    // 🔍 Find post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔐 Ownership check
    if (post.user.toString() !== userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this post",
      });
    }

    // 🗑️ Delete post
    await post.deleteOne();

    res.json({ message: "Post deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Liked post notification habdler
export const likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  const userId = req.userId;

  // toggle like logic
  if (post.likes.includes(userId)) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);

    // 🔔 NOTIFY ONLY IF NOT SELF-LIKE
    if (post.user.toString() !== userId) {
      await createAndSendNotification(post.user, {
        title: "Post Liked",
        message: "Someone liked your post",
        data: { postId: post._id }
      });
    }
  }

  await post.save();
  res.json({ message: "Like updated" });
};


//Add comment 
export const addComment = async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);

  post.comments.push({
  user: req.userId,
  message: text,
});

  await post.save();

  // 🔔 Notify owner (not self)
  if (post.user.toString() !== req.userId) {
    await createAndSendNotification(post.user, {
      title: "New Comment",
      message: "Someone commented on your post",
      data: { postId: post._id }
    });
  }

  res.json({ message: "Comment added" });
};

//update status of post (admin or owner)
export const updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const postId = req.params.id;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔐 Only OWNER or ADMIN can update status
    if (
      post.user.toString() !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.status = status;
    await post.save();

    // 🔔 Notify post owner (skip self)
    if (post.user.toString() !== userId) {
      await createAndSendNotification(post.user, {
        title: "Status Updated",
        message: `Your issue is now marked as ${status}`,
        data: { postId: post._id },
      });
    }

    res.json({ message: "Status updated successfully", post });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



