import multer from "multer";

// Memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});
