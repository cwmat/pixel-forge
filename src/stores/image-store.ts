import { create } from "zustand";
import type {
  QueuedImage,
  ConversionSettings,
  ImageFormat,
  ProcessedImage,
} from "@/types/image";
import type { ImageWorkerOutbound } from "@/types/worker-messages";
import { DEFAULT_QUALITY, MAX_BATCH_COUNT, MAX_FILE_SIZE, THUMBNAIL_MAX_DIM } from "@/constants/limits";
import { FORMAT_EXTENSIONS } from "@/constants/formats";
import { detectFormatFromFile, generateId, replaceExtension } from "@/utils/format";

// ── Default settings ────────────────────────────────────────────────────

const DEFAULT_SETTINGS: ConversionSettings = {
  outputFormat: "webp",
  quality: DEFAULT_QUALITY,
  resize: {
    enabled: false,
    width: 1920,
    height: 1080,
    lockAspectRatio: true,
  },
  watermark: {
    enabled: false,
    text: "",
    fontSize: 24,
    opacity: 0.5,
    position: "bottom-right",
  },
  stripExif: false,
};

// ── Worker singleton ────────────────────────────────────────────────────

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("@/workers/image-processor.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

// ── Thumbnail generation ────────────────────────────────────────────────

async function generateThumbnail(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(THUMBNAIL_MAX_DIM / bitmap.width, THUMBNAIL_MAX_DIM / bitmap.height, 1);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

// ── EXIF stripping ──────────────────────────────────────────────────────

async function stripExifFromJpeg(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const piexif = await import("piexifjs");
  // piexifjs operates on binary strings
  const bytes = new Uint8Array(buffer);
  let binaryStr = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryStr += String.fromCharCode(bytes[i]!);
  }
  const stripped = piexif.remove(binaryStr);
  const out = new Uint8Array(stripped.length);
  for (let i = 0; i < stripped.length; i++) {
    out[i] = stripped.charCodeAt(i);
  }
  return out.buffer;
}

// ── Reset completed items when settings change ─────────────────────────

function resetCompletedItems(s: { queue: QueuedImage[]; batchStatus: string }) {
  const hasCompleted = s.queue.some((q) => q.status === "complete");
  if (!hasCompleted) return {};
  return {
    queue: s.queue.map((q) => {
      if (q.status !== "complete") return q;
      if (q.result?.objectUrl) URL.revokeObjectURL(q.result.objectUrl);
      return { ...q, status: "pending" as const, progress: 0, result: null, error: null };
    }),
    batchStatus: "idle" as const,
  };
}

// ── Store ───────────────────────────────────────────────────────────────

interface ImageStore {
  queue: QueuedImage[];
  settings: ConversionSettings;
  batchStatus: "idle" | "processing" | "complete";
  selectedImageId: string | null;

  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearAll: () => void;
  selectImage: (id: string | null) => void;

  updateSettings: (partial: Partial<ConversionSettings>) => void;
  updateResize: (partial: Partial<ConversionSettings["resize"]>) => void;
  updateWatermark: (partial: Partial<ConversionSettings["watermark"]>) => void;

  processAll: () => void;
  downloadSingle: (id: string) => void;
  downloadAllZip: () => Promise<void>;
}

export const useImageStore = create<ImageStore>()((set, get) => ({
  queue: [],
  settings: DEFAULT_SETTINGS,
  batchStatus: "idle",
  selectedImageId: null,

  addFiles: async (files) => {
    const fileArray = Array.from(files);
    const { queue } = get();
    const remaining = MAX_BATCH_COUNT - queue.length;
    const toAdd = fileArray.slice(0, remaining);

    const newItems: QueuedImage[] = [];
    for (const file of toAdd) {
      if (file.size > MAX_FILE_SIZE) continue;

      const id = generateId();
      const format = detectFormatFromFile(file);
      const thumbnailUrl = await generateThumbnail(file);

      // Get dimensions from thumbnail generation
      let originalDimensions = null;
      try {
        const bitmap = await createImageBitmap(file);
        originalDimensions = { width: bitmap.width, height: bitmap.height };
        bitmap.close();
      } catch {
        // Format not supported by createImageBitmap (e.g. TIFF)
      }

      newItems.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalFormat: format,
        originalDimensions,
        thumbnailUrl,
        status: "pending",
        progress: 0,
        result: null,
        error: null,
      });
    }

    set((s) => ({ queue: [...s.queue, ...newItems], batchStatus: "idle" }));
  },

  removeFile: (id) => {
    const { queue, selectedImageId } = get();
    const item = queue.find((q) => q.id === id);
    if (item?.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
    if (item?.result?.objectUrl) URL.revokeObjectURL(item.result.objectUrl);
    set({
      queue: queue.filter((q) => q.id !== id),
      selectedImageId: selectedImageId === id ? null : selectedImageId,
    });
  },

  clearAll: () => {
    const { queue } = get();
    for (const item of queue) {
      if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
      if (item.result?.objectUrl) URL.revokeObjectURL(item.result.objectUrl);
    }
    set({ queue: [], batchStatus: "idle", selectedImageId: null });
  },

  selectImage: (id) => set({ selectedImageId: id }),

  updateSettings: (partial) =>
    set((s) => ({
      settings: { ...s.settings, ...partial },
      ...resetCompletedItems(s),
    })),

  updateResize: (partial) =>
    set((s) => ({
      settings: { ...s.settings, resize: { ...s.settings.resize, ...partial } },
      ...resetCompletedItems(s),
    })),

  updateWatermark: (partial) =>
    set((s) => ({
      settings: { ...s.settings, watermark: { ...s.settings.watermark, ...partial } },
      ...resetCompletedItems(s),
    })),

  processAll: () => {
    const { queue, settings } = get();
    const pending = queue.filter((q) => q.status === "pending" || q.status === "error");
    if (pending.length === 0) return;

    set({ batchStatus: "processing" });

    const w = getWorker();

    // Set up message handler
    w.onmessage = (e: MessageEvent<ImageWorkerOutbound>) => {
      const msg = e.data;
      switch (msg.type) {
        case "PROCESS_PROGRESS":
          set((s) => ({
            queue: s.queue.map((q) =>
              q.id === msg.payload.id
                ? { ...q, status: "processing" as const, progress: msg.payload.progress }
                : q,
            ),
          }));
          break;
        case "PROCESS_COMPLETE": {
          const blob = new Blob([msg.payload.buffer], { type: msg.payload.mimeType });
          const objectUrl = URL.createObjectURL(blob);
          const result: ProcessedImage = {
            blob,
            format: get().settings.outputFormat,
            size: blob.size,
            dimensions: msg.payload.dimensions,
            objectUrl,
          };
          set((s) => {
            const updated = s.queue.map((q) =>
              q.id === msg.payload.id
                ? { ...q, status: "complete" as const, progress: 100, result, error: null }
                : q,
            );
            const allDone = updated.every(
              (q) => q.status === "complete" || q.status === "error",
            );
            return {
              queue: updated,
              batchStatus: allDone ? "complete" : s.batchStatus,
            };
          });
          break;
        }
        case "PROCESS_ERROR":
          set((s) => {
            const updated = s.queue.map((q) =>
              q.id === msg.payload.id
                ? { ...q, status: "error" as const, progress: 0, error: msg.payload.message }
                : q,
            );
            const allDone = updated.every(
              (q) => q.status === "complete" || q.status === "error",
            );
            return {
              queue: updated,
              batchStatus: allDone ? "complete" : s.batchStatus,
            };
          });
          break;
      }
    };

    // Send images to worker sequentially
    (async () => {
      for (const item of pending) {
        set((s) => ({
          queue: s.queue.map((q) =>
            q.id === item.id ? { ...q, status: "processing" as const, progress: 0 } : q,
          ),
        }));

        let buffer = await item.file.arrayBuffer();

        // Strip EXIF on main thread before sending to worker
        if (settings.stripExif && (item.originalFormat === "jpg" || item.originalFormat === "unknown")) {
          try {
            buffer = await stripExifFromJpeg(buffer);
          } catch {
            // Not a valid JPEG for EXIF stripping, continue anyway
          }
        }

        w.postMessage(
          {
            type: "PROCESS_IMAGE",
            payload: {
              id: item.id,
              imageBuffer: buffer,
              sourceFormat: item.originalFormat === "unknown" ? "png" : item.originalFormat,
              settings,
            },
          },
          [buffer],
        );

        // Wait for this image to complete before sending next
        await new Promise<void>((resolve) => {
          const check = () => {
            const current = get().queue.find((q) => q.id === item.id);
            if (current?.status === "complete" || current?.status === "error") {
              resolve();
            } else {
              setTimeout(check, 50);
            }
          };
          check();
        });
      }
    })();
  },

  downloadSingle: (id) => {
    const item = get().queue.find((q) => q.id === id);
    if (!item?.result) return;

    const a = document.createElement("a");
    a.href = item.result.objectUrl;
    a.download = replaceExtension(item.name, item.result.format);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  downloadAllZip: async () => {
    const { queue, settings } = get();
    const completed = queue.filter((q) => q.result);
    if (completed.length === 0) return;

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const item of completed) {
      if (item.result) {
        const ext = FORMAT_EXTENSIONS[settings.outputFormat];
        const name = item.name.replace(/\.[^.]+$/, ext ?? `.${settings.outputFormat}`);
        zip.file(name, item.result.blob);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixel-forge-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
