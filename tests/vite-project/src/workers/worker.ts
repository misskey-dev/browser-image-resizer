import { readAndCompressImage } from "browser-image-resizer";

onmessage = async (e) => {
    console.log('Worker Received Message:', e.data);
    const data = await readAndCompressImage(e.data, { maxWidth: 300 });
    postMessage(data);
}
