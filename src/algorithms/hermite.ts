import { Hermite } from '@/utils/hermite.js';
import { defineImageResizingAlgorithm } from '@/image_resizing_algorithm.js';

let hermiteInstance: Hermite | undefined;

function getHermite() {
	if (!hermiteInstance) hermiteInstance = new Hermite();
	return hermiteInstance;
}

export const hermite = defineImageResizingAlgorithm({
	name: 'hermite',
	resize({ source, destination, debug }) {
		return getHermite().resampleAuto(source, destination, { debug });
	},
});
