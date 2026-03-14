import { Play, Archive } from "lucide-react";
import { useImageStore } from "@/stores/image-store";
import { ProgressBar } from "@/components/shared/ProgressBar";

export function BatchActions() {
  const queue = useImageStore((s) => s.queue);
  const batchStatus = useImageStore((s) => s.batchStatus);
  const processAll = useImageStore((s) => s.processAll);
  const downloadAllZip = useImageStore((s) => s.downloadAllZip);

  const pending = queue.filter((q) => q.status === "pending" || q.status === "error").length;
  const completed = queue.filter((q) => q.status === "complete").length;
  const total = queue.length;
  const overallProgress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface-1 px-4 py-3">
      {batchStatus === "processing" && (
        <div className="flex items-center gap-3">
          <ProgressBar value={overallProgress} className="flex-1" />
          <span className="shrink-0 text-xs text-text-secondary">
            {completed}/{total}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {pending > 0 && batchStatus !== "processing" && (
          <button
            onClick={processAll}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface-0 transition-colors hover:bg-ember-400"
          >
            <Play className="h-4 w-4" />
            Convert {pending} image{pending !== 1 ? "s" : ""}
          </button>
        )}

        {batchStatus === "processing" && (
          <div className="flex items-center gap-2 text-sm text-status-processing">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </div>
        )}

        {completed > 0 && (
          <>
            <button
              onClick={() => downloadAllZip()}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              <Archive className="h-4 w-4" />
              Download ZIP ({completed})
            </button>
          </>
        )}

        {completed > 0 && completed < total && (
          <span className="text-xs text-text-muted">
            {total - completed - pending} processing
          </span>
        )}
      </div>
    </div>
  );
}
