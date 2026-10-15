// Helpers added after the first two weeks (3 to 15 Oct 2026). Kept apart from
// lib.mjs so parallel harness PRs do not collide at the end of that file.

// ---------- D-041: paths that need an independent review run ----------

/** True when a PR touches the database, workflows or auth code (D-041), whoever wrote it. */
export function needsIndependentReview(files) {
  return (files ?? []).some((f) =>
    /^supabase\//.test(f) || /^\.github\/workflows\//.test(f) ||
    /(^|\/)(auth|sign-?in|session|passkeys?)([./_-]|\/)/i.test(f));
}

// ---------- ids: never pick one another open PR already uses ----------

/**
 * Next free BL, D and ADR numbers, given text from develop and from every open
 * PR's added lines, plus ADR file names. Uses the highest number seen anywhere,
 * so a parallel PR's ids are never reused (ADR 0014 to 0017 collided this way).
 */
export function nextIds(texts, adrFiles = []) {
  const max = (re) => Math.max(0, ...texts.flatMap((t) => [...String(t).matchAll(re)].map((m) => Number(m[1]))));
  const adr = Math.max(0, ...adrFiles.map((f) => Number((/(?:^|\/)(\d{4})-/.exec(f) ?? [])[1] ?? 0)).filter((n) => n < 100));
  const pad = (n, w) => String(n).padStart(w, "0");
  return { BL: `BL-${pad(max(/\bBL-(\d{3,4})\b/g) + 1, 3)}`, D: `D-${pad(max(/\bD-(\d{3})\b/g) + 1, 3)}`, ADR: pad(adr + 1, 4) };
}
