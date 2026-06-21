import { bilinear as resizeWithBilinear } from '@/utils/bilinear.js';
import { getImageData } from '@/utils/canvas_image_data.js';
import { defineImageResizingAlgorithm } from '@/image_resizing_algorithm.js';

export const bilinear = defineImageResizingAlgorithm({
	name: 'bilinear',
	resize({ source, destination, scale }) {
		const { srcImgData, destImgData } = getImageData(source, destination);
		resizeWithBilinear(srcImgData, destImgData, scale);
		destination.getContext('2d')?.putImageData(destImgData, 0, 0);
	},
});
