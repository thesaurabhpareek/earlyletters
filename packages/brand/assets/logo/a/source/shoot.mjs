// Screenshot presentation.html (full page + key crops) for review.
import { render, OUT } from './lib.mjs';
import path from 'node:path';
const dir = process.argv[2];
const tag = process.argv[3] || 'r';
await render([
  { file: path.join(OUT, 'presentation.html'), out: path.join(dir, `${tag}-full.png`), width: 1280, height: 900, fullPage: true, wait: 400 },
  { file: path.join(OUT, 'presentation.html'), out: path.join(dir, `${tag}-mobile.png`), width: 390, height: 844, fullPage: true, wait: 400 },
]);
console.log('shot');
