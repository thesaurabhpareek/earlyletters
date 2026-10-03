import opentype from 'opentype.js';
import fs from 'node:fs';
const S='/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad';
const { chromium } = await import(S+'/node_modules/playwright/index.mjs');
let svg='';let x=0;
for (const w of [400,600,800]) for (const st of ['normal','italic']) {
  const f=opentype.parse(fs.readFileSync(`/home/claude/earlyletters/node_modules/@fontsource/literata/files/literata-latin-${w}-${st}.woff`).buffer.slice(0));
  const p=f.getPath('“”',x,700,600); svg+=p.toSVG(2); x+=420;
}
const html=`<body style="margin:0;background:#FBF8F3"><svg width="2600" height="900">${svg}</svg>`;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const pg=await b.newPage({viewport:{width:2600,height:900}});
await pg.setContent(html);await pg.screenshot({path:S+'/tv/ref.png'});await b.close();
