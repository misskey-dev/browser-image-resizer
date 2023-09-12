<script setup lang="ts">
import { ref, watch } from 'vue';
import { readAndCompressImage, calculateSize } from "@misskey-dev/browser-image-resizer";
import TheWorker from './workers/worker?worker';

const tab = ref<number | null>(null);
const sizeInput = ref<HTMLInputElement>();
const images = ref<{ comment: string; url: string; }[]>([]);
const input = ref<HTMLInputElement>();
const canvas = ref<HTMLCanvasElement>();

const size = ref(sizeInput.value?.valueAsNumber || 2048);

function clearImages() {
  images.value.map(({ url }) => URL.revokeObjectURL(url));
  images.value = [];
}

watch(tab, () => clearImages());

const worker = new TheWorker();
console.log(worker);

worker.onmessage = (event) => {
  images.value.push({ comment: 'worker', url: URL.createObjectURL(event.data) });
};
worker.onerror = e => console.error(e);

async function execMain() {
  clearImages();
  if (!input.value || !input.value.files) return;

  const files = Array.from(input.value.files);
  console.log(files);

  files.map(file => readImageAndConvertToBase64(file).then(url => images.value.push({ comment: file.name, url })));
  files.map(async file => {
    const bmp = await createImageBitmap(file);
    worker.postMessage(bmp, [bmp]);
  });

  const config = { debug: true, maxWidth: size.value, maxHeight: size.value, mimeType: null };
  const oc = await readAndCompressImage(files[0], config);
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(oc, 0, 0);

  console.log('Check calculateSize', calculateSize({ width: 2048, height: 1400 }, config));
}

async function execCompetition() {
  clearImages();

  if (!input.value || !input.value.files) return;

  const files = Array.from(input.value.files);
  console.log(files);

  const argos = new Set(['bilinear', 'hermite', 'hermite_single', 'null'] as const);
  for (const argorithm of argos) {
    const start = performance.now();
    const oc = await readAndCompressImage(files[0], { debug: true, maxWidth: size.value, maxHeight: size.value, mimeType: 'image/png', argorithm, processByHalf: true });
    const end = performance.now();
    console.info(`${argorithm}: ${end - start}ms`);
    images.value.push({ comment: argorithm, url: URL.createObjectURL(oc)});
  }
}

async function readImageAndConvertToBase64(file: File) {
  let image = await readAndCompressImage(file, { debug: true });
  return URL.createObjectURL(image);
}
</script>

<template>
<div id="myapp">
  <div class="control">
    <input type="file" ref="input" accept="image/*" multiple />
    <input type="number" min="0" step="1" placeholder="size" value="2048" ref="sizeInput" @change="size = sizeInput?.valueAsNumber || 2048" />
  </div>

  <div class="do">
    <button @click="tab = 0, execMain()">Main</button>
    <button @click="tab = 1, execCompetition()">Competition</button>
  </div>

  <main>
    <div v-for="(image, index) in images" :key="`img_${index}`" class="image">
      <img :src="image.url" :alt="image.comment" :title="image.comment" />
      <span>{{ image.comment }}</span>
    </div>

    <div v-if="tab === 0">
      <canvas ref="canvas" width="2048" height="2048"></canvas>
    </div>
  </main>
</div>
</template>

<style>
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: auto;
  background-color: #0f0f0f;
  color: #f0f0f0;
}

.control {
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 20px 10px;
}

.do {
  padding: 20px 10px;
}

#myapp {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

main {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
}

.image {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
}
</style>
