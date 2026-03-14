# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build      # Type-check (tsc -b) then Vite production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint
npm run format     # Prettier (src/**/*.{ts,tsx,css})
npm run test       # Vitest
npm run test:ui    # Vitest with browser UI
```

## Architecture

PixelForge is a fully client-side batch image converter. All processing runs in-browser via WebAssembly — no server.

**Supported formats:** PNG, JPEG, WebP, AVIF, BMP, TIFF. Operations: format conversion, resize, quality compression, EXIF stripping, text watermark, side-by-side comparison.

### Data Flow

`App.tsx` conditionally renders `DropZone` (empty queue) or `Workspace` (files queued). The `Workspace` composes `SettingsPanel` + `FileQueue` + `BatchActions` + `ComparisonView`.

**Processing pipeline** lives in a Web Worker (`src/workers/image-processor.worker.ts`):
1. Main thread reads file → strips EXIF if JPEG (`piexifjs` on main thread) → transfers ArrayBuffer to worker
2. Worker **decodes** (jSquash codecs for PNG/JPG/WebP/AVIF, `utif` for TIFF, `createImageBitmap` for BMP)
3. Worker **resizes** via OffscreenCanvas (aspect-ratio-aware)
4. Worker **watermarks** via OffscreenCanvas text drawing
5. Worker **encodes** to target format (jSquash for modern formats, `utif` for TIFF, Canvas API + manual fallback for BMP)
6. Worker transfers result buffer back → main thread creates Blob + object URL

Images process sequentially (one at a time) to manage memory. The store polls completion at 50ms intervals before sending the next image.

### Worker Message Protocol

Discriminated unions in `src/types/worker-messages.ts`. Inbound: `PROCESS_IMAGE | CANCEL`. Outbound: `PROCESS_PROGRESS | PROCESS_COMPLETE | PROCESS_ERROR`. Buffers are transferred (not copied) via `postMessage` second arg.

### State Management

Single Zustand store (`src/stores/image-store.ts`) owns the queue, conversion settings, batch status, and worker lifecycle. Worker is a module-level lazy singleton via `getWorker()`. Settings use nested partial merge helpers (`updateResize`, `updateWatermark`).

`src/stores/ui-store.ts` handles view mode, comparison mode, and settings panel visibility.

### WASM Codec Pattern

Codecs lazy-load inside the worker as module-level singletons:
```typescript
let pngCodec: typeof import("@jsquash/png") | null = null;
// loaded on first use, cached thereafter
```
The four `@jsquash/*` packages are excluded from Vite's `optimizeDeps` to prevent pre-bundling of WASM modules.

### Memory Management

Object URLs (`URL.createObjectURL`) are created for thumbnails and results. They are explicitly revoked in `removeFile()` and `clearAll()`. The `ComparisonView` creates a temporary URL from the original File on render.

## Code Style

- **Prettier**: double quotes, semicolons, 100 char width, trailing commas, Tailwind plugin for class sorting
- **TypeScript**: strict mode, `noUncheckedIndexedAccess`, unused vars/params are errors (prefix with `_` to ignore)
- **Components**: named exports (not default), except `App`. Props interfaces defined inline above component.
- **Path alias**: `@/` maps to `src/`

## Theme

Obsidian Ember (#01) — dark theme only. Key tokens: `--color-accent: #e94560`, surfaces from `surface-0` (#0a0a0e) to `surface-4` (#2e2e44), status colors for pending/processing/complete/error. Gradient: `bg-from` → `bg-via` → `bg-to` at 135deg.

## Vite Config Notes

- `vite-plugin-wasm` + `vite-plugin-top-level-await` required in both main config AND `worker.plugins`
- Worker format is `"es"` (ES modules)
- COOP/COEP headers set via `server.headers` for dev, `coi-serviceworker.js` handles production
- `base` switches to `/pixel-forge/` when `GITHUB_PAGES` env var is set
- Build target is `esnext`

## Sibling Project

`../json-surgeon` follows identical conventions (same stack versions, config patterns, Zustand store style, worker message protocol). Use it as reference for any convention questions.
