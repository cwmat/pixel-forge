import type { ImageWorkerInbound, ImageWorkerOutbound } from "@/types/worker-messages";
import type { ConversionSettings, ImageDimensions } from "@/types/image";

function post(msg: ImageWorkerOutbound) {
  self.postMessage(msg);
}

// Lazy-loaded codec modules
let pngCodec: typeof import("@jsquash/png") | null = null;
let jpegCodec: typeof import("@jsquash/jpeg") | null = null;
let webpCodec: typeof import("@jsquash/webp") | null = null;
let avifCodec: typeof import("@jsquash/avif") | null = null;

async function loadCodec(format: string) {
  switch (format) {
    case "png":
      if (!pngCodec) pngCodec = await import("@jsquash/png");
      return pngCodec;
    case "jpg":
    case "jpeg":
      if (!jpegCodec) jpegCodec = await import("@jsquash/jpeg");
      return jpegCodec;
    case "webp":
      if (!webpCodec) webpCodec = await import("@jsquash/webp");
      return webpCodec;
    case "avif":
      if (!avifCodec) avifCodec = await import("@jsquash/avif");
      return avifCodec;
    default:
      throw new Error(`Unsupported jSquash codec: ${format}`);
  }
}

// ── DECODE ──────────────────────────────────────────────────────────────

async function decodeImage(buffer: ArrayBuffer, format: string): Promise<ImageData> {
  if (format === "bmp") {
    const blob = new Blob([buffer], { type: "image/bmp" });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  if (format === "tiff" || format === "tif") {
    const UTIF = await import("utif");
    const ifds = UTIF.decode(buffer);
    const ifd = ifds[0]!;
    UTIF.decodeImage(buffer, ifd);
    const rgba = UTIF.toRGBA8(ifd);
    return new ImageData(new Uint8ClampedArray(rgba.buffer), ifd.width, ifd.height);
  }

  const codec = await loadCodec(format);
  return codec.decode(buffer);
}

// ── RESIZE ──────────────────────────────────────────────────────────────

function calculateResizeDimensions(
  original: ImageDimensions,
  resize: ConversionSettings["resize"],
): ImageDimensions {
  if (!resize.enabled) return original;

  if (resize.lockAspectRatio) {
    const ratio = Math.min(resize.width / original.width, resize.height / original.height);
    return {
      width: Math.round(original.width * ratio),
      height: Math.round(original.height * ratio),
    };
  }

  return { width: resize.width, height: resize.height };
}

function resizeImageData(imageData: ImageData, targetW: number, targetH: number): ImageData {
  const srcCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const srcCtx = srcCanvas.getContext("2d")!;
  srcCtx.putImageData(imageData, 0, 0);

  const dstCanvas = new OffscreenCanvas(targetW, targetH);
  const dstCtx = dstCanvas.getContext("2d")!;
  dstCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);
  return dstCtx.getImageData(0, 0, targetW, targetH);
}

// ── WATERMARK ───────────────────────────────────────────────────────────

