export declare class Hermit {
    private cores;
    private workersArchive;
    private workerBlobURL;
    /**
     * contructor
     */
    constructor();
    /**
     * Hermite resize. Detect cpu count and use best option for user.
     */
    resampleAuto(srcCanvas: OffscreenCanvas, destCanvas: OffscreenCanvas, config: {
        debug?: boolean;
        argorithm?: string;
    }): Promise<void> | undefined;
    /**
     * Hermite resize, multicore version - fast image resize/resample using Hermite filter.
     */
    resample(srcCanvas: OffscreenCanvas, destCanvas: OffscreenCanvas, config: {
        debug?: boolean;
    }): Promise<void>;
    /**
     * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
     */
    resampleSingle(srcCanvasData: ImageData, destCanvasData: ImageData, config: {
        debug?: boolean;
    }): void;
}
