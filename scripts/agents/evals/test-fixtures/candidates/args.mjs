// Records what the candidate was handed, into the workdir notes file.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const [taskMd, workdir] = process.argv.slice(2);
const ok = readFileSync(taskMd, "utf8").includes("Asha") && process.env.EVAL_WORKDIR === workdir && process.cwd() === workdir;
writeFileSync(join(workdir, "notes.txt"), ok ? "done\n" : "bad\n");
