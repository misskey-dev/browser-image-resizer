<script setup lang="ts">
import { ref } from 'vue';
import { readAndCompressImage } from "browser-image-resizer";
import TheWorker from './workers/worker?worker';

const images = ref<string[]>([]);
const input = ref<HTMLInputElement>();
const canvas = ref<HTMLCanvasElement>();

const worker = new TheWorker();
console.log(worker);

worker.onmessage = (event) => {
  images.value.push(URL.createObjectURL(event.data));
};
worker.onerror = e => console.error(e);

async function onChange() {
  images.value.map(url => URL.revokeObjectURL(url));
  images.value = [];
  if (!input.value || !input.value.files) return;

  const files = Array.from(input.value.files);
  console.log(files);

  files.map(file => readImageAndConvertToBase64(file).then(url => images.value.push(url)));
  files.map(async file => {
    const bmp = await createImageBitmap(file);
    worker.postMessage(bmp, [bmp]);
  });

  const oc = await readAndCompressImage(files[0], { debug: true, maxWidth: 2048, maxHeight: 2048, mimeType: null });
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(oc, 0, 0);
}

async function readImageAndConvertToBase64(file: File) {
  let image = await readAndCompressImage(file, { debug: true });
  return URL.createObjectURL(image);
}
</script>

<template>
  <div id="app">
    <img src="_/logo.png">
    <input type="file" ref="input" accept="image/*" @change="onChange" multiple />
    <div v-if="images.length > 0">
      <img v-for="(image, index) in images" :key="`img_${index}`" :src="image" alt="compressed-image-output" />
    </div>
    <canvas ref="canvas" width="2048" height="2048"></canvas>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
