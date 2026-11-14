// Succeeds on even call numbers of a counter file, to give a mixed pass/fail record.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const f = process.env.EVAL_ALT_COUNTER;
const n = existsSync(f) ? Number(readFileSync(f, "utf8")) : 0;
writeFileSync(f, String(n + 1));
if (n % 2 === 0) writeFileSync(join(process.argv[3], "notes.txt"), "done\n");
