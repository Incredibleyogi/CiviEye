// utils/imageEmbedding.js
import sharp from "sharp";

let tf = null;
let usingNodeBindings = false;

async function ensureTf() {
  if (tf) return;
  try {
    const mod = await import("@tensorflow/tfjs-node");
    tf = mod;
    usingNodeBindings = true;
    console.log("Using @tensorflow/tfjs-node (native bindings)");
  } catch (err) {
    console.warn(
      "@tensorflow/tfjs-node not available, falling back to @tensorflow/tfjs",
      err.message || err
    );
    const mod = await import("@tensorflow/tfjs");
    tf = mod;
    usingNodeBindings = false;
  }
}

/**
 * Loads MobileNet once and caches the model.
 */
let mobilenetModel = null;
const loadModel = async () => {
  await ensureTf();
  if (mobilenetModel) return mobilenetModel;
  mobilenetModel = await tf.loadGraphModel(
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json"
  );
  return mobilenetModel;
};

/**
 * Convert image buffer to tensor resized to 224x224 and normalized,
 * then get embeddings from the model
 */
export const getImageEmbedding = async (imageBuffer) => {
  const model = await loadModel();

  // Use sharp to resize & convert to 224x224 RGB
  // For node-bindings path we still use sharp to ensure consistent sizing
  const resized = await sharp(imageBuffer)
    .resize(224, 224, { fit: "cover" })
    .ensureAlpha() // make sure channels predictable
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized; // data = raw pixel buffer, info = { width, height, channels }
  const { width, height, channels } = info;

  // Create tensor depending on environment
  let decodedTensor;
  await ensureTf();
  if (usingNodeBindings && tf.node && typeof tf.node.decodeImage === "function") {
    // If native bindings available, we can feed a PNG/JPEG buffer into decodeImage.
    // We already have raw pixel buffer, so create tensor directly:
    decodedTensor = tf.tensor3d(new Uint8Array(data), [height, width, channels], "int32");
  } else {
    // Fallback: build tensor from raw pixel data returned by sharp
    decodedTensor = tf.tensor3d(new Uint8Array(data), [height, width, channels], "int32");
  }

  // If there is an alpha channel, drop it to keep 3 channels (RGB)
  let rgbTensor = decodedTensor;
  if (channels === 4) {
    // take only first three channels
    rgbTensor = tf.slice(decodedTensor, [0, 0, 0], [height, width, 3]);
    decodedTensor.dispose();
  }

  const expanded = rgbTensor.expandDims(0).toFloat().div(127.5).sub(1); // normalize [-1,1]

  const embeddingsTensor = model.predict(expanded);
  const dataArr = await embeddingsTensor.data();
  tf.dispose([rgbTensor, expanded, embeddingsTensor]);

  // normalize vector
  const arr = Array.from(dataArr);
  const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0)) || 1;
  const normalized = arr.map((v) => v / norm);
  return normalized;
};