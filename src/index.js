import ExifReader from 'exifreader';
import { scaleImage } from './scaling_operations'
import { initializeOrGetImg } from './browser_operations'
import { dataURItoBuffer } from './data_operations'

const DEFAULT_CONFIG = {
  quality: 0.5,
  maxWidth: 800,
  maxHeight: 600,
  autoRotate: true,
  debug: false,
  mimeType: 'image/jpeg'
};

export function readAndCompressImage(file, userConfig) {
  return new Promise(resolve => {
    let img = initializeOrGetImg()
    let reader = new FileReader();
    let config = Object.assign({}, DEFAULT_CONFIG, userConfig);

    reader.onload = function(e) {
      img.src = e.target.result;
      img.onload = function() {
        if (config.autoRotate) {
          if (config.debug)
            console.log(
              'browser-image-resizer: detecting image orientation...'
            );
          let buffer = dataURItoBuffer(img.src);
          let Orientation = {};
          try {
            const Result = ExifReader.load(buffer);
            Orientation = Result.Orientation || {};
          } catch (err) {}
          if (config.debug) {
            console.log(
              'browser-image-resizer: image orientation from EXIF tag = ' +
                Orientation
            );
          }
          resolve(scaleImage(img, config, Orientation.value));
        } else {
          if (config.debug)
            console.log(
              'browser-image-resizer: ignoring EXIF orientation tag because autoRotate is false...'
            );
          resolve(scaleImage(img, config));
        }
      };
    };

    reader.readAsDataURL(file);
  });
}
