import { useState, useCallback } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { useImageStore } from "@/stores/image-store";
import { MAX_BATCH_COUNT, MAX_FILE_SIZE } from "@/constants/limits";
import { FORMAT_ACCEPT_STRING } from "@/constants/formats";
import { formatBytes } from "@/utils/format";

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addFiles = useImageStore((s) => s.addFiles);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);

      const files = e.dataTransfer.files;
      if (files.length > MAX_BATCH_COUNT) {
        setError(`Max ${MAX_BATCH_COUNT} files at once`);
        return;
      }
      for (let i = 0; i < files.length; i++) {
        if (files[i]!.size > MAX_FILE_SIZE) {
          setError(`${files[i]!.name} is too large (max ${formatBytes(MAX_FILE_SIZE)})`);
          return;
        }
      }
      addFiles(files);
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      if (e.target.files) {
        addFiles(e.target.files);
      }
      e.target.value = "";
    },
    [addFiles],
  );

  return (
    <div
      className="flex flex-1 items-center justify-center p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border-2 border-dashed p-12 transition-all ${
          isDragging
            ? "border-accent bg-accent/5 glow-accent"
            : "border-border hover:border-border-hover"
        }`}
      >
        <div className="rounded-xl bg-surface-2 p-4">
          <ImagePlus className="h-10 w-10 text-accent" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-medium text-text-primary">Drop images here</h2>
          <p className="mt-1 text-sm text-text-secondary">
            PNG, JPEG, WebP, AVIF, BMP, TIFF — up to {MAX_BATCH_COUNT} files
          </p>
        </div>

        {error && (
          <div className="w-full rounded-lg bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary">
          <Upload className="h-4 w-4" />
          Browse Files
          <input
            type="file"
            accept={FORMAT_ACCEPT_STRING}
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </div>
    </div>
  );
}
