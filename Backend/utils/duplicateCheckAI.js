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
 * Checks for duplicate posts using text and image similarity.
 * Returns: { isDuplicate: boolean, post: post|null, reasons: [] }
 */
export const checkDuplicate = async ({
  description = "",
  imageBuffer = null,
  imageSimThreshold = 0.75,
  textSimThreshold = 0.85,
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

    const candidates = await Post.find({}).limit(100);

    for (const p of candidates) {
      const hasImageMatchData = imageEmb.length && p.imageEmbedding && p.imageEmbedding.length;
      const hasTextMatchData = textEmb.length && p.textEmbedding && p.textEmbedding.length;

      if (!hasImageMatchData || !hasTextMatchData) {
        continue;
      }

      const imageSim = cosineSimilarity(imageEmb, p.imageEmbedding);
      const textSim = cosineSimilarity(textEmb, p.textEmbedding);

      // Only treat as duplicate when BOTH image and text similarity are high.
      if (imageSim >= imageSimThreshold && textSim >= textSimThreshold) {
        return {
          isDuplicate: true,
          post: p,
          reasons: [
            { type: "image", score: imageSim },
            { type: "text", score: textSim },
          ],
          imageEmbedding: imageEmb,
          textEmbedding: textEmb,
        };
      }

      if (description && p.description) {
        const simple = textSimilarity(description, p.description);
        if (simple >= 0.95 && imageSim >= imageSimThreshold) {
          return {
            isDuplicate: true,
            post: p,
            reasons: [
              { type: "text_simple", score: simple },
              { type: "image", score: imageSim },
            ],
            imageEmbedding: imageEmb,
            textEmbedding: textEmb,
          };
        }
      }
    }

    return {
      isDuplicate: false,
      post: null,
      reasons: [],
      imageEmbedding: imageEmb,
      textEmbedding: textEmb,
    };
  } catch (err) {
    console.error("checkDuplicate error:", err?.message ?? err);
    // On failure, prefer to allow the post (do not block), but log the error
    return {
      isDuplicate: false,
      post: null,
      reasons: [],
      imageEmbedding: [],
      textEmbedding: [],
    };
  }
};
