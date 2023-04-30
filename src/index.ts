import { scaleImage } from './scaling_operations';

export type BrowserImageResizerConfig = {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  maxSize?: number;     // ???
  scaleRatio?: number;  // ???
  debug: boolean;
  mimeType: string;
};

const DEFAULT_CONFIG: BrowserImageResizerConfig = {
  quality: 0.5,
  maxWidth: 800,
  maxHeight: 600,
  debug: false,
  mimeType: 'image/jpeg',
};
export async function readAndCompressImage(img: ImageBitmapSource | OffscreenCanvas, userConfig: Partial<BrowserImageResizerConfig>) {
  const config: BrowserImageResizerConfig = Object.assign({}, DEFAULT_CONFIG, userConfig);
  return scaleImage({ img, config });
}
