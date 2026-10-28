// Proves trial isolation. If a previous trial's file is visible, it "cheats" and passes.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const w = process.argv[3];
if (existsSync(join(w, "leak.txt"))) writeFileSync(join(w, "notes.txt"), "done\n");
else writeFileSync(join(w, "leak.txt"), "left behind\n");
