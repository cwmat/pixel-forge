import type { ImageFormat } from "@/types/image";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]!}`;
}

export function formatDimensions(w: number, h: number): string {
  return `${w} × ${h}`;
}

export function formatSizeChange(original: number, converted: number): string {
  const diff = converted - original;
  const pct = ((diff / original) * 100).toFixed(1);
  if (diff < 0) return `${formatBytes(Math.abs(diff))} smaller (${Math.abs(Number(pct))}%)`;
  if (diff > 0) return `${formatBytes(diff)} larger (+${pct}%)`;
  return "Same size";
}

const EXTENSION_MAP: Record<string, ImageFormat> = {
  png: "png",
  jpg: "jpg",
  jpeg: "jpg",
  webp: "webp",
  avif: "avif",
  bmp: "bmp",
  tif: "tiff",
  tiff: "tiff",
};

export function detectFormatFromFile(file: File): ImageFormat | "unknown" {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MAP[ext] ?? "unknown";
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function replaceExtension(filename: string, format: ImageFormat): string {
  const ext = format === "jpg" ? ".jpg" : `.${format}`;
  return filename.replace(/\.[^.]+$/, ext);
}
