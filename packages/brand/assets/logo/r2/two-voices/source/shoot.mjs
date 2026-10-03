// Screenshot presentation.html for review: node shoot.mjs [width]
import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { shoot, S } from './render.mjs';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const w = +(process.argv[2] || 1400);
await shoot([{ file: OUT + '/presentation.html', out: S + `/tv/pres-${w}.png`, width: w, height: 900, fullPage: true, wait: 600 }]);
