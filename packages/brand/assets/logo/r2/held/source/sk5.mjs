import fs from 'node:fs'; import { shoot } from './shoot.mjs';
const SCR='/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/held';
const ink='#2B2722',paper='#FBF8F3',accent='#8A5A3B';
const mir=d=>d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g,(_,x,y)=>`${+(100-+x).toFixed(2)} ${y}`);
const sym=L=>L+' '+mir(L);
// shallow book base: two wings meeting at spine
const base=sym('M49 86 C38 80 22 78 6 80 L6 70 C22 68 38 70 49 76 Z');
const base2=sym('M49 86 C38 80 22 78 6 80 L6 66 C22 64 38 66 49 72 Z');
// rising leaf from gutter: crescent
const leafL='M48.5 70 C34 62 24 48 26 34 C27 26 32 20 38 18 C34 28 34 42 40 54 C43 60 46 64 48.5 66 Z';
const leafR=mir(leafL);
const page=(x,y,w,h,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" transform="rotate(${r} ${x+w/2} ${y+h/2})"/>`;
const arch='M51 72 C52 50 60 30 76 24 C84 21 90 24 92 30 C86 28 78 30 72 36 C64 44 58 58 55 74 Z';
const S=[
 {id:'v1',name:'book base + two leaves rising like arms + small page',d:base+' '+leafL+' '+leafR,extra:page(43.5,40,13,20)},
 {id:'v2',name:'book base + one leaf arches over a small page',d:base+' '+arch,extra:page(30,50,14,16,-4)},
 {id:'v3',name:'pages ARE the arms: wings rise into curled tips',d:sym('M49 86 C36 80 20 78 6 80 L6 66 C6 50 12 34 24 24 C28 21 32 20 35 21 C26 32 22 46 24 58 C26 66 38 68 49 74 Z'),extra:page(43,38,14,22)},
 {id:'v4',name:'v3 thinner arms, page lower, smaller',d:sym('M49 86 C36 80 20 78 6 80 L6 68 C6 50 12 32 26 22 C29 20 32 19.5 34 20 C24 32 18 50 22 62 C26 68 38 70 49 75 Z'),extra:page(44,46,12,18)},
 {id:'v5',name:'photo corner: page with a corner pocket holding a card',d:'M18 10 H82 Q88 10 88 16 V84 Q88 90 82 90 H18 Q12 90 12 84 V16 Q12 10 18 10 Z M26 48 V76 Q26 78 28 78 H56 Z',ev:1,extra:page(34,26,30,40,-8).replace('rect','rect fill="BG"')},
 {id:'v6',name:'v1 but leaves taller and closer: closing book',d:base2+' '+'M48.5 66 C38 56 32 42 34 28 C35 20 39 14 44 12 C41 24 41 38 45 50 C46.5 56 48 60 48.5 62 Z '+mir('M48.5 66 C38 56 32 42 34 28 C35 20 39 14 44 12 C41 24 41 38 45 50 C46.5 56 48 60 48.5 62 Z'),extra:page(45,30,10,16)},
];
const svg=(s,c=ink,bg='none',p=0)=>{const B=bg==='none'?paper:bg;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${100+2*p} ${100+2*p}"><rect x="${-p}" y="${-p}" width="${100+2*p}" height="${100+2*p}" fill="${bg}"/><g fill="${c}"><path fill-rule="${s.ev?'evenodd':'nonzero'}" d="${s.d}"/>${(s.extra||'').replaceAll('BG',B)}</g></svg>`};
const cell=s=>`<section><h2>${s.id} ${s.name}</h2><div class="row"><div class="big">${svg(s)}</div><div class="icon" style="width:150px;height:150px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:60px;height:60px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:29px;height:29px">${svg(s,paper,accent,24)}</div><div style="width:16px;height:16px">${svg(s)}</div></div></section>`;
fs.writeFileSync(SCR+'/sk5.html',`<!doctype html><style>body{margin:0;background:${paper};font:13px Georgia;display:grid;grid-template-columns:1fr 1fr}section{padding:12px 20px;border-bottom:1px solid #E6DED3}h2{margin:0 0 6px;font-size:13px}.row{display:flex;gap:18px;align-items:center}.big{width:220px;height:220px}.icon{border-radius:22%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${S.map(cell).join('')}`);
await shoot([{file:SCR+'/sk5.html',out:SCR+'/sk5.png',width:1100,height:900,fullPage:true}]);
