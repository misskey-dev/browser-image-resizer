import { Hermit as _Hermite } from './hermite';
import { bilinear as _bilinear } from './bilinear';
export declare const Hermit: typeof _Hermite;
export declare const bilinear: typeof _bilinear;
type BrowserImageResizerConfigBase = {
    /**
     * Algorithm used for downscaling
     *
     * * `null`: Just resize with `drawImage()`. The best quality and fastest.
     * * `bilinear`: Better quality, slower. Comes from upstream (ericnogralesbrowser-image-resizer).
     * * `hermite`: Worse quality, faster. Comes from [viliusle/Hermite-resize](https://github.com/viliusle/Hermite-resize). Will dispatch workers for better performance.
     * * `hermite_single`: Worse quality, faster. Single-threaded.
     *
     * default: null
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
export declare function calculateSize(src: {
    width: number;
    height: number;
}, userConfig: Partial<BrowserImageResizerConfigBase>): {
    width: number;
    height: number;
};
export {};
