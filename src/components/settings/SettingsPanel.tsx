import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useImageStore } from "@/stores/image-store";
import { useUiStore } from "@/stores/ui-store";
import { FormatSelect } from "./FormatSelect";
import { QualitySlider } from "./QualitySlider";
import { ResizeControls } from "./ResizeControls";
import { WatermarkControls } from "./WatermarkControls";
import { Toggle } from "@/components/shared/Toggle";

export function SettingsPanel() {
  const settings = useImageStore((s) => s.settings);
  const updateSettings = useImageStore((s) => s.updateSettings);
  const { settingsPanelOpen, toggleSettingsPanel } = useUiStore();

  if (!settingsPanelOpen) {
    return (
      <button
        onClick={toggleSettingsPanel}
        className="flex h-full w-10 flex-col items-center justify-center border-r border-border bg-surface-1 text-text-muted transition-colors hover:text-text-primary"
        title="Open settings"
      >
        <Settings className="h-4 w-4" />
        <ChevronRight className="mt-1 h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface-1">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
          <Settings className="h-3.5 w-3.5 text-accent" />
          Settings
        </div>
        <button
          onClick={toggleSettingsPanel}
          className="rounded p-0.5 text-text-muted transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        <FormatSelect />
        <QualitySlider />
        <ResizeControls />
        <WatermarkControls />

        <div className="border-t border-border pt-3">
          <Toggle
            label="Strip EXIF data"
            description="Remove metadata from JPEG files"
            checked={settings.stripExif}
            onChange={(checked) => updateSettings({ stripExif: checked })}
          />
        </div>
      </div>
    </div>
  );
}
