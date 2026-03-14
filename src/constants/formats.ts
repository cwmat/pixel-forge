import type { ImageFormat } from "@/types/image";

export const SUPPORTED_FORMATS: ImageFormat[] = ["png", "jpg", "webp", "avif", "bmp", "tiff"];

export const FORMAT_MIME_TYPES: Record<ImageFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  tiff: "image/tiff",
};

export const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  png: ".png",
  jpg: ".jpg",
  webp: ".webp",
  avif: ".avif",
  bmp: ".bmp",
  tiff: ".tiff",
};

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  png: "PNG",
  jpg: "JPEG",
  webp: "WebP",
  avif: "AVIF",
  bmp: "BMP",
  tiff: "TIFF",
};

export const FORMAT_ACCEPT_STRING =
  "image/png,image/jpeg,image/webp,image/avif,image/bmp,image/tiff,.png,.jpg,.jpeg,.webp,.avif,.bmp,.tif,.tiff";

export const FORMAT_SUPPORTS_QUALITY: ImageFormat[] = ["jpg", "webp", "avif"];
