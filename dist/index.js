// src/scaling_operations.ts
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
      "browser-image-resizer: scaled image size = " + mWidth + " px (width) X " + Math.floor(mWidth / ratio) + " px (height)"
    );
  }
  if (mWidth <= 0) {
    mWidth = 1;
    console.warn("browser-image-resizer: image size is too small");
  }
  return mWidth;
}
function scaleCanvasWithAlgorithm(canvas, config) {
  const scale = config.outputWidth / canvas.width;
  const scaled = new OffscreenCanvas(canvas.width * scale, canvas.height * scale);
  const srcImgData = canvas?.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height);
  const destImgData = scaled?.getContext("2d")?.createImageData(scaled.width, scaled.height);
  if (!srcImgData || !destImgData)
    throw Error("Canvas is empty (scaleCanvasWithAlgorithm). You should run this script after the document is ready.");
  applyBilinearInterpolation(srcImgData, destImgData, scale);
  scaled?.getContext("2d")?.putImageData(destImgData, 0, 0);
  return scaled;
}
function getHalfScaleCanvas(src) {
  const half = new OffscreenCanvas(src.width / 2, src.height / 2);
  half?.getContext("2d")?.drawImage(src, 0, 0, half.width, half.height);
  return half;
}
function applyBilinearInterpolation(srcCanvasData, destCanvasData, scale) {
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
async function scaleImage({ img, config }) {
  if (config.debug) {
    console.log("Scale: Started", img);
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
    throw Error("Canvas Context is empty.");
  const maxWidth = findMaxWidth(config, converting);
  if (config.debug)
    console.log(`Scale: Max width is ${maxWidth}`);
  while (converting.width >= 2 * maxWidth) {
    if (config.debug)
      console.log(`Scale: Scaling canvas by half from ${converting.width}`);
    converting = getHalfScaleCanvas(converting);
  }
  if (converting.width > maxWidth) {
    if (config.debug)
      console.log(`Scale: Scaling canvas from ${converting.width} to ${maxWidth}`);
    converting = scaleCanvasWithAlgorithm(
      converting,
      Object.assign(config, { outputWidth: maxWidth })
    );
  }
  const imageData = await converting.convertToBlob({ type: config.mimeType, quality: config.quality });
  return imageData;
}

// src/index.ts
var DEFAULT_CONFIG = {
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
export {
  readAndCompressImage
};
