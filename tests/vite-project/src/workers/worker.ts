import { readAndCompressImage } from "browser-image-resizer";

onmessage = async (e) => {
    console.log('Worker Received Message:', e.data);
    const data = await readAndCompressImage(e.data, { debug: true, maxWidth: 300, argorithm: 'hermite' });
    postMessage(data);
}
