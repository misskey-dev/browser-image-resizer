import { BrowserImageResizerConfig } from '.';
export declare function getTargetHeight(srcHeight: number, scale: number, config: BrowserImageResizerConfig): number;
export declare function findMaxWidth(config: BrowserImageResizerConfig, canvas: {
    width: number;
    height: number;
}): number;
export declare function getImageData(canvas: OffscreenCanvas, scaled: OffscreenCanvas): {
    srcImgData: ImageData;
    destImgData: ImageData;
};
export declare function scaleImage({ img, config }: {
    img: ImageBitmapSource | OffscreenCanvas;
    config: BrowserImageResizerConfig;
}): Promise<Blob | OffscreenCanvas>;
