import { X, ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useImageStore } from "@/stores/image-store";
import { ImagePanel } from "./ImagePanel";
import { formatSizeChange } from "@/utils/format";
import { FORMAT_LABELS } from "@/constants/formats";

export function ComparisonView() {
  const selectedImageId = useImageStore((s) => s.selectedImageId);
  const queue = useImageStore((s) => s.queue);
  const selectImage = useImageStore((s) => s.selectImage);

  const item = queue.find((q) => q.id === selectedImageId);
  const resultBlob = item?.result?.blob ?? null;
  const originalFile = item?.file ?? null;

  // Manage the original file's blob URL with proper cleanup to avoid leaks.
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!originalFile) return;
    const url = URL.createObjectURL(originalFile);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  // Convert the result blob to a JPEG data URL via canvas.
  // This approach:
  //  1. Bypasses coi-serviceworker (data: URLs don't trigger fetch events)
  //  2. Works for all formats createImageBitmap supports (PNG/JPEG/WebP/AVIF/BMP)
  //  3. Falls back to the raw objectUrl for formats browsers can't decode
  //     (e.g. TIFF — at least renders on Safari which natively supports it)
  const [convertedSrc, setConvertedSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!resultBlob) return;
    let cancelled = false;
    createImageBitmap(resultBlob)
      .then((bitmap) => {
        if (cancelled) { bitmap.close(); return; }
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
        bitmap.close();
        if (!cancelled) setConvertedSrc(canvas.toDataURL("image/jpeg", 0.92));
      })
      .catch(() => {
        // createImageBitmap doesn't support TIFF in most browsers;
        // fall back to the stored objectUrl (works on Safari).
        if (!cancelled) setConvertedSrc(item?.result?.objectUrl ?? null);
      });
    return () => { cancelled = true; };
  }, [resultBlob, item?.result?.objectUrl]);

  if (!item?.result || !item.thumbnailUrl) return null;

  const originalFormatLabel =
    item.originalFormat !== "unknown" ? FORMAT_LABELS[item.originalFormat] : "Original";

  return (
    <div className="flex flex-col border-t border-border bg-surface-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-text-primary">Comparison</span>
          <span className="text-xs text-text-muted">
            {formatSizeChange(item.originalSize, item.result.size)}
          </span>
        </div>
        <button
          onClick={() => selectImage(null)}
          className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Side-by-side panels */}
      <div className="flex h-72 gap-2 p-2">
        <ImagePanel
          label="Original"
          src={originalUrl}
          size={item.originalSize}
          dimensions={item.originalDimensions}
          formatLabel={originalFormatLabel}
        />
        <ImagePanel
          label="Converted"
          src={convertedSrc}
          size={item.result.size}
          dimensions={item.result.dimensions}
          formatLabel={FORMAT_LABELS[item.result.format]}
        />
      </div>
    </div>
  );
}
