// src/bilinear.ts
function bilinear(srcCanvasData, destCanvasData, scale) {
  function inner(f00, f10, f01, f11, x, y) {
    let un_x = 1 - x;
    let un_y = 1 - y;
    return f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y;
  }
  let i, j;
  let iyv, iy0, iy1, ixv, ix0, ix1;
  let idxD, idxS00, idxS10, idxS01, idxS11;
  let dx, dy;
  let r, g, b, a;
  for (i = 0; i < destCanvasData.height; ++i) {
    iyv = i / scale;
    iy0 = Math.floor(iyv);
    iy1 = Math.ceil(iyv) > srcCanvasData.height - 1 ? srcCanvasData.height - 1 : Math.ceil(iyv);
    for (j = 0; j < destCanvasData.width; ++j) {
      ixv = j / scale;
      ix0 = Math.floor(ixv);
      ix1 = Math.ceil(ixv) > srcCanvasData.width - 1 ? srcCanvasData.width - 1 : Math.ceil(ixv);
      idxD = (j + destCanvasData.width * i) * 4;
      idxS00 = (ix0 + srcCanvasData.width * iy0) * 4;
      idxS10 = (ix1 + srcCanvasData.width * iy0) * 4;
      idxS01 = (ix0 + srcCanvasData.width * iy1) * 4;
      idxS11 = (ix1 + srcCanvasData.width * iy1) * 4;
      dx = ixv - ix0;
      dy = iyv - iy0;
      r = inner(
        srcCanvasData.data[idxS00],
        srcCanvasData.data[idxS10],
        srcCanvasData.data[idxS01],
        srcCanvasData.data[idxS11],
        dx,
        dy
      );
      destCanvasData.data[idxD] = r;
      g = inner(
        srcCanvasData.data[idxS00 + 1],
        srcCanvasData.data[idxS10 + 1],
        srcCanvasData.data[idxS01 + 1],
        srcCanvasData.data[idxS11 + 1],
        dx,
        dy
      );
      destCanvasData.data[idxD + 1] = g;
      b = inner(
        srcCanvasData.data[idxS00 + 2],
        srcCanvasData.data[idxS10 + 2],
        srcCanvasData.data[idxS01 + 2],
        srcCanvasData.data[idxS11 + 2],
        dx,
        dy
      );
      destCanvasData.data[idxD + 2] = b;
      a = inner(
        srcCanvasData.data[idxS00 + 3],
        srcCanvasData.data[idxS10 + 3],
        srcCanvasData.data[idxS01 + 3],
        srcCanvasData.data[idxS11 + 3],
        dx,
        dy
      );
      destCanvasData.data[idxD + 3] = a;
    }
  }
}

