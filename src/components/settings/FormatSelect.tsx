import { useImageStore } from "@/stores/image-store";
import { SUPPORTED_FORMATS, FORMAT_LABELS } from "@/constants/formats";
import type { ImageFormat } from "@/types/image";

export function FormatSelect() {
  const outputFormat = useImageStore((s) => s.settings.outputFormat);
  const updateSettings = useImageStore((s) => s.updateSettings);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-text-secondary">Output Format</label>
      <select
        value={outputFormat}
        onChange={(e) => updateSettings({ outputFormat: e.target.value as ImageFormat })}
        className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
      >
        {SUPPORTED_FORMATS.map((fmt) => (
          <option key={fmt} value={fmt}>
            {FORMAT_LABELS[fmt]}
          </option>
        ))}
      </select>
    </div>
  );
}