function applyWatermark(imageData: ImageData, settings: ConversionSettings): ImageData {
  if (!settings.watermark.enabled || !settings.watermark.text) return imageData;

  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(imageData, 0, 0);

  const { text, fontSize, opacity, position } = settings.watermark;
  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  const metrics = ctx.measureText(text);
  const padding = 20;
  let x: number;
  let y: number;

  switch (position) {
    case "top-left":
      x = padding;
      y = fontSize + padding;
      break;
    case "top-right":
      x = imageData.width - metrics.width - padding;
      y = fontSize + padding;
      break;
    case "bottom-left":
      x = padding;
      y = imageData.height - padding;
      break;
    case "bottom-right":
      x = imageData.width - metrics.width - padding;
      y = imageData.height - padding;
      break;
    case "center":
      x = (imageData.width - metrics.width) / 2;
      y = imageData.height / 2;
      break;
  }

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// ── ENCODE ──────────────────────────────────────────────────────────────

async function encodeImage(
  imageData: ImageData,
  settings: ConversionSettings,
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  const { outputFormat, quality } = settings;

  if (outputFormat === "bmp") {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
    // Try native BMP encoding, fall back to PNG-in-BMP-name if unsupported
    let blob: Blob;
    try {
      blob = await canvas.convertToBlob({ type: "image/bmp" });
      if (blob.type !== "image/bmp") throw new Error("BMP not supported");
    } catch {
      // Fallback: encode as raw BMP manually
      blob = encodeBmpFallback(imageData);
    }
    return { buffer: await blob.arrayBuffer(), mimeType: "image/bmp" };
  }

  if (outputFormat === "tiff") {
    const UTIF = await import("utif");
    const buffer = UTIF.encodeImage(imageData.data, imageData.width, imageData.height);
    return { buffer, mimeType: "image/tiff" };
  }

  const codec = await loadCodec(outputFormat);
  const qualityFormats = ["jpg", "webp", "avif"];
  const buffer = qualityFormats.includes(outputFormat)
    ? await codec.encode(imageData, { quality })
    : await codec.encode(imageData);

  const mimeType =
    outputFormat === "jpg" ? "image/jpeg" : `image/${outputFormat}`;
  return { buffer, mimeType };
}

/** Fallback BMP encoder for browsers that don't support canvas BMP export */
function encodeBmpFallback(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows padded to 4 bytes
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);

  // BMP Header
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // pixel data offset

  // DIB Header (BITMAPINFOHEADER)
  view.setUint32(14, 40, true); // header size
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true); // top-down
  view.setUint16(26, 1, true); // color planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, pixelDataSize, true);

  // Pixel data (BGR, no alpha)
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset++, data[i + 2]!); // B
      view.setUint8(offset++, data[i + 1]!); // G
      view.setUint8(offset++, data[i]!); // R
    }
    // Row padding
    while (offset % 4 !== 54 % 4 && (offset - 54) % rowSize !== 0) {
      view.setUint8(offset++, 0);
    }
    offset = 54 + (y + 1) * rowSize;
  }

  return new Blob([buf], { type: "image/bmp" });
}

// ── MAIN PIPELINE ───────────────────────────────────────────────────────

async function processImage(
  id: string,
  imageBuffer: ArrayBuffer,
  sourceFormat: string,
  settings: ConversionSettings,
) {
  try {
    post({ type: "PROCESS_PROGRESS", payload: { id, progress: 10, stage: "Decoding" } });

    let imageData = await decodeImage(imageBuffer, sourceFormat);
    const originalDims = { width: imageData.width, height: imageData.height };

    post({ type: "PROCESS_PROGRESS", payload: { id, progress: 30, stage: "Resizing" } });

    // Resize
    if (settings.resize.enabled) {
      const dims = calculateResizeDimensions(originalDims, settings.resize);
      if (dims.width !== originalDims.width || dims.height !== originalDims.height) {
        imageData = resizeImageData(imageData, dims.width, dims.height);
      }
    }

    post({ type: "PROCESS_PROGRESS", payload: { id, progress: 50, stage: "Watermarking" } });

    // Watermark
    imageData = applyWatermark(imageData, settings);

    post({ type: "PROCESS_PROGRESS", payload: { id, progress: 70, stage: "Encoding" } });

    // Encode
    const { buffer, mimeType } = await encodeImage(imageData, settings);

    post({
      type: "PROCESS_COMPLETE",
      payload: {
        id,
        buffer,
        mimeType,
        dimensions: { width: imageData.width, height: imageData.height },
      },
    });
  } catch (err) {
    post({
      type: "PROCESS_ERROR",
      payload: { id, message: (err as Error).message },
    });
  }
}

// ── MESSAGE HANDLER ─────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<ImageWorkerInbound>) => {
  const msg = e.data;
  switch (msg.type) {
    case "PROCESS_IMAGE":
      await processImage(
        msg.payload.id,
        msg.payload.imageBuffer,
        msg.payload.sourceFormat,
        msg.payload.settings,
      );
      break;
    case "CANCEL":
      // No long-running loops to cancel; reserved for future use
      break;
  }
};