// src/scaling_operations.ts
var hermite;
function getTargetHeight(srcHeight, scale, config) {
  return Math.min(Math.floor(srcHeight * scale), config.maxHeight);
}
function findMaxWidth(config, canvas) {
  const ratio = canvas.width / canvas.height;
  let mWidth = Math.min(
    canvas.width,
    config.maxWidth,
    ratio * config.maxHeight
  );
  if (config.maxSize && config.maxSize > 0 && config.maxSize < canvas.width * canvas.height / 1e3)
    mWidth = Math.min(
      mWidth,
      Math.floor(config.maxSize * 1e3 / canvas.height)
    );
  if (!!config.scaleRatio)
    mWidth = Math.min(mWidth, Math.floor(config.scaleRatio * canvas.width));
  if (config.debug) {
    console.log(
      "browser-image-resizer: original image size = " + canvas.width + " px (width) X " + canvas.height + " px (height)"
    );
    console.log(
      "browser-image-resizer: scaled image size = " + mWidth + " px (width) X " + getTargetHeight(canvas.height, mWidth / canvas.width, config) + " px (height)"
    );
  }
  if (mWidth <= 0) {
    mWidth = 1;
    console.warn("browser-image-resizer: image size is too small");
  }
  return mWidth;
}
function getImageData(canvas, scaled) {
  const srcImgData = canvas?.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height);
  const destImgData = scaled?.getContext("2d")?.createImageData(scaled.width, scaled.height);
  if (!srcImgData || !destImgData)
    throw Error("Canvas is empty (scaleCanvasWithAlgorithm). You should run this script after the document is ready.");
  return { srcImgData, destImgData };
}
function prepareHermit() {
  if (!hermite)
    hermite = new Hermit();
}
async function scaleCanvasWithAlgorithm(canvas, config) {
  const scale = config.outputWidth / canvas.width;
  const scaled = new OffscreenCanvas(Math.floor(config.outputWidth), getTargetHeight(canvas.height, scale, config));
  switch (config.argorithm) {
    case "hermite": {
      prepareHermit();
      await hermite.resampleAuto(canvas, scaled, config);
      break;
    }
    case "hermite_single": {
      const { srcImgData, destImgData } = getImageData(canvas, scaled);
      prepareHermit();
      hermite.resampleSingle(srcImgData, destImgData, config);
      scaled?.getContext("2d")?.putImageData(destImgData, 0, 0);
      break;
    }
    case "bilinear": {
      const { srcImgData, destImgData } = getImageData(canvas, scaled);
      bilinear(srcImgData, destImgData, scale);
      scaled?.getContext("2d")?.putImageData(destImgData, 0, 0);
      break;
    }
    default: {
      scaled.getContext("2d")?.drawImage(canvas, 0, 0, scaled.width, scaled.height);
      break;
    }
  }
  return scaled;
}
function getHalfScaleCanvas(src) {
  const half = new OffscreenCanvas(src.width / 2, src.height / 2);
  half?.getContext("2d")?.drawImage(src, 0, 0, half.width, half.height);
  return half;
}
async function scaleImage({ img, config }) {
  if (config.debug) {
    console.log("browser-image-resizer: Scale: Started", img);
  }
  let converting;
  if (img instanceof OffscreenCanvas) {
    converting = img;
  } else {
    const bmp = await createImageBitmap(img);
    converting = new OffscreenCanvas(bmp.width, bmp.height);
    converting.getContext("2d")?.drawImage(bmp, 0, 0);
  }
  if (!converting?.getContext("2d"))
    throw Error("browser-image-resizer: Canvas Context is empty.");
  const maxWidth = findMaxWidth(config, converting);
  if (!maxWidth)
    throw Error(`browser-image-resizer: maxWidth is ${maxWidth}!!`);
  if (config.debug)
    console.log(`browser-image-resizer: scale: maxWidth is ${maxWidth}`);
  while (config.processByHalf && converting.width >= 2 * maxWidth) {
    if (config.debug)
      console.log(`browser-image-resizer: scale: Scaling canvas by half from ${converting.width}`);
    converting = getHalfScaleCanvas(converting);
  }
  if (converting.width > maxWidth) {
    if (config.debug)
      console.log(`browser-image-resizer: scale: Scaling canvas by ${config.argorithm} from ${converting.width} to ${maxWidth}`);
    converting = await scaleCanvasWithAlgorithm(
      converting,
      Object.assign(config, { outputWidth: maxWidth })
    );
  }
  if (config.mimeType === null) {
    return converting;
  }
  const imageData = await converting.convertToBlob({ type: config.mimeType, quality: config.quality });
  return imageData;
}

