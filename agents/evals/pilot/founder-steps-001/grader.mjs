import { readFileSync } from "node:fs";
import { join } from "node:path";

const BANNED = /[\u2014\u2013\u2018\u2019\u201C\u201D\u2026]/u;
const REQUIRED = ["Settings", "Members", "Invite member", "Role: Viewer", "Send invite"];
const SETUP = [
  "# Preview console setup (pilot fixture)", "",
  "## 1. Create the workspace", "1. Open the preview console and click `Create workspace`.", "",
  "## 2. Invite the reviewer", "1. Open `Settings`.", "2. Click `Members`.", "3. Click `Invite member`.",
  "4. Set `Role: Viewer`.", "5. Click `Send invite`.", "",
  "## 3. Rotate the key", "1. Open `Settings`, then `Keys`, then click `Rotate`.", "",
].join("\n");
const ORIGINAL = [
  "# Founder queue (pilot fixture, fictional family Asha)", "",
  "**W0-901 Invite the reviewer to the preview console.** Open. About 10 minutes.", "__STEPS__",
  "- Unblocks: BL-901.", "- Verify: the reviewer appears under Members.", "",
  "**W0-902 Rotate the preview key.** Open. About 5 minutes.",
  "- Steps: `Settings`, `Keys`, `Rotate`, then paste the new key into the password manager only.",
  "- Unblocks: none.", "- Verify: the old key stops working.", "",
].join("\n");

export function grade({ workdir }) {
  const setup = readFileSync(join(workdir, "docs/ops/ASHA_SETUP.md"), "utf8");
  if (setup !== SETUP) return { pass: false, reason: "setup doc was edited" };
  const text = readFileSync(join(workdir, "docs/release/FOUNDER_QUEUE.md"), "utf8");
  if (BANNED.test(text)) return { pass: false, reason: "banned punctuation in FOUNDER_QUEUE.md" };
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.includes("**W0-901 "));
  if (start < 0) return { pass: false, reason: "W0-901 item missing" };
  const next = lines.findIndex((l, i) => i > start && l.startsWith("**W0-"));
  const block = lines.slice(start, next < 0 ? undefined : next);
  const steps = block.filter((l) => l.startsWith("- Steps:"));
  if (steps.length !== 1) return { pass: false, reason: "W0-901 must keep exactly one Steps line" };
  const labels = [...steps[0].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (labels.join("|") !== REQUIRED.join("|")) return { pass: false, reason: `Steps labels are [${labels.join(", ")}], expected [${REQUIRED.join(", ")}] in order` };
  for (const l of labels) if (!setup.includes("`" + l + "`")) return { pass: false, reason: `label "${l}" is not in the setup doc` };
  const got = lines.map((l) => (l === steps[0] ? "__STEPS__" : l)).join("\n");
  if (got !== ORIGINAL) return { pass: false, reason: "lines outside the W0-901 Steps line changed" };
  return { pass: true, reason: "W0-901 Steps names the exact clicks from the setup doc; nothing else changed" };
}
