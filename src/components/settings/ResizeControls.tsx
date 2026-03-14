import { Lock, Unlock } from "lucide-react";
import { useImageStore } from "@/stores/image-store";
import { Toggle } from "@/components/shared/Toggle";

export function ResizeControls() {
  const resize = useImageStore((s) => s.settings.resize);
  const updateResize = useImageStore((s) => s.updateResize);

  return (
    <div className="flex flex-col gap-2">
      <Toggle
        label="Resize"
        checked={resize.enabled}
        onChange={(checked) => updateResize({ enabled: checked })}
      />

      {resize.enabled && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-text-muted">Width</label>
            <input
              type="number"
              value={resize.width}
              min={1}
              max={10000}
              onChange={(e) => {
                const w = Number(e.target.value);
                if (resize.lockAspectRatio && resize.height > 0) {
                  const ratio = resize.height / resize.width;
                  updateResize({ width: w, height: Math.round(w * ratio) });
                } else {
                  updateResize({ width: w });
                }
              }}
              className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
            />
          </div>

          <button
            onClick={() => updateResize({ lockAspectRatio: !resize.lockAspectRatio })}
            className="mt-3 rounded p-1 text-text-muted transition-colors hover:text-accent"
            title={resize.lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {resize.lockAspectRatio ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="flex-1">
            <label className="text-[10px] text-text-muted">Height</label>
            <input
              type="number"
              value={resize.height}
              min={1}
              max={10000}
              onChange={(e) => {
                const h = Number(e.target.value);
                if (resize.lockAspectRatio && resize.width > 0) {
                  const ratio = resize.width / resize.height;
                  updateResize({ height: h, width: Math.round(h * ratio) });
                } else {
                  updateResize({ height: h });
                }
              }}
              className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
