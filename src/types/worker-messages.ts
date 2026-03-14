import type { ConversionSettings, ImageDimensions } from "./image";

export type ImageWorkerInbound =
  | {
      type: "PROCESS_IMAGE";
      payload: {
        id: string;
        imageBuffer: ArrayBuffer;
        sourceFormat: string;
        settings: ConversionSettings;
      };
    }
  | { type: "CANCEL"; payload: { id: string } };

export type ImageWorkerOutbound =
  | {
      type: "PROCESS_PROGRESS";
      payload: { id: string; progress: number; stage: string };
    }
  | {
      type: "PROCESS_COMPLETE";
      payload: {
        id: string;
        buffer: ArrayBuffer;
        mimeType: string;
        dimensions: ImageDimensions;
      };
    }
  | { type: "PROCESS_ERROR"; payload: { id: string; message: string } };
