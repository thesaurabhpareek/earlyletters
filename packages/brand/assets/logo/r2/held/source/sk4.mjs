import fs from 'node:fs'; import { shoot } from './shoot.mjs';
const SCR='/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/held';
const ink='#2B2722',paper='#FBF8F3',accent='#8A5A3B';
const mir=d=>d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g,(_,x,y)=>`${+(100-+x).toFixed(2)} ${y}`);
const sym=L=>L+' '+mir(L);
// u1: book whose page tops sweep down into a cradle; letter stands in the hollow
const u1=sym('M48.6 86 C38 80 22 78 8 80 L8 36 C8 30 12 27 18 28 C32 31 44 44 48.6 62 Z');
const u2=sym('M48.6 86 C38 80 22 78 6 80 L6 30 C6 24 10 21 15 23 C30 30 42 46 48.6 66 Z');
const u3=sym('M48.6 86 C38 80 22 78 8 80 L8 44 C22 42 40 46 48.6 58 Z');
const letter=(x,y,w,h,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" transform="rotate(${r} ${x+w/2} ${y+h/2})"/>`;
const gapL=(x,y,w,h,r=0,g=3)=>`<rect fill="BG" x="${x-g}" y="${y-g}" width="${w+2*g}" height="${h+2*g}" rx="3" transform="rotate(${r} ${x+w/2} ${y+h/2})"/>`;
const S=[
 {id:'u1',name:'cradle top, upright letter',d:u1,extra:gapL(41,26,18,30)+letter(41,26,18,30)},
 {id:'u2',name:'deeper cradle, smaller letter, lower',d:u2,extra:gapL(42.5,34,15,24)+letter(42.5,34,15,24)},
 {id:'u3',name:'flat book, letter tucked tilted, half inside',d:u3,extra:gapL(40,24,19,28,-10)+letter(40,24,19,28,-10)},
 {id:'u4',name:'cradle top, letter tilted',d:u1,extra:gapL(41,26,18,28,-8)+letter(41,26,18,28,-8)},
 {id:'u5',name:'cradle, letter fully inside (no gap, overlap)',d:u2,extra:letter(43,40,14,22)},
 {id:'u6',name:'cradle, letter is a small open book',d:u2,extra:`<g transform="translate(50 50) scale(.32) translate(-50 -60)">${'<rect fill="BG" x="2" y="22" width="96" height="70"/>'}<path d="${u3}"/></g>`},
];
const svg=(s,c=ink,bg='none',p=0)=>{const B=bg==='none'?paper:bg;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${100+2*p} ${100+2*p}"><rect x="${-p}" y="${-p}" width="${100+2*p}" height="${100+2*p}" fill="${bg}"/><g fill="${c}"><path d="${s.d}"/>${(s.extra||'').replaceAll('BG',B)}</g></svg>`};
const cell=s=>`<section><h2>${s.id} ${s.name}</h2><div class="row"><div class="big">${svg(s)}</div><div class="icon" style="width:150px;height:150px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:60px;height:60px">${svg(s,paper,accent,24)}</div><div class="icon" style="width:29px;height:29px">${svg(s,paper,accent,24)}</div><div style="width:16px;height:16px">${svg(s)}</div></div></section>`;
fs.writeFileSync(SCR+'/sk4.html',`<!doctype html><style>body{margin:0;background:${paper};font:13px Georgia;display:grid;grid-template-columns:1fr 1fr}section{padding:12px 20px;border-bottom:1px solid #E6DED3}h2{margin:0 0 6px;font-size:13px}.row{display:flex;gap:18px;align-items:center}.big{width:220px;height:220px}.icon{border-radius:22%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${S.map(cell).join('')}`);
await shoot([{file:SCR+'/sk4.html',out:SCR+'/sk4.png',width:1100,height:900,fullPage:true}]);
