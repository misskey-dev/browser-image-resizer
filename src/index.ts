import { Hermit as _Hermite } from './hermite';
import { bilinear as _bilinear } from './bilinear';
import { scaleImage } from './scaling_operations';

export const Hermit = _Hermite;
export const bilinear = _bilinear;

type BrowserImageResizerConfigBase = {
	argorithm: 'bilinear' | 'hermite' | 'hermite_single';
	maxWidth: number;
	maxHeight: number;
	maxSize?: number;     // ???

	/**
	 * Scale ratio. Strictly limited to maxWidth.
	 */
	scaleRatio?: number;

	/**
	 * Output logs to console
	 */
	debug: boolean;
}

export type BrowserImageResizerConfigWithConvertedOutput = BrowserImageResizerConfigBase & {
	quality: number;
	mimeType: string;
};

export type BrowserImageResizerConfigWithOffscreenCanvasOutput = BrowserImageResizerConfigBase & {
	mimeType: null;
}

export type BrowserImageResizerConfig = BrowserImageResizerConfigWithConvertedOutput | BrowserImageResizerConfigWithOffscreenCanvasOutput;

const DEFAULT_CONFIG = {
	argorithm: 'bilinear',
	quality: 0.5,
	maxWidth: 800,
	maxHeight: 600,
	debug: false,
	mimeType: 'image/jpeg',
} as const;

export async function readAndCompressImage(img: ImageBitmapSource | OffscreenCanvas, userConfig: Partial<BrowserImageResizerConfigWithConvertedOutput>): Promise<Blob>
export async function readAndCompressImage(img: ImageBitmapSource | OffscreenCanvas, userConfig: Partial<Omit<BrowserImageResizerConfigWithOffscreenCanvasOutput, 'quality'>>): Promise<OffscreenCanvas>
export async function readAndCompressImage(
	img: ImageBitmapSource | OffscreenCanvas,
	userConfig: Partial<BrowserImageResizerConfig>
) {
	const config = Object.assign({}, DEFAULT_CONFIG, userConfig);
	return scaleImage({ img, config });
}
