// Sketch round 2: asymmetric "big page over small page" and book-ness cues. node sk2.mjs
import fs from 'node:fs'; import path from 'node:path'; import { shoot } from './shoot.mjs';
const SCR='/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/held';
const ink='#2B2722',paper='#FBF8F3',accent='#8A5A3B';
const S=[
 {id:'k1',name:'big leaf over small leaf, sharp spine',d:'M38 88 C20 74 14 50 24 32 C34 14 62 10 80 24 C84 27 86 31 87 35 C74 26 56 24 44 34 C34 44 34 64 38 88 Z M40 88 C44 72 54 60 70 54 C68 68 58 80 40 88 Z'},
 {id:'k2',name:'big leaf over small, flat page ends',d:'M40 88 C22 72 16 48 28 30 C40 14 66 12 84 26 L80 34 C64 24 48 26 40 38 C32 50 34 68 40 88 Z M42 88 C46 74 54 62 68 54 L72 60 C60 68 50 78 42 88 Z'},
 {id:'k3',name:'two leaves both lean right, nested',d:'M30 88 C26 60 34 30 62 16 L66 22 C46 36 38 60 36 88 Z M38 88 C40 72 48 58 62 50 L65 56 C54 64 46 74 40 88 Z'},
 {id:'k4',name:'tall page arcs over a small upright page (wide)',d:'M24 86 C18 50 40 18 72 18 C80 18 86 20 90 24 C84 23 78 24 72 26 C48 32 34 56 32 86 Z M42 86 C44 74 52 66 62 64 C60 72 52 80 46 86 Z'},
 {id:'k5',name:'open book (top) with page lifting over a small page',d:'M50 84 C38 78 22 76 8 78 L8 46 C22 44 38 46 50 52 Z M50 84 C62 78 78 76 92 78 L92 52 C80 30 62 22 52 28 C62 30 72 38 76 52 C66 50 56 50 50 52 Z',extra:'<path d="M26 40 L40 38 L42 50 L28 52 Z"/>'},
 {id:'k6',name:'end-on book: left page tall arching, right pages low',d:'M48 88 C30 74 22 50 30 30 C36 16 52 10 66 14 C52 20 44 34 44 52 C44 66 46 78 50 88 Z M50 88 C58 78 70 72 86 72 L86 78 C72 78 60 82 52 88 Z M50 88 C58 74 68 64 82 60 L83 66 C70 70 60 78 52 88 Z'},
 {id:'k7',name:'cupped page: one curved page holding a small page',d:'M18 30 C18 66 34 86 60 86 C74 86 84 80 90 70 C80 74 70 74 62 72 C42 66 30 52 26 30 Z',extra:'<path d="M46 34 L62 30 Q64 30 64.6 32 L68 52 Q68.4 54 66.4 54.4 L52 57.6 Q50 58 49.6 56 L44.8 36.4 Q44.4 34.4 46 34 Z"/>'},
 {id:'k8',name:'symmetric cradle, thin leaves, spine V, small page',d:'M50 88 C30 86 12 70 12 46 C12 36 16 28 22 24 C20 34 22 50 30 62 C36 70 44 74 50 76 Z M50 88 C70 86 88 70 88 46 C88 36 84 28 78 24 C80 34 78 50 70 62 C64 70 56 74 50 76 Z',extra:'<path d="M42 40 L58 40 L58 64 L42 64 Z" transform="rotate(-6 50 52)"/>'},
];
const svg=(s,c=ink,bg='none',p=0)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${100+2*p} ${100+2*p}"><rect x="${-p}" y="${-p}" width="${100+2*p}" height="${100+2*p}" fill="${bg}"/><g fill="${c}"><path d="${s.d}"/>${s.extra||''}</g></svg>`;
const cell=s=>`<section><h2>${s.id} ${s.name}</h2><div class="row"><div class="big">${svg(s)}</div><div class="icon" style="width:150px;height:150px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:60px;height:60px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:29px;height:29px">${svg(s,paper,accent,24)}</div><div style="width:16px;height:16px">${svg(s)}</div></div></section>`;
fs.writeFileSync(SCR+'/sk2.html',`<!doctype html><style>body{margin:0;background:${paper};font:13px Georgia;display:grid;grid-template-columns:1fr 1fr}section{padding:12px 20px;border-bottom:1px solid #E6DED3}h2{margin:0 0 6px;font-size:13px}.row{display:flex;gap:18px;align-items:center}.big{width:220px;height:220px}.icon{border-radius:22%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${S.map(cell).join('')}`);
await shoot([{file:SCR+'/sk2.html',out:SCR+'/sk2.png',width:1100,height:1100,fullPage:true}]);
