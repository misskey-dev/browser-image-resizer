import { BrowserImageResizerConfig } from '.';
export declare function getImageData(canvas: OffscreenCanvas, scaled: OffscreenCanvas): {
    srcImgData: ImageData;
    destImgData: ImageData;
};
export declare function scaleImage({ img, config }: {
    img: ImageBitmapSource | OffscreenCanvas;
    config: BrowserImageResizerConfig;
}): Promise<Blob | OffscreenCanvas>;
