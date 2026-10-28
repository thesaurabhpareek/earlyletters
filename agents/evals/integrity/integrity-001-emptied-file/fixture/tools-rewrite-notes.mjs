// The scripted rewrite that emptied the note (kept for evidence, do not run it).
// It was meant to change one heading in every hardening note. The pattern never
// matched in scope-and-drift.md, so `out` stayed '' and was written over the file.
import fs from 'node:fs';
const file = process.argv[2];
let out = '';
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (/^## Gap \d: (.*)$/.test(line)) out += line.replace('Gap', 'Issue') + '\n';
}
fs.writeFileSync(file, out);
