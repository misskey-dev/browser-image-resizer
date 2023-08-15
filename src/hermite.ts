/*
 * Hermite resize - fast image resize/resample using Hermite filter.
 * https://github.com/viliusle/Hermite-resize/blob/fae53290d2b03520a6fc81d734c3028902a599c0/src/hermite.js
 * Author: ViliusL
 * License: MIT https://github.com/viliusle/Hermite-resize/blob/fae53290d2b03520a6fc81d734c3028902a599c0/MIT-LICENSE.txt
 */

import { getImageData } from "./scaling_operations";

type WorkerSouceData = {
    source: ImageData;
    startY: number;
    height: number;
}

type WorkerSouceMessage = {
    srcWidth: number;
    srcHeight: number;
    destWidth: number;
    destHeight: number;
    core: number;
    source: ArrayBufferLike;
    debug?: boolean;
}

type WorkerResultMessage = {
    core: number;
    target: Uint8ClampedArray;
}

export class Hermit {
    private cores: number;
    private workersArchive: Worker[] = [];
    private workerBlobURL: string;

    /**
     * contructor
     */
    constructor() {
        this.cores = Math.min(navigator.hardwareConcurrency || 4, 4);
        this.workerBlobURL = globalThis.URL.createObjectURL(new Blob(['(',
            function () {
                //begin worker
                onmessage = function (event: MessageEvent<WorkerSouceMessage>) {
                    if (event.data.debug) {
                        console.log('browser-image-resizer: hermite worker: start', event.data.core, event.data);
                        console.time('work')
                    }
                    const core = event.data.core;
                    const srcWidth = event.data.srcWidth;
                    const srcHeight = event.data.srcHeight;
                    const destWidth = event.data.destWidth;
                    const destHeight = event.data.destHeight;

                    const ratio_w = srcWidth / destWidth;
                    const ratio_h = srcHeight / destHeight;
                    const ratio_w_half = Math.ceil(ratio_w / 2);
                    const ratio_h_half = Math.ceil(ratio_h / 2);

                    //let source_h = source.length / width_source / 4;
                    const source = new Uint8ClampedArray(event.data.source);
                    const target_size = destWidth * destHeight * 4;
                    const target_memory = new ArrayBuffer(target_size);
                    const target = new Uint8ClampedArray(target_memory, 0, target_size);
                    //calculate
                    for (let j = 0; j < destHeight; j++) {
                        for (let i = 0; i < destWidth; i++) {
                            const x2 = (i + j * destWidth) * 4;
                            let weight = 0;
                            let weights = 0;
                            let weights_alpha = 0;
                            let gx_r = 0;
                            let gx_g = 0;
                            let gx_b = 0;
                            let gx_a = 0;
                            const center_y = j * ratio_h;

                            const xx_start = Math.floor(i * ratio_w);
                            const xx_stop = Math.min(Math.ceil((i + 1) * ratio_w), srcWidth);
                            const yy_start = Math.floor(j * ratio_h);
                            const yy_stop = Math.min(Math.ceil((j + 1) * ratio_h), srcHeight);

                            for (let yy = yy_start; yy < yy_stop; yy++) {
                                let dy = Math.abs(center_y - yy) / ratio_h_half;
                                let center_x = i * ratio_w;
                                let w0 = dy * dy; //pre-calc part of w
                                for (let xx = xx_start; xx < xx_stop; xx++) {
                                    let dx = Math.abs(center_x - xx) / ratio_w_half;
                                    let w = Math.sqrt(w0 + dx * dx);
                                    if (w >= 1) {
                                        //pixel too far
                                        continue;
                                    }
                                    //hermite filter
                                    weight = 2 * w * w * w - 3 * w * w + 1;
                                    //calc source pixel location
                                    let pos_x = 4 * (xx + yy * srcWidth);
                                    //alpha
                                    gx_a += weight * source[pos_x + 3];
                                    weights_alpha += weight;
                                    //colors
                                    if (source[pos_x + 3] < 255)
                                        weight = weight * source[pos_x + 3] / 250;
                                    gx_r += weight * source[pos_x];
                                    gx_g += weight * source[pos_x + 1];
                                    gx_b += weight * source[pos_x + 2];
                                    weights += weight;
                                }
                            }
                            target[x2] = gx_r / weights;
                            target[x2 + 1] = gx_g / weights;
                            target[x2 + 2] = gx_b / weights;
                            target[x2 + 3] = gx_a / weights_alpha;
                        }
                    }

                    //return
                    const objData: WorkerResultMessage = {
                        core,
                        target,
                    };
                    (globalThis.postMessage as any)(objData, [target.buffer]);
                    if (event.data.debug) {
                        console.timeEnd('work');
                        console.log('browser-image-resizer: Worker: end', event.data.core);
                    }
                };
                //end worker
            }.toString(),
            ')()'], { type: 'application/javascript' }));
    };

