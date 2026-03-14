import { X, Download, Eye } from "lucide-react";
import type { QueuedImage } from "@/types/image";
import { useImageStore } from "@/stores/image-store";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { formatBytes, formatDimensions, formatSizeChange } from "@/utils/format";
import { FORMAT_LABELS } from "@/constants/formats";

interface FileCardProps {
  image: QueuedImage;
}

const statusDotColors: Record<string, string> = {
  pending: "bg-status-pending",
  processing: "bg-status-processing animate-pulse",
  complete: "bg-status-complete",
  error: "bg-status-error",
};

export function FileCard({ image }: FileCardProps) {
  const removeFile = useImageStore((s) => s.removeFile);
  const downloadSingle = useImageStore((s) => s.downloadSingle);
  const selectImage = useImageStore((s) => s.selectImage);
  const selectedImageId = useImageStore((s) => s.selectedImageId);

  const isSelected = selectedImageId === image.id;

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border bg-surface-1 transition-colors ${
        isSelected ? "border-accent" : "border-border hover:border-border-hover"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-32 bg-surface-2">
        {image.thumbnailUrl ? (
          <img
            src={image.thumbnailUrl}
            alt={image.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            No preview
          </div>
        )}

        {/* Status dot */}
        <div
          className={`absolute top-2 left-2 h-2 w-2 rounded-full ${statusDotColors[image.status]}`}
        />

        {/* Actions overlay */}
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {image.result && (
            <>
              <button
                onClick={() => selectImage(isSelected ? null : image.id)}
                className="rounded bg-surface-0/80 p-1 text-text-secondary hover:text-accent"
                title="Compare"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => downloadSingle(image.id)}
                className="rounded bg-surface-0/80 p-1 text-text-secondary hover:text-accent"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => removeFile(image.id)}
            className="rounded bg-surface-0/80 p-1 text-text-secondary hover:text-status-error"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1 p-2">
        <p className="truncate text-xs font-medium text-text-primary" title={image.name}>
          {image.name}
        </p>

        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span>
            {image.originalFormat !== "unknown"
              ? FORMAT_LABELS[image.originalFormat]
              : "Unknown"}
          </span>
          <span>{formatBytes(image.originalSize)}</span>
          {image.originalDimensions && (
            <span>
              {formatDimensions(image.originalDimensions.width, image.originalDimensions.height)}
            </span>
          )}
        </div>

        {/* Progress */}
        {image.status === "processing" && <ProgressBar value={image.progress} />}

        {/* Result info */}
        {image.result && (
          <div className="text-[10px] text-status-complete">
            {formatBytes(image.result.size)} —{" "}
            {formatSizeChange(image.originalSize, image.result.size)}
            {image.result.dimensions && (
              <span className="ml-1">
                → {formatDimensions(image.result.dimensions.width, image.result.dimensions.height)}
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {image.error && (
          <p className="truncate text-[10px] text-status-error" title={image.error}>
            {image.error}
          </p>
        )}
      </div>
    </div>
  );
}