// src/hermite.ts
var Hermit = class {
  /**
   * contructor
   */
  constructor() {
    this.workersArchive = [];
    this.cores = Math.min(navigator.hardwareConcurrency || 4, 4);
    this.workerBlobURL = globalThis.URL.createObjectURL(new Blob([
      "(",
      function() {
        onmessage = function(event) {
          if (event.data.debug) {
            console.log("browser-image-resizer: hermite worker: start", event.data.core, event.data);
            console.time("work");
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
          const source = new Uint8ClampedArray(event.data.source);
          const target_size = destWidth * destHeight * 4;
          const target_memory = new ArrayBuffer(target_size);
          const target = new Uint8ClampedArray(target_memory, 0, target_size);
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
                let w0 = dy * dy;
                for (let xx = xx_start; xx < xx_stop; xx++) {
                  let dx = Math.abs(center_x - xx) / ratio_w_half;
                  let w = Math.sqrt(w0 + dx * dx);
                  if (w >= 1) {
                    continue;
                  }
                  weight = 2 * w * w * w - 3 * w * w + 1;
                  let pos_x = 4 * (xx + yy * srcWidth);
                  gx_a += weight * source[pos_x + 3];
                  weights_alpha += weight;
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
          const objData = {
            core,
            target
          };
          globalThis.postMessage(objData, [target.buffer]);
          if (event.data.debug) {
            console.timeEnd("work");
            console.log("browser-image-resizer: Worker: end", event.data.core);
          }
        };
      }.toString(),
      ")()"
    ], { type: "application/javascript" }));
  }
  /**
   * Hermite resize. Detect cpu count and use best option for user.
   */
  resampleAuto(srcCanvas, destCanvas, config) {
    if (!!globalThis.Worker && this.cores > 1 && config?.argorithm !== "hermite_single") {
      return this.resample(srcCanvas, destCanvas, config);
    } else {
      const { srcImgData, destImgData } = getImageData(srcCanvas, destCanvas);
      this.resampleSingle(srcImgData, destImgData, config);
      destCanvas.getContext("2d").putImageData(destImgData, 0, 0);
      return;
    }
  }
  /**
   * Hermite resize, multicore version - fast image resize/resample using Hermite filter.
   */
  async resample(srcCanvas, destCanvas, config) {
    return new Promise((resolve, reject) => {
      if (config.debug)
        console.time("hermite_multi");
      const ratio_h = srcCanvas.height / destCanvas.height;
      if (this.workersArchive.length > 0) {
        for (let c = 0; c < this.cores; c++) {
          if (this.workersArchive[c] != void 0) {
            this.workersArchive[c].terminate();
            delete this.workersArchive[c];
          }
        }
      }
      this.workersArchive = new Array(this.cores);
      const ctx = srcCanvas.getContext("2d");
      if (!ctx)
        return reject("Canvas is empty (resample)");
      if (config.debug) {
        console.log("browser-image-resizer: hermite_multi: ", this.cores, "cores");
        console.log("browser-image-resizer: source size: ", srcCanvas.width, srcCanvas.height, "ratio_h: ", ratio_h);
        console.log("browser-image-resizer: target size: ", destCanvas.width, destCanvas.height);
      }
      const data_part = [];
      const block_height = Math.ceil(srcCanvas.height / this.cores / 2) * 2;
      let end_y = -1;
      for (let c = 0; c < this.cores; c++) {
        const offset_y = end_y + 1;
        if (offset_y >= srcCanvas.height) {
          continue;
        }
        end_y = Math.min(offset_y + block_height - 1, srcCanvas.height - 1);
        const current_block_height = Math.min(block_height, srcCanvas.height - offset_y);
        if (config.debug) {
          console.log("browser-image-resizer: source split: ", "#" + c, offset_y, end_y, "height: " + current_block_height);
        }
        data_part.push({
          source: ctx.getImageData(0, offset_y, srcCanvas.width, block_height),
          startY: Math.ceil(offset_y / ratio_h),
          height: current_block_height
        });
      }
      const destCtx = destCanvas.getContext("2d");
      if (!destCtx)
        return reject("Canvas is empty (resample dest)");
      let workers_in_use = data_part.length;
      for (let c = 0; c < data_part.length; c++) {
        const my_worker = new Worker(this.workerBlobURL);
        this.workersArchive[c] = my_worker;
        my_worker.onmessage = (event) => {
          workers_in_use--;
          const core = event.data.core;
          const height_part = Math.ceil(data_part[core].height / ratio_h);
          const target = destCtx.createImageData(destCanvas.width, height_part);
          target.data.set(event.data.target);
          destCtx.putImageData(target, 0, data_part[core].startY);
          if (workers_in_use <= 0) {
            resolve();
            if (config.debug)
              console.timeEnd("hermite_multi");
          }
          this.workersArchive[core].terminate();
          delete this.workersArchive[core];
        };
        my_worker.onerror = (err) => reject(err);
        const objData = {
          srcWidth: srcCanvas.width,
          srcHeight: data_part[c].height,
          destWidth: destCanvas.width,
          destHeight: Math.ceil(data_part[c].height / ratio_h),
          core: c,
          source: data_part[c].source.data.buffer,
          debug: config.debug
        };
        my_worker.postMessage(objData, [objData.source]);
      }
    });
  }
  /**
   * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
   */
  resampleSingle(srcCanvasData, destCanvasData, config) {
    const ratio_w = srcCanvasData.width / destCanvasData.width;
    const ratio_h = srcCanvasData.height / destCanvasData.height;
    const ratio_w_half = Math.ceil(ratio_w / 2);
    const ratio_h_half = Math.ceil(ratio_h / 2);
    const data = srcCanvasData.data;
    const data2 = destCanvasData.data;
    if (config.debug) {
      console.log("browser-image-resizer: source size: ", srcCanvasData.width, srcCanvasData.height, "ratio_h: ", ratio_h);
      console.log("browser-image-resizer: target size: ", destCanvasData.width, destCanvasData.height);
      console.time("hermite_single");
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
          let w0 = dy * dy;
          for (let xx = xx_start; xx < xx_stop; xx++) {
            let dx = Math.abs(center_x - xx) / ratio_w_half;
            let w = Math.sqrt(w0 + dx * dx);
            if (w >= 1) {
              continue;
            }
            weight = 2 * w * w * w - 3 * w * w + 1;
            let pos_x = 4 * (xx + yy * srcCanvasData.width);
            gx_a += weight * data[pos_x + 3];
            weights_alpha += weight;
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
      console.timeEnd("hermite_single");
    }
  }
};

// src/index.ts
var Hermit2 = Hermit;
var bilinear2 = bilinear;
var DEFAULT_CONFIG = {
  argorithm: "null",
  processByHalf: true,
  quality: 0.5,
  maxWidth: 800,
  maxHeight: 600,
  debug: false,
  mimeType: "image/jpeg"
};
async function readAndCompressImage(img, userConfig) {
  const config = Object.assign({}, DEFAULT_CONFIG, userConfig);
  return scaleImage({ img, config });
}
function calculateSize(src, userConfig) {
  const config = Object.assign({}, DEFAULT_CONFIG, userConfig);
  const width = findMaxWidth(config, src);
  const height = getTargetHeight(src.height, width / src.width, config);
  return { width: Math.floor(width), height };
}
export {
  Hermit2 as Hermit,
  bilinear2 as bilinear,
  calculateSize,
  readAndCompressImage
};
