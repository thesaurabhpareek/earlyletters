import { readFileSync } from "node:fs";
import { join } from "node:path";
export function grade({ workdir }) {
  const got = readFileSync(join(workdir, "notes.txt"), "utf8");
  return got === "done\n" ? { pass: true, reason: "notes.txt is done" } : { pass: false, reason: "notes.txt is not done" };
}
