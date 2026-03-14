declare module "@jsquash/png" {
  export function decode(buffer: ArrayBuffer): Promise<ImageData>;
  export function encode(data: ImageData): Promise<ArrayBuffer>;
}

declare module "@jsquash/jpeg" {
  export function decode(buffer: ArrayBuffer): Promise<ImageData>;
  export function encode(
    data: ImageData,
    options?: { quality?: number },
  ): Promise<ArrayBuffer>;
}

declare module "@jsquash/webp" {
  export function decode(buffer: ArrayBuffer): Promise<ImageData>;
  export function encode(
    data: ImageData,
    options?: { quality?: number },
  ): Promise<ArrayBuffer>;
}

declare module "@jsquash/avif" {
  export function decode(buffer: ArrayBuffer): Promise<ImageData>;
  export function encode(
    data: ImageData,
    options?: { quality?: number },
  ): Promise<ArrayBuffer>;
}

declare module "piexifjs" {
  export function load(binaryString: string): object;
  export function dump(exifObj: object): string;
  export function insert(exifStr: string, binaryString: string): string;
  export function remove(binaryString: string): string;
}

declare module "utif" {
  interface IFD {
    width: number;
    height: number;
    data: Uint8Array;
  }
  export function decode(buffer: ArrayBuffer): IFD[];
  export function decodeImage(buffer: ArrayBuffer, ifd: IFD): void;
  export function toRGBA8(ifd: IFD): Uint8Array;
  export function encodeImage(
    rgba: Uint8ClampedArray | Uint8Array,
    width: number,
    height: number,
  ): ArrayBuffer;
}
