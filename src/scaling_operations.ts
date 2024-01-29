import { BrowserImageResizerConfig } from '.';
import { bilinear } from './bilinear';
import { Hermit } from './hermite';

let hermite: Hermit;

function isIos() {
	if (typeof navigator === 'undefined') return false;
	if (!navigator.userAgent) return false;
	return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function getTargetHeight(srcHeight: number, scale: number, config: BrowserImageResizerConfig) {
	return Math.min(Math.floor(srcHeight * scale), config.maxHeight);
}

export function findMaxWidth(config: BrowserImageResizerConfig, canvas: { width: number; height: number }) {
	//Let's find the max available width for scaled image
	const ratio = canvas.width / canvas.height;
	let mWidth = Math.min(
		canvas.width,
		config.maxWidth,
		ratio * config.maxHeight
	);
	if (
		config.maxSize &&
		config.maxSize > 0 &&
		config.maxSize < (canvas.width * canvas.height) / 1000
	)
		mWidth = Math.min(
			mWidth,
			Math.floor((config.maxSize * 1000) / canvas.height)
		);
	if (!!config.scaleRatio)
		mWidth = Math.min(mWidth, Math.floor(config.scaleRatio * canvas.width));

	const rHeight = getTargetHeight(canvas.height, mWidth / canvas.width, config);

	if (config.debug) {
		console.log(
			'browser-image-resizer: original image size = ' +
			canvas.width +
			' px (width) X ' +
			canvas.height +
			' px (height)'
		);
		console.log(
			'browser-image-resizer: scaled image size = ' +
			mWidth +
			' px (width) X ' +
			rHeight +
			' px (height)'
		);
	}
	if (mWidth <= 0) {
		mWidth = 1;
		console.warn("browser-image-resizer: image size is too small");
	}

	if (isIos() && mWidth * rHeight > 167777216) {
		console.error("browser-image-resizer: image size is too large for iOS WebKit.", mWidth, rHeight);
		throw new Error("browser-image-resizer: image size is too large for iOS WebKit.");
	}

	return mWidth;
}

export function getImageData(canvas: OffscreenCanvas, scaled: OffscreenCanvas) {
	const srcImgData = canvas
		?.getContext('2d')
		?.getImageData(0, 0, canvas.width, canvas.height);
	const destImgData = scaled
		?.getContext('2d')
		?.createImageData(scaled.width, scaled.height);

	if (!srcImgData || !destImgData) throw Error('Canvas is empty (scaleCanvasWithAlgorithm). You should run this script after the document is ready.');

	return { srcImgData, destImgData };
}

function prepareHermit() {
	if (!hermite) hermite = new Hermit();
}

async function scaleCanvasWithAlgorithm(canvas: OffscreenCanvas, config: BrowserImageResizerConfig & { outputWidth: number }) {
	const scale = config.outputWidth / canvas.width;

	const scaled = new OffscreenCanvas(Math.floor(config.outputWidth), getTargetHeight(canvas.height, scale, config));

	switch (config.argorithm) {
		case 'hermite': {
			prepareHermit();
			await hermite.resampleAuto(canvas, scaled, config as BrowserImageResizerConfig & { argorithm: 'hermite' | 'hermite_single' });
			break;
		} case 'hermite_single': {
			const { srcImgData, destImgData } = getImageData(canvas, scaled);
			prepareHermit();
			hermite.resampleSingle(srcImgData, destImgData, config);
			scaled?.getContext('2d')?.putImageData(destImgData, 0, 0);
			break;
		} case 'bilinear': {
			const { srcImgData, destImgData } = getImageData(canvas, scaled);
			bilinear(srcImgData, destImgData, scale);
			scaled?.getContext('2d')?.putImageData(destImgData, 0, 0);
			break;
		} default: {
			scaled.getContext('2d')?.drawImage(canvas, 0, 0, scaled.width, scaled.height);
			break;
		}
	}

	return scaled;
}

function getHalfScaleCanvas(src: OffscreenCanvas | HTMLCanvasElement) {
	const half = new OffscreenCanvas(src.width / 2, src.height / 2);

	half
		?.getContext('2d')
		?.drawImage(src, 0, 0, half.width, half.height);

	return half;
}

export async function scaleImage({ img, config }: {
	img: ImageBitmapSource | OffscreenCanvas;
	config: BrowserImageResizerConfig;
}) {
	if (config.debug) {
		console.log('browser-image-resizer: Scale: Started', img);
	}
	let converting: OffscreenCanvas;

	if (img instanceof OffscreenCanvas) {
		converting = img;
	} else {
		const bmp = await createImageBitmap(img);

		/**
		 * iOS WebKitではOffscreenCanvasの最大サイズが特に厳しいため、
		 * 強制的に縮小する
		 * Ref.: https://github.com/misskey-dev/browser-image-resizer/issues/6
		 */
		if (isIos() && bmp.width * bmp.height > 16777216) {
			const scale = Math.sqrt(16777216 / (bmp.width * bmp.height));
			if (config.debug) console.log(`browser-image-resizer: scale: Image is too large in iOS WebKit}`);
			converting = new OffscreenCanvas(Math.floor(bmp.width * scale), Math.floor(bmp.height * scale));
			converting.getContext('2d')?.drawImage(bmp, 0, 0, converting.width, converting.height);
		} else {
			converting = new OffscreenCanvas(bmp.width, bmp.height);
			converting.getContext('2d')?.drawImage(bmp, 0, 0);
		}
	}

	if (!converting?.getContext('2d')) throw Error('browser-image-resizer: Canvas Context is empty.');

	const maxWidth = findMaxWidth(config, converting);

	if (!maxWidth) throw Error(`browser-image-resizer: maxWidth is ${maxWidth}!!`);
	if (config.debug) console.log(`browser-image-resizer: scale: maxWidth is ${maxWidth}`);

	while (config.processByHalf && converting.width >= 2 * maxWidth) {
		if (config.debug) console.log(`browser-image-resizer: scale: Scaling canvas by half from ${converting.width}`);
		converting = getHalfScaleCanvas(converting);
	}

	if (converting.width > maxWidth) {
		if (config.debug) console.log(`browser-image-resizer: scale: Scaling canvas by ${config.argorithm} from ${converting.width} to ${maxWidth}`);
		converting = await scaleCanvasWithAlgorithm(
			converting,
			Object.assign(config, { outputWidth: maxWidth }),
		);
	}

	if (config.mimeType === null) {
		return converting;
	}
	const imageData = await converting.convertToBlob({ type: config.mimeType, quality: config.quality });
	return imageData;
}
