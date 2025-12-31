// utils/duplicateCheckAI.js
import { HfInference } from "@huggingface/inference";
import Post from "../models/Post.js";
import { cosineSimilarity, textSimilarity } from "./textUtils.js";
import { getImageEmbedding } from "./imageEmbedding.js";

const hf = new HfInference(process.env.HF_API_KEY);

// Model to use (fast & small; good for semantic similarity)
const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

/**
 * Get text embedding using HuggingFace Inference API.
 * Returns an array of numbers or [] on failure.
 */
export const getTextEmbedding = async (text) => {
  try {
    if (!text) return [];
    const resp = await hf.featureExtraction({
      model: HF_MODEL,
      inputs: text,
    });

    // resp is typically an array of vectors; take the first
    const vec = Array.isArray(resp) && resp.length ? resp[0] : resp;
    return Array.from(vec);
  } catch (err) {
    console.error("getTextEmbedding error:", err?.message ?? err);
    return [];
  }
};

/**
 * Checks for duplicate posts near the given coords.
 * Returns: { isDuplicate: boolean, post: post|null, reasons: [] }
 *
 * Options:
 *  description: string
 *  imageBuffer: Buffer|null
 *  locationCoords: [lng, lat]
 *  radius: meters
 *  imageSimThreshold: 0.80
 *  textSimThreshold: 0.70
 */
export const checkDuplicate = async ({
  description = "",
  imageBuffer = null,
  locationCoords = [0, 0],
  radius = 200,
  imageSimThreshold = 0.85,
  textSimThreshold = 0.80,
}) => {
  try {
    // compute embeddings (text + image if available)
    const textEmb = await getTextEmbedding(description || "");
    let imageEmb = [];
    if (imageBuffer) {
      try {
        imageEmb = await getImageEmbedding(imageBuffer);
      } catch (err) {
        console.warn("Image embedding failed:", err?.message ?? err);
        imageEmb = [];
      }
    }

    // Candidate selection: posts near the location
    const candidates = await Post.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: locationCoords },
          $maxDistance: radius,
        },
      },
    }).limit(100);

    for (const p of candidates) {
      // Prefer image-based comparison when both available
      if (imageEmb.length && p.imageEmbedding && p.imageEmbedding.length) {
        const sim = cosineSimilarity(imageEmb, p.imageEmbedding);
        if (sim >= imageSimThreshold) {
          return {
            isDuplicate: true,
            post: p,
            reasons: [{ type: "image", score: sim }],
          };
        }
      }

      // Next: vector text embedding comparison (if stored)
      if (textEmb.length && p.textEmbedding && p.textEmbedding.length) {
        const sim = cosineSimilarity(textEmb, p.textEmbedding);
        if (sim >= textSimThreshold) {
          return {
            isDuplicate: true,
            post: p,
            reasons: [{ type: "text", score: sim }],
          };
        }
      }

      // Last resort: simple string similarity on descriptions
      if (description && p.description) {
        const simple = textSimilarity(description, p.description);
        if (simple >= 0.75) {
          return {
            isDuplicate: true,
            post: p,
            reasons: [{ type: "text_simple", score: simple }],
          };
        }
      }
    }

    return { isDuplicate: false, post: null, reasons: [] };
  } catch (err) {
    console.error("checkDuplicate error:", err?.message ?? err);
    // On failure, prefer to allow the post (do not block), but log the error
    return { isDuplicate: false, post: null, reasons: [] };
  }
};
