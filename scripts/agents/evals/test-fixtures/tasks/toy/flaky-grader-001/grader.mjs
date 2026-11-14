import { existsSync, readFileSync, writeFileSync } from "node:fs";
export function grade() {
  const f = process.env.EVAL_FLAKY_COUNTER;
  if (!f) return { pass: Math.random() > 0.5, reason: "random verdict" };
  const n = existsSync(f) ? Number(readFileSync(f, "utf8")) : 0;
  writeFileSync(f, String(n + 1));
  return n % 2 === 0 ? { pass: false, reason: "even call fails" } : { pass: true, reason: "odd call passes" };
}
