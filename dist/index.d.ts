import { Hermit as _Hermite } from './hermite';
import { bilinear as _bilinear } from './bilinear';
export declare const Hermit: typeof _Hermite;
export declare const bilinear: typeof _bilinear;
type BrowserImageResizerConfigBase = {
    argorithm: 'bilinear' | 'hermite' | 'hermite_single';
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
