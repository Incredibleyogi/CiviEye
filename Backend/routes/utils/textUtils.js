import stringSimilarity from "string-similarity";

/**
 * Compare two strings using string-similarity
 * returns a value between 0 and 1
 */
export const textSimilarity = (a = "", b = "") => {
  return stringSimilarity.compareTwoStrings(a.toLowerCase(), b.toLowerCase());
};

/**
 * Cosine similarity for vectors
 */

// utils/textUtils.js
export const cosineSimilarity = (a, b) => {
  if (!a.length || !b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
};
