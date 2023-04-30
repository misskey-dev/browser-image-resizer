export type BrowserImageResizerConfig = {
    quality: number;
    maxWidth: number;
    maxHeight: number;
    maxSize?: number;
    scaleRatio?: number;
    debug: boolean;
    mimeType: string;
};
export declare function readAndCompressImage(img: ImageBitmapSource | OffscreenCanvas, userConfig: Partial<BrowserImageResizerConfig>): Promise<Blob>;
