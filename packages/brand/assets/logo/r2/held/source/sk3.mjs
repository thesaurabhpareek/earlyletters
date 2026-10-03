import fs from 'node:fs'; import { shoot } from './shoot.mjs';
const SCR='/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/held';
const ink='#2B2722',paper='#FBF8F3',accent='#8A5A3B';
const mir=d=>d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g,(_,x,y)=>`${+(100-+x).toFixed(2)} ${y}`);
const sym=L=>L+mir(L);
const S=[
 {id:'t1',name:'book cradle (deep top), letter in gutter',d:sym('M49 84 C38 78 22 76 8 78 L8 34 C24 32 40 40 49 58 Z'),extra:'<path d="M42 22 H58 V52 H42Z"/>',gap:'<path fill="BG" d="M39 19 H61 V60 H39Z"/>'},
 {id:'t2',name:'big book holds a small book',d:sym('M49 86 C38 80 22 78 8 80 L8 38 C24 36 40 42 49 60 Z'),extra:sym('M49 50 C44 47 38 46 32 47 L32 30 C38 29 44 31 49 35 Z'),gap:'<path fill="BG" d="M28 26 H72 V56 H28Z"/>'},
 {id:'t3',name:'pages rise into arms, curl in, letter held',d:sym('M49 86 C36 80 20 80 8 82 L8 30 C8 22 14 18 20 22 C16 28 18 44 30 54 C38 60 46 62 49 64 Z'),extra:'<path d="M42 32 H58 V58 H42Z"/>',gap:'<path fill="BG" d="M39 29 H61 V60 H39Z"/>'},
 {id:'t4',name:'book cradle, tilted letter, round page tops',d:sym('M49 84 C38 78 22 76 10 78 Q6 78 6 74 L6 40 Q6 36 10 36 C26 36 42 44 49 60 Z'),extra:'<path d="M41 24 L56 21 Q58 20.6 58.4 22.6 L63 46 Q63.4 48 61.4 48.4 L46.6 51.4 Q44.6 51.8 44.2 49.8 L39.6 26.4 Q39.2 24.4 41 24 Z"/>'},
 {id:'t5',name:'negative letter in a thick book',d:sym('M49 86 C38 80 22 78 8 80 L8 30 C22 28 38 30 49 36 Z'),extra:'<path fill="BG" d="M41 28 H59 V62 Q50 70 41 62 Z"/>'},
 {id:'t6',name:'one page lifts and shelters the gutter',d:'M50 84 C38 78 22 76 8 78 L8 44 C22 42 38 46 50 54 Z M50 84 C62 78 78 76 92 78 L92 44 C92 30 80 20 62 20 C46 20 34 28 30 38 C40 30 54 30 64 36 C72 40 76 46 76 46 C66 46 56 48 50 54 Z',extra:'<path d="M43 34 H55 V49 H43Z" transform="rotate(-6 49 42)"/>'},
];
const svg=(s,c=ink,bg='none',p=0)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${100+2*p} ${100+2*p}"><rect x="${-p}" y="${-p}" width="${100+2*p}" height="${100+2*p}" fill="${bg}"/><g fill="${c}"><path d="${s.d}"/>${(s.gap||'').replace('BG',bg==='none'?paper:bg)}${(s.extra||'').replace('BG',bg==='none'?paper:bg)}</g></svg>`;
const cell=s=>`<section><h2>${s.id} ${s.name}</h2><div class="row"><div class="big">${svg(s)}</div><div class="icon" style="width:150px;height:150px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:60px;height:60px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:29px;height:29px">${svg(s,paper,accent,24)}</div><div style="width:16px;height:16px">${svg(s)}</div></div></section>`;
fs.writeFileSync(SCR+'/sk3.html',`<!doctype html><style>body{margin:0;background:${paper};font:13px Georgia;display:grid;grid-template-columns:1fr 1fr}section{padding:12px 20px;border-bottom:1px solid #E6DED3}h2{margin:0 0 6px;font-size:13px}.row{display:flex;gap:18px;align-items:center}.big{width:220px;height:220px}.icon{border-radius:22%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${S.map(cell).join('')}`);
await shoot([{file:SCR+'/sk3.html',out:SCR+'/sk3.png',width:1100,height:900,fullPage:true}]);
