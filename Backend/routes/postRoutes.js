import express from "express";
import { createPost, getNearbyPosts, getPost, getMyPosts,deletePost,updatePostStatus,likePost,addComment} from "../controllers/postController.js";

import duplicateCheck from "../middleware/duplicateCheck.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, duplicateCheck, createPost);
router.get("/nearby", getNearbyPosts);
router.get("/:id", getPost);
router.get("/my-posts", protect, getMyPosts);
router.delete("/:id", protect, deletePost);
router.patch("/:id/status", protect, updatePostStatus);
router.post("/:id/like", protect, likePost);
router.post("/:id/comment", protect, addComment);






export default router;
