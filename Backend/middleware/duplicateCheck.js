import { checkDuplicate } from "../utils/duplicateCheckAI.js";

const duplicateCheck = async (req, res, next) => {
  try {
    const { description, location } = req.body;

    // 1. Parse location safely
    let parsedLocation = location;
    if (typeof location === "string") {
      parsedLocation = JSON.parse(location);
    }

    const coords =
      parsedLocation?.coordinates?.length === 2
        ? parsedLocation.coordinates
        : null;

    // 2. Get image buffer from multer (if exists)
    let imageBuffer = null;
    if (req.file?.buffer) {
      imageBuffer = req.file.buffer;
    }

    // 3. Run duplicate check
    const result = await checkDuplicate({
      description,
      imageBuffer,
      locationCoords: coords,
    });

    if (result?.isDuplicate) {
      return res.status(409).json({
        message: "Duplicate issue already reported nearby",
        duplicatePostId: result.post._id,
        reason: result.reasons,
      });
    }

    next();
  } catch (err) {
    console.error("duplicateCheck error:", err);
    next(); // never block post creation on AI failure
  }
};

export default duplicateCheck;