    /**
     * Hermite resize. Detect cpu count and use best option for user.
     */
    public resampleAuto(srcCanvas: OffscreenCanvas, destCanvas: OffscreenCanvas, config: { debug?: boolean, argorithm?: string }) {
        if (!!globalThis.Worker && this.cores > 1 && config?.argorithm !== 'hermite_single') {
            //workers supported and we have at least 2 cpu cores - using multithreading
            return this.resample(srcCanvas, destCanvas, config);
        } else {
            //1 cpu version
            const { srcImgData, destImgData } = getImageData(srcCanvas, destCanvas);
            this.resampleSingle(srcImgData, destImgData, config);
            destCanvas.getContext('2d')!.putImageData(destImgData, 0, 0);
            return;
        }
    };

    /**
     * Hermite resize, multicore version - fast image resize/resample using Hermite filter.
     */
    async resample(srcCanvas: OffscreenCanvas, destCanvas: OffscreenCanvas, config: { debug?: boolean }) {
        return new Promise<void>((resolve, reject) => {
            if (config.debug) console.time('hermite_multi');

            const ratio_h = srcCanvas.height / destCanvas.height;

            //stop old workers
            if (this.workersArchive.length > 0) {
                for (let c = 0; c < this.cores; c++) {
                    if (this.workersArchive[c] != undefined) {
                        this.workersArchive[c].terminate();
                        delete this.workersArchive[c];
                    }
                }
            }
            this.workersArchive = new Array(this.cores);

            //prepare source and target data for workers
            const ctx = srcCanvas.getContext('2d');
            if (!ctx) return reject('Canvas is empty (resample)');

            if (config.debug) {
                console.log('browser-image-resizer: hermite_multi: ', this.cores, 'cores');
                console.log('browser-image-resizer: source size: ', srcCanvas.width, srcCanvas.height, 'ratio_h: ', ratio_h);
                console.log('browser-image-resizer: target size: ', destCanvas.width, destCanvas.height);
            }

            const data_part: WorkerSouceData[] = [];
            const block_height = Math.ceil(srcCanvas.height / this.cores / 2) * 2;
            let end_y = -1;
            for (let c = 0; c < this.cores; c++) {
                //source
                const offset_y = end_y + 1;
                if (offset_y >= srcCanvas.height) {
                    //size too small, nothing left for this core
                    continue;
                }

                end_y = Math.min(offset_y + block_height - 1, srcCanvas.height - 1);

                const current_block_height = Math.min(block_height, srcCanvas.height - offset_y);

                if (config.debug) {
                    console.log('browser-image-resizer: source split: ', '#' + c, offset_y, end_y, 'height: ' + current_block_height);
                }

                data_part.push({
                    source: ctx.getImageData(0, offset_y, srcCanvas.width, block_height),
                    startY: Math.ceil(offset_y / ratio_h),
                    height: current_block_height
                });
            }

            //start
            const destCtx = destCanvas.getContext('2d');
            if (!destCtx) return reject('Canvas is empty (resample dest)');
            let workers_in_use = data_part.length;
            for (let c = 0; c < data_part.length; c++) {
                const my_worker = new Worker(this.workerBlobURL);
                this.workersArchive[c] = my_worker;

                my_worker.onmessage = (event: MessageEvent<WorkerResultMessage>) => {
                    workers_in_use--;
                    const core = event.data.core;

                    //draw
                    const height_part = Math.ceil(data_part[core].height / ratio_h);
                    const target = destCtx.createImageData(destCanvas.width, height_part);
                    target.data.set(event.data.target);
                    destCtx.putImageData(target, 0, data_part[core].startY);

                    if (workers_in_use <= 0) {
                        //all workers done
                        resolve();
                        if (config.debug) console.timeEnd('hermite_multi');
                    }

                    this.workersArchive[core].terminate();
                    delete this.workersArchive[core];
                };
                my_worker.onerror = err => reject(err);
                const objData: WorkerSouceMessage = {
                    srcWidth: srcCanvas.width,
                    srcHeight: data_part[c].height,
                    destWidth: destCanvas.width,
                    destHeight: Math.ceil(data_part[c].height / ratio_h),
                    core: c,
                    source: data_part[c].source.data.buffer,
                    debug: config.debug,
                };
                my_worker.postMessage(objData, [objData.source]);
            }
        });
    };

