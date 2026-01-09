import { createWorker } from "tesseract.js";
import sharp from "sharp";

let workerPromise = null;

async function getWorker() {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    const worker = await createWorker("eng");
    return worker;
  })();
  return workerPromise;
}

export async function extractTextFromImage(buffer) {
  let normalized;
  try {
    normalized = await sharp(buffer)
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    const err = new Error("Invalid or unsupported image file");
    err.status = 400;
    throw err;
  }

  const worker = await getWorker();
  const result = await worker.recognize(normalized);
  const text = String(result?.data?.text ?? "").trim();
  const confRaw = Number(result?.data?.confidence ?? 0);
  const confidence = Math.max(0, Math.min(1, confRaw / 100));
  return {
    raw_text: text,
    confidence: Number.isFinite(confidence) ? confidence : 0
  };
}
