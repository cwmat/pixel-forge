import { Image, Trash2, Plus } from "lucide-react";
import { useImageStore } from "@/stores/image-store";
import { useRef } from "react";
import { FORMAT_ACCEPT_STRING } from "@/constants/formats";

export function Header() {
  const queue = useImageStore((s) => s.queue);
  const batchStatus = useImageStore((s) => s.batchStatus);
  const clearAll = useImageStore((s) => s.clearAll);
  const addFiles = useImageStore((s) => s.addFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completed = queue.filter((q) => q.status === "complete").length;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface-1 px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-accent" />
          <h1 className="text-sm font-semibold tracking-tight text-text-primary">PixelForge</h1>
        </div>

        {queue.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="rounded bg-surface-2 px-2 py-0.5">
              {queue.length} file{queue.length !== 1 ? "s" : ""}
            </span>
            {batchStatus === "processing" && (
              <span className="text-status-processing">Processing...</span>
            )}
            {batchStatus === "complete" && (
              <span className="text-status-complete">
                {completed}/{queue.length} done
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {queue.length > 0 && (
          <>
            <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary">
              <Plus className="h-3.5 w-3.5" />
              Add Files
              <input
                ref={fileInputRef}
                type="file"
                accept={FORMAT_ACCEPT_STRING}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </>
        )}
      </div>
    </header>
  );
}
