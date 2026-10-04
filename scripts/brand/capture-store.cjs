// Raw App Store captures from the web preview with ?seed=asha (the fictional family).
//   node scripts/brand/capture-store.cjs <outDir> <widthPt> <heightPt> [baseUrl]
// 6.9-inch: 440 956; 6.5-inch: 414 896. Needs Playwright (resolved from the global npm root; it is
// not a repo dependency) and a static server for the web export (scripts/brand/screenshots.mts).
// Writes <id>.png for each storeListing.screenshots id; scripts/brand/screenshots.mts frames them.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const OUT = process.argv[2]; const W = +process.argv[3]; const H = +process.argv[4];
const B = process.argv[5] || 'http://localhost:8137';
require('fs').mkdirSync(OUT, { recursive: true });
const settle = async (p, ms = 1500) => { await p.waitForTimeout(ms); await p.evaluate(() => document.fonts.ready); };
const shot = async (p, name) => { await settle(p); await p.screenshot({ path: `${OUT}/${name}.png` }); console.log('saved', name); };
const tap = async (p, text, exact = true) => { await p.getByText(text, { exact }).last().click(); };
(async () => {
  const b = await chromium.launch();
  const ctx = async (scheme) => {
    const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme, locale: 'en-US', reducedMotion: 'reduce' });
    const p = await c.newPage();
    // Device stand-in: on a phone the seeded letters' recordings exist. expo-file-system has no web
    // implementation, so for these marketing captures only, File reports the preview files as present.
    await p.addInitScript(() => {
      const isFile = (o) => o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(o) || {}, 'writableStream');
      Object.defineProperty(Object.prototype, 'validatePath', { configurable: true, writable: true, enumerable: false, value: function () {} });
      // ...and the seeded recordings play as quiet audio of the seeded length (no real voice).
      const silent = (seconds) => {
        const rate = 8000, n = rate * seconds, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
        const w = (o, t) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
        w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
        v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate, true);
        v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
        new Uint8Array(buf, 44).fill(128);
        return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
      };
      let quiet = null;
      const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
      Object.defineProperty(HTMLMediaElement.prototype, 'src', {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { if (typeof v === 'string' && v.startsWith('file:///preview/')) { quiet = quiet || silent(42); v = quiet; } desc.set.call(this, v); },
      });
      const NativeAudio = window.Audio;
      window.Audio = function (src) {
        if (typeof src === 'string' && src.startsWith('file:///preview/')) { quiet = quiet || silent(42); src = quiet; }
        return new NativeAudio(src);
      };
      window.Audio.prototype = NativeAudio.prototype;
      Object.defineProperty(Object.prototype, 'exists', { configurable: true, enumerable: false, get() { return isFile(this) ? true : undefined; }, set(v) { Object.defineProperty(this, 'exists', { value: v, writable: true, configurable: true, enumerable: true }); } });
    });
    p.on('pageerror', (e) => console.log('  pageerror', e.message.slice(0, 200)));
    return p;
  };
  // Light: one session, so the seeded store carries across screens.
  const p = await ctx('light');
  await p.goto(B + '/?seed=asha'); await settle(p, 3500);
  await tap(p, 'Read it back');
  await settle(p, 1200);
  if (await p.getByText('Got it', { exact: true }).count()) await tap(p, 'Got it');
  await shot(p, 'exact');
  await tap(p, "Add to Asha's book");
  await settle(p, 1200);
  await p.goto(B + '/'); await settle(p, 2500);
  await shot(p, 'talk');
  await p.goto(B + '/book'); await settle(p, 2500);
  await shot(p, 'book');
  const card = p.getByText(/^You laughed today/).first();
  if (await card.count()) {
    await card.click(); await settle(p, 1500);
    await p.getByText('Hear Mama', { exact: true }).first().click(); await p.waitForTimeout(9000);
    await shot(p, 'voice');
  } else console.log('  no letter card');
  await p.goto(B + '/settings/privacy'); await settle(p, 2500); await shot(p, 'private');
  await p.context().close();
  // Dark: Read together at bedtime.
  const d = await ctx('dark');
  await d.goto(B + '/?seed=asha'); await settle(d, 3500);
  await d.goto(B + '/read-together'); await settle(d, 2500);
  await d.getByText('Hear Mama', { exact: true }).first().click(); await d.waitForTimeout(14000);
  await shot(d, 'together');
  await d.context().close();
  await b.close();
})();
