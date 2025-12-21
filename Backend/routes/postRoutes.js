import express from "express";
import { createPost, getNearbyPosts, getPost, getMyPosts,deletePost} from "../controllers/postController.js";

import duplicateCheck from "../middleware/duplicateCheck.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, duplicateCheck, createPost);
router.get("/nearby", getNearbyPosts);
router.get("/:id", getPost);
router.get("/my-posts", protect, getMyPosts);

router.post("/create", protect, createPost);
router.delete("/:id", protect, deletePost);




export default router;
