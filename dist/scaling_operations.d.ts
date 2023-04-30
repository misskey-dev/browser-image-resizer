import { BrowserImageResizerConfig } from '.';
export declare function scaleImage({ img, config }: {
    img: ImageBitmapSource | OffscreenCanvas;
    config: BrowserImageResizerConfig;
}): Promise<Blob>;
