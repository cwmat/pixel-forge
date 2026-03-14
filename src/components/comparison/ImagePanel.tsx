import type { ImageDimensions } from "@/types/image";
import { formatBytes, formatDimensions } from "@/utils/format";

interface ImagePanelProps {
  label: string;
  src: string | null;
  size: number;
  dimensions: ImageDimensions | null;
  formatLabel: string;
}

export function ImagePanel({ label, src, size, dimensions, formatLabel }: ImagePanelProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface-2">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium text-text-primary">{label}</span>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span className="rounded bg-surface-3 px-1.5 py-0.5">{formatLabel}</span>
          <span>{formatBytes(size)}</span>
          {dimensions && <span>{formatDimensions(dimensions.width, dimensions.height)}</span>}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto bg-[repeating-conic-gradient(#1a1a28_0%_25%,#12121a_0%_50%)] bg-[length:20px_20px] p-2">
        {src ? (
          <img
            src={src}
            alt={label}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-xs text-text-muted">Loading preview…</span>
        )}
      </div>
    </div>
  );
}
