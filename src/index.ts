import type { ImageResizingAlgorithm } from '@/image_resizing_algorithm.js';
import { findMaxWidth, getTargetHeight, scaleImage } from '@/scaling_operations.js';

export { defineImageResizingAlgorithm } from '@/image_resizing_algorithm.js';
export type { ImageResizingAlgorithm, ImageResizingAlgorithmContext } from '@/image_resizing_algorithm.js';

type BrowserImageResizerConfigBase = {
	/**
	 * Algorithm used for downscaling
	 * 
	 * * `null`: Just resize with `drawImage()`. The best quality and fastest.
	 * * imported algorithm object: Use one of the exports under `algorithms/*`.
	 * 
	 * default: null
	 */
	algorithm: ImageResizingAlgorithm | null;

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
	algorithm: null,
	processByHalf: true,
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

export function calculateSize(src: { width: number; height: number }, userConfig: Partial<BrowserImageResizerConfigBase>) {
	const config = Object.assign({}, DEFAULT_CONFIG, userConfig);
	const width = findMaxWidth(config, src);
	const height = getTargetHeight(src.height, width / src.width, config);
	return { width: Math.floor(width), height };
}