    /**
     * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
     */
    resampleSingle(srcCanvasData: ImageData, destCanvasData: ImageData, config: { debug?: boolean }) {
        const ratio_w = srcCanvasData.width / destCanvasData.width;
        const ratio_h = srcCanvasData.height / destCanvasData.height;
        const ratio_w_half = Math.ceil(ratio_w / 2);
        const ratio_h_half = Math.ceil(ratio_h / 2);

        const data = srcCanvasData.data;
        const data2 = destCanvasData.data;

        if (config.debug) {
            console.log('browser-image-resizer: source size: ', srcCanvasData.width, srcCanvasData.height, 'ratio_h: ', ratio_h);
            console.log('browser-image-resizer: target size: ', destCanvasData.width, destCanvasData.height);
            console.time('hermite_single');
        }
        for (let j = 0; j < destCanvasData.height; j++) {
            for (let i = 0; i < destCanvasData.width; i++) {
                const x2 = (i + j * destCanvasData.width) * 4;
                let weight = 0;
                let weights = 0;
                let weights_alpha = 0;
                let gx_r = 0;
                let gx_g = 0;
                let gx_b = 0;
                let gx_a = 0;
                const center_y = j * ratio_h;

                const xx_start = Math.floor(i * ratio_w);
                const xx_stop = Math.min(Math.ceil((i + 1) * ratio_w), srcCanvasData.width);
                const yy_start = Math.floor(j * ratio_h);
                const yy_stop = Math.min(Math.ceil((j + 1) * ratio_h), srcCanvasData.height);

                for (let yy = yy_start; yy < yy_stop; yy++) {
                    let dy = Math.abs(center_y - yy) / ratio_h_half;
                    let center_x = i * ratio_w;
                    let w0 = dy * dy; //pre-calc part of w
                    for (let xx = xx_start; xx < xx_stop; xx++) {
                        let dx = Math.abs(center_x - xx) / ratio_w_half;
                        let w = Math.sqrt(w0 + dx * dx);
                        if (w >= 1) {
                            //pixel too far
                            continue;
                        }
                        //hermite filter
                        weight = 2 * w * w * w - 3 * w * w + 1;
                        let pos_x = 4 * (xx + yy * srcCanvasData.width);
                        //alpha
                        gx_a += weight * data[pos_x + 3];
                        weights_alpha += weight;
                        //colors
                        if (data[pos_x + 3] < 255)
                            weight = weight * data[pos_x + 3] / 250;
                        gx_r += weight * data[pos_x];
                        gx_g += weight * data[pos_x + 1];
                        gx_b += weight * data[pos_x + 2];
                        weights += weight;
                    }
                }
                data2[x2] = gx_r / weights;
                data2[x2 + 1] = gx_g / weights;
                data2[x2 + 2] = gx_b / weights;
                data2[x2 + 3] = gx_a / weights_alpha;
            }
        }
        if (config.debug) {
            console.timeEnd('hermite_single');
        }
    };
}
