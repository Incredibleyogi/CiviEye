import { checkDuplicate } from "../utils/duplicateCheckAI.js";

// Expects req.body.imageBase64 and req.body.location.coordinates and req.body.description
const duplicateCheck = async (req, res, next) => {
  try {
    const { imageBase64, location, description } = req.body;
    let imageBuffer = null;

    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    }

    const coords = location?.coordinates || [0, 0];

    const result = await checkDuplicate({
      description,
      imageBuffer,
      locationCoords: coords,
    });

    if (result.isDuplicate) {
      return res.status(409).json({
        message: "Duplicate issue already reported nearby",
        duplicatePostId: result.post._id,
        reason: result.reasons,
      });
    }

    next();
  } catch (err) {
    console.error("duplicateCheck err:", err);
    next(); // on error, allow to continue (safer than blocking)
  }
};

export default duplicateCheck;
