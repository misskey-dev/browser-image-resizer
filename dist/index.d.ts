type BrowserImageResizerConfigBase = {
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
