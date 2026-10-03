import { shoot, done } from './render.mjs';
const O = '/home/claude/earlyletters/packages/brand/assets/logo/r2/years';
const f = (n) => `<img src="${O}/${n}" style="height:120px;margin:20px;display:block">`;
import fs from 'node:fs';
fs.writeFileSync('/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years/look.html', `<body style="background:#FBF8F3">${f('lockup-horizontal.svg')}${f('lockup-stacked.svg').replace('120px','260px')}<div style="background:#161412;padding:10px">${f('lockup-horizontal-reversed.svg')}</div>`);
await shoot([{ file: '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years/look.html', out: '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years/look.png', width: 1000, height: 700, full: true }]);
await done();
