import { useImageStore } from "@/stores/image-store";

export function Footer() {
  const queue = useImageStore((s) => s.queue);
  const batchStatus = useImageStore((s) => s.batchStatus);

  const completed = queue.filter((q) => q.status === "complete").length;
  const errored = queue.filter((q) => q.status === "error").length;

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-surface-1 px-4 text-[11px] text-text-muted">
      <div className="flex items-center gap-3">
        {batchStatus === "idle" && queue.length === 0 && <span>Ready</span>}
        {batchStatus === "idle" && queue.length > 0 && (
          <span>{queue.length} image{queue.length !== 1 ? "s" : ""} queued</span>
        )}
        {batchStatus === "processing" && (
          <span className="text-status-processing">
            Processing {completed}/{queue.length}...
          </span>
        )}
        {batchStatus === "complete" && (
          <>
            <span className="text-status-complete">{completed} converted</span>
            {errored > 0 && <span className="text-status-error">{errored} failed</span>}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>Client-side only</span>
        <span className="text-text-muted/50">|</span>
        <span>Your images stay local</span>
      </div>
    </footer>
  );
}
