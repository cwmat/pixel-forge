export type ImageFormat = "png" | "jpg" | "webp" | "avif" | "bmp" | "tiff";

export type ProcessingStatus = "pending" | "processing" | "complete" | "error";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeOptions {
  enabled: boolean;
  width: number;
  height: number;
  lockAspectRatio: boolean;
}

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  fontSize: number;
  opacity: number;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
}

export interface ConversionSettings {
  outputFormat: ImageFormat;
  quality: number;
  resize: ResizeOptions;
  watermark: WatermarkOptions;
  stripExif: boolean;
}

export interface QueuedImage {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalFormat: ImageFormat | "unknown";
  originalDimensions: ImageDimensions | null;
  thumbnailUrl: string | null;
  status: ProcessingStatus;
  progress: number;
  result: ProcessedImage | null;
  error: string | null;
}

export interface ProcessedImage {
  blob: Blob;
  format: ImageFormat;
  size: number;
  dimensions: ImageDimensions;
  objectUrl: string;
}
