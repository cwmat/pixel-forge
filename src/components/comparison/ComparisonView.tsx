import { X, ArrowRightLeft } from "lucide-react";
import { useImageStore } from "@/stores/image-store";
import { ImagePanel } from "./ImagePanel";
import { formatSizeChange } from "@/utils/format";
import { FORMAT_LABELS } from "@/constants/formats";

export function ComparisonView() {
  const selectedImageId = useImageStore((s) => s.selectedImageId);
  const queue = useImageStore((s) => s.queue);
  const selectImage = useImageStore((s) => s.selectImage);

  const item = queue.find((q) => q.id === selectedImageId);
  if (!item?.result || !item.thumbnailUrl) return null;

  // Use the original file as a blob URL for comparison
  const originalUrl = URL.createObjectURL(item.file);
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
          onClick={() => {
            URL.revokeObjectURL(originalUrl);
            selectImage(null);
          }}
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
          src={item.result.objectUrl}
          size={item.result.size}
          dimensions={item.result.dimensions}
          formatLabel={FORMAT_LABELS[item.result.format]}
        />
      </div>
    </div>
  );
}
