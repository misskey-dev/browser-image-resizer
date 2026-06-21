export type ImageResizingAlgorithmContext = {
	source: OffscreenCanvas;
	destination: OffscreenCanvas;
	scale: number;
	debug: boolean;
};

export type ImageResizingAlgorithm = {
	name: string;
	resize(context: ImageResizingAlgorithmContext): void | Promise<void>;
};

export function defineImageResizingAlgorithm<T extends ImageResizingAlgorithm>(algorithm: T): T {
	return algorithm;
}
