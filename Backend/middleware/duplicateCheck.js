import { checkDuplicate } from "../utils/duplicateCheckAI.js";

const duplicateCheck = async (req, res, next) => {
  let timeoutId;
  try {
    const { description } = req.body;

    // 1. Get image buffer from multer (if exists)
    let imageBuffer = null;
    if (req.file?.buffer) {
      imageBuffer = req.file.buffer;
    }

    // 3. Run duplicate check
    const result = await Promise.race([
      checkDuplicate({ description, imageBuffer }),
      new Promise(resolve => {
        timeoutId = setTimeout(() => resolve(null), 8000);
      }),
    ]);

    if (!result) {
      console.warn("Duplicate check timed out; continuing post creation");
      req.imageEmbedding = [];
      req.textEmbedding = [];
      return next();
    }

    req.imageEmbedding = result.imageEmbedding || [];
    req.textEmbedding = result.textEmbedding || [];

    if (result?.isDuplicate) {
      return res.status(409).json({
        message: "Duplicate issue already reported nearby",
         duplicateImageUrl: result.post.media?.[0] || result.post.imageUrl,
        duplicatePostId: result.post._id,
        reason: result.reasons,
      });
    }

    next();
  } catch (err) {
    console.error("duplicateCheck error:", err);
    next(); // never block post creation on AI failure
  } finally {
    clearTimeout(timeoutId);
  }
};

export default duplicateCheck;
