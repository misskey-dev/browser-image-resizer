import { Hermit as _Hermite } from './hermite';
import { bilinear as _bilinear } from './bilinear';
export declare const Hermit: typeof _Hermite;
export declare const bilinear: typeof _bilinear;
type BrowserImageResizerConfigBase = {
    /**
     * Argorithm to use for downscaling.
     *
     * bilinear: better quality, slower.
     * hermite: worse quality, faster. Will dispatch workers for better performance.
     * hermite_single: worse quality, faster. Single-threaded.
     * null: just resize with drawImage()
     *
     * default: bilinear
     */
    argorithm: 'bilinear' | 'hermite' | 'hermite_single' | 'null' | null;
    /**
     * Whether to process downscaling by `drawImage(source, 0, 0, source.width / 2, source.height / 2)`
     * until the size is smaller than twice the target size.
     *
     * There seems to be no situation where it is necessary to change to false.
     *
     * default: true
     */
    processByHalf: boolean;
    maxWidth: number;
    maxHeight: number;
    maxSize?: number;
    /**
     * Scale ratio. Strictly limited to maxWidth.
     */
    scaleRatio?: number;
    /**
     * Output logs to console
     */
    debug: boolean;
};
export type BrowserImageResizerConfigWithConvertedOutput = BrowserImageResizerConfigBase & {
    quality: number;
    mimeType: string;
};
export type BrowserImageResizerConfigWithOffscreenCanvasOutput = BrowserImageResizerConfigBase & {
    mimeType: null;
};
export type BrowserImageResizerConfig = BrowserImageResizerConfigWithConvertedOutput | BrowserImageResizerConfigWithOffscreenCanvasOutput;
export declare function readAndCompressImage(img: ImageBitmapSource | OffscreenCanvas, userConfig: Partial<BrowserImageResizerConfigWithConvertedOutput>): Promise<Blob>;
export declare function readAndCompressImage(img: ImageBitmapSource | OffscreenCanvas, userConfig: Partial<Omit<BrowserImageResizerConfigWithOffscreenCanvasOutput, 'quality'>>): Promise<OffscreenCanvas>;
export {};
