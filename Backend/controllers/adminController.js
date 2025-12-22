// controllers/adminController.js
import Post from "../models/Post.js";
import { createAndSendNotification } from "../utils/socketEvents.js";

export const respondToPost = async (req, res) => {
  try {
    const { message } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔔 Notify post owner
    await createAndSendNotification(post.user, {
      title: "Official Response",
      message,
      data: { postId },
    });

    res.json({ message: "Response sent to user" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
