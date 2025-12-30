// routes/postRoutes.js
import express from "express";
import {
  createPost,
  getNearbyPosts,
  getPost,
  getMyPosts,
  deletePost,
  updatePostStatus,
  likePost,
  addComment,
  getPostComments
} from "../controllers/postController.js";

import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import duplicateCheck from "../middleware/duplicateCheck.js";

const router = express.Router();

/*
=====================
 CREATE POST (ONLY ONE)
 Flow:
 protect → multer → duplicateCheck → createPost
=====================
*/
router.post(
  "/",
  protect,
  upload.single("media"),
  duplicateCheck,                  
  createPost
);

/*
=====================
 READ
=====================
*/
router.get("/", getNearbyPosts);      /////
router.get("/my-posts", protect, getMyPosts);
router.get("/:id", getPost);

/*
=====================
 UPDATE / DELETE
=====================
*/
router.delete("/:id", protect, deletePost);
router.patch("/:id/status", protect, updatePostStatus);

/*
=====================
 INTERACTIONS
=====================
*/
router.post("/:id/like", protect, likePost);
router.post("/:id/comment", protect, addComment);
router.get("/:id/comments", getPostComments);

export default router;
