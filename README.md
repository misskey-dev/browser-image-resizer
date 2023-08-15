# browser-image-resizer

## Introduction

This library allows for cross-browser image downscaling utilizing `OffscreenCanvas`. 

## Note

- This is browser-only utility and will not work in Node.js.
- Safari 16.4 or later is required due to the use of `OffscreenCanvas`.  
  https://caniuse.com/offscreencanvas

## Installation

### NPM/Yarn/pnpm

- `npm install @misskey-dev/browser-image-resizer`
- `yarn add @misskey-dev/browser-image-resizer`
- `pnpm add @misskey-dev/browser-image-resizer`

## Usage

### In the main thread

```typescript
import { readAndCompressImage } from 'browser-image-resizer';

const config = {
  quality: 0.7,
  width: 800,
  height: 600
};

// Note: A single file comes from event.target.files on <input>
async function uploadImage(file) {
  try {
    let resizedImage = await readAndCompressImage(file, config);

    const url = `http://localhost:3001/upload`;
    const formData = new FormData();
    formData.append('images', resizedImage);
    const options = {
      method: 'POST',
      body: formData
    };

    let result = await fetch(url, options);

    // TODO: Handle the result
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
    throw(error);
  }
}
```

### In worker
Even large images can be processed in a separate thread using a worker.

#### worker.js

```typescript
import { readAndCompressImage } from "browser-image-resizer";

onmessage = async (e) => {
    const converted = await readAndCompressImage(e.data, { maxWidth: 300 });
    postMessage(converted, [converted]);
}
```

#### Main Thread

```typescript
const worker = new Worker('worker.js');

const img = document.getElementById('viewer_img');
worker.onmessage = (e) => {
  img.src = URL.createObjectURL(e.data);
};

async function convert(file: File) {
  const bmp = await createImageBitmap(file);
  worker.postMessage(bmp, [bmp]);
}
```

## API

### `readAndCompressImage(file, config) => Promise<Blob | OffscreenCanvas>`

#### Inputs

* `file`: An image source that createImageBitmap can read.   
  See https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
* `config`: See below

| Property Name        | Purpose           | Default Value  |
| ------------- |-------------| -----:|
| `argorithm` | Algorithm used for downscaling (see below) | 'null' |
| `processByHalf` | Whether to process downscaling by `drawImage(source, 0, 0, source.width / 2, source.height / 2)` until the size is smaller than twice the target size. | true |
| `quality`      | The quality of jpeg (or webp) | 0.5 |
| `maxWidth`      | The maximum width for the downscaled image | 800 |
| `maxHeight` | The maximum height for the downscaled image | 600 |
| `debug` | console.log image update operations | false |
| `mimeType` | specify image output type other than jpeg / If set `null`, function returns OffscreenCanvas  | 'image/jpeg' |

##### `argorithm`

* `null`: Just resize with `drawImage()`. The best quality and fastest.
* `bilinear`: Better quality, slower. Comes from upstream (ericnogralesbrowser-image-resizer).
* `hermite`: Worse quality, faster. Comes from [viliusle/Hermite-resize](https://github.com/viliusle/Hermite-resize). Will dispatch workers for better performance.
* `hermite_single`: Worse quality, faster. Single-threaded.

### Outputs

A Promise that yields an Image Blob or OffscreenCanvas

### Output Image Specification
The output image is derived from `OffscreenCanvas.convertToBlob`.  
https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob

- EXIF and other metadata will be erased.
- Rotation will be automatically corrected.
  * It is based on the specifications of recent versions of modern browsers and may not work with older browsers.
  * See https://github.com/w3c/csswg-drafts/issues/4666#issuecomment-610962845
  * Firefox support seems to be available from version 78. [by mei23](https://github.com/misskey-dev/misskey/pull/8216#issuecomment-1041382112)
- Color profile is srgb. Firefox 97 does not attach the ICC profile, but Chrome does.
- You can specify image/webp as the mimeType but [Safari does not support.](https://developer.apple.com/documentation/webkitjs/htmlcanvaselement/1630000-todataurl).
