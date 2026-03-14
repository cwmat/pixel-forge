import { useImageStore } from "@/stores/image-store";
import { SettingsPanel } from "./settings/SettingsPanel";
import { FileQueue } from "./queue/FileQueue";
import { BatchActions } from "./queue/BatchActions";
import { ComparisonView } from "./comparison/ComparisonView";

export function Workspace() {
  const selectedImageId = useImageStore((s) => s.selectedImageId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Settings sidebar */}
        <SettingsPanel />

        {/* Main content area */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <FileQueue />
          </div>
          <BatchActions />
        </div>
      </div>

      {/* Comparison panel */}
      {selectedImageId && <ComparisonView />}
    </div>
  );
}
