import { Hermite } from '@/utils/hermite.js';
import { getImageData } from '@/utils/canvas_image_data.js';
import { defineImageResizingAlgorithm } from '@/image_resizing_algorithm.js';

let hermite: Hermite | undefined;

function getHermite() {
	if (!hermite) hermite = new Hermite();
	return hermite;
}

export const hermiteSingle = defineImageResizingAlgorithm({
	name: 'hermite_single',
	resize({ source, destination, debug }) {
		const { srcImgData, destImgData } = getImageData(source, destination);
		getHermite().resampleSingle(srcImgData, destImgData, { debug });
		destination.getContext('2d')?.putImageData(destImgData, 0, 0);
	},
});
