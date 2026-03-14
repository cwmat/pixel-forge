import { useImageStore } from "@/stores/image-store";
import { Toggle } from "@/components/shared/Toggle";
import { Slider } from "@/components/shared/Slider";
import type { WatermarkOptions } from "@/types/image";

const POSITIONS: { value: WatermarkOptions["position"]; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

export function WatermarkControls() {
  const watermark = useImageStore((s) => s.settings.watermark);
  const updateWatermark = useImageStore((s) => s.updateWatermark);

  return (
    <div className="flex flex-col gap-2">
      <Toggle
        label="Watermark"
        checked={watermark.enabled}
        onChange={(checked) => updateWatermark({ enabled: checked })}
      />

      {watermark.enabled && (
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-text-muted">Text</label>
            <input
              type="text"
              value={watermark.text}
              onChange={(e) => updateWatermark({ text: e.target.value })}
              placeholder="Watermark text..."
              className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
            />
          </div>

          <Slider
            label="Font Size"
            value={watermark.fontSize}
            min={8}
            max={120}
            unit="px"
            onChange={(value) => updateWatermark({ fontSize: value })}
          />

          <Slider
            label="Opacity"
            value={Math.round(watermark.opacity * 100)}
            min={5}
            max={100}
            unit="%"
            onChange={(value) => updateWatermark({ opacity: value / 100 })}
          />

          <div>
            <label className="text-[10px] text-text-muted">Position</label>
            <select
              value={watermark.position}
              onChange={(e) =>
                updateWatermark({ position: e.target.value as WatermarkOptions["position"] })
              }
              className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
