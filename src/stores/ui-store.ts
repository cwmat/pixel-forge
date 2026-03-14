import { create } from "zustand";

export type ViewMode = "grid" | "list";
export type ComparisonMode = "side-by-side" | "slider";

interface UiStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  comparisonMode: ComparisonMode;
  setComparisonMode: (mode: ComparisonMode) => void;

  settingsPanelOpen: boolean;
  toggleSettingsPanel: () => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  viewMode: "grid",
  setViewMode: (mode) => set({ viewMode: mode }),

  comparisonMode: "side-by-side",
  setComparisonMode: (mode) => set({ comparisonMode: mode }),

  settingsPanelOpen: true,
  toggleSettingsPanel: () => set((s) => ({ settingsPanelOpen: !s.settingsPanelOpen })),
}));
