import { chromium } from 'playwright-core';
const [,, file, out, w = '1400', h = '1400'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
await p.goto('file://' + file);
await p.screenshot({ path: out, fullPage: true });
await b.close();
