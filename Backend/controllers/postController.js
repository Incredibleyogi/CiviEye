// controllers/postController.js
import fs from "fs";
import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";
import { getImageEmbedding } from "../utils/imageEmbedding.js";
import { getTextEmbedding } from "../utils/duplicateCheckAI.js";
import { createAndSendNotification } from "../utils/socketEvents.js";
import sharp from "sharp";
import Notification from "../models/Notification.js";


const { getIo } = await import("../config/socket.js");

/* ===========================
   CREATE POST (MULTER BASED)
=========================== */
export const createPost = async (req, res) => {
  try {
    const { title, description, category, address, location } = req.body;

    // 1. Basic validation
    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2. Parse & validate location
    let parsedLocation = location;
    if (typeof location === "string") {
      parsedLocation = JSON.parse(location);
    }

    if (
      parsedLocation?.type !== "Point" ||
      !Array.isArray(parsedLocation.coordinates) ||
      parsedLocation.coordinates.length !== 2
    ) {
      return res.status(400).json({ message: "Invalid location format" });
    }

    // 3. Upload image to Cloudinary (if exists)
    let imageUrls = [];

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "civiceye/posts",
          resource_type: "image",
        }
      );

      imageUrls.push(uploadResult.secure_url);
    }

    // 4. CREATE POST (THIS IS WHERE images: imageUrls GOES)
    const post = await Post.create({
      title,
      description,
      category,
      address,
      location: parsedLocation,
      user: req.user._id,
      image: imageUrls[0], // ✅ IMPORTANT
      status: "Unresolved",
      mediaType: req.file ? "image" : "video",
    });
   // Send notification to all users EXCEPT the creator
const allUsers = await User.find({ _id: { $ne: req.user._id } }, "_id");
const existingNotifications = await Notification.find({
  'data.postId': post._id,
  type: 'nearby_post'
});
if (existingNotifications.length === 0) {
await createAndSendNotification(
  allUsers.map(u => u._id.toString()),
  {
    title: "New Civic Issue Reported",
    message: `${post.title} reported near ${address || 'your area'}`,
    type: "nearby_post",
    data: { postId: post._id },
  }
);
}


    return res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ===========================
   REMAINING CONTROLLERS
=========================== */

export const getNearbyPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
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
    const userRole = req.user?.role;
    
    console.log('[postController] updatePostStatus:', {
      postId: req.params.id,
      newStatus: req.body.status,
      userId,
      userRole,
      isAdmin: userRole === 'admin',
      postOwnerId: post.user.toString(),
      isPostOwner: post.user.toString() === userId
    });

    // FIX: Allow if admin OR post owner
    if (
      post.user.toString() !== userId &&
      userRole !== "admin"
    ) {
      console.log('[postController] Authorization failed - not admin and not post owner');
      return res.status(403).json({ message: "Not authorized" });
    }

    console.log('[postController] Updating post status from', post.status, 'to', req.body.status);
    post.status = req.body.status;
    await post.save();
    console.log('[postController] Post status saved successfully');

    if (post.user.toString() !== userId) {
      await createAndSendNotification(post.user, {
        title: "Status Updated",
        message: `Your issue is now marked as ${req.body.status}`,
        data: { postId: post._id },
      });
    }

    res.json({ message: "Status updated", post });
  } catch (err) {
    console.error('[postController] updatePostStatus error:', err);
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

/* =======================
   GET POSTS BY USER ID
======================= */
export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ user: userId })  // ← Changed from "user.id"
      .populate('user', 'name avatar')  // ← Add populate to get user details
      .sort({ createdAt: -1 })
      .lean();

    const transformedPosts = posts.map((post) => ({
      id: post._id,
      imageUrl: post.image,  // ← Your schema uses 'image', not 'imageUrl'
      caption: post.description,  // ← Your schema uses 'description', not 'caption'
      category: post.category,
      status: (post.status || "unresolved").toLowerCase().replace(' ', '_'),
      likes: post.likes?.length || 0,  // ← likes is an array of ObjectIds
      likedBy: post.likes || [],
      comments: post.comments || [],
      createdAt: post.createdAt,
      user: {
        id: post.user?._id,
        name: post.user?.name,
        avatar: post.user?.avatar,
      },
      location: {
        coordinates: post.location?.coordinates,
        address: post.address,
      },
    }));

    res.status(200).json({ posts: transformedPosts });
  } catch (error) {
    console.error("Get posts by user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


