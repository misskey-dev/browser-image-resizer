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
