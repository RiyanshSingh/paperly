import * as pdfjsLib from 'pdfjs-dist';

// Use a reliable way to load the worker in Vite
const workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };
