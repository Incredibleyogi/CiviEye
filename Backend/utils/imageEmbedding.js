import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model;
let sharp;

async function getSharp() {
  if (!sharp) {
    try {
      sharp = (await import('sharp')).default;
    } catch (error) {
      console.error('⚠️ Sharp unavailable, image embedding will be disabled:', error.message);
      sharp = null;
    }
  }
  return sharp;
}

async function loadModel() {
  if (!model) {
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log("✅ MobileNet loaded (tfjs)");
  }
  return model;
}

/**
 * @param {Buffer} imageBuffer - req.file.buffer
 */
export const getImageEmbedding = async (imageBuffer) => {
  try {
    const sharpLib = await getSharp();
    if (!sharpLib) {
      return [];
    }

    // Decode image using sharp
    const { data, info } = await sharpLib(imageBuffer)
      .resize(224, 224)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create tensor from raw pixels
    const imageTensor = tf.tensor3d(
      new Uint8Array(data),
      [info.height, info.width, info.channels]
    );

    const input = imageTensor
      .expandDims(0)
      .toFloat()
      .div(255);

    const net = await loadModel();
    const embedding = net.infer(input, true);

    const vector = Array.from(await embedding.data());

    tf.dispose([imageTensor, input, embedding]);

    return vector;
  } catch (error) {
  console.error("❌ Image embedding failed:", error.message);
  return []; // fail gracefully
}
};
