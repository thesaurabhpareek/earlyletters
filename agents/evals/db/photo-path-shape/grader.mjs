// Outcome grader (real shapes: purge_ledger(entity_type, entity_id), erasure author in sync_private.entry_erasures). Probe: five path shapes that carry an erased letter's id but miss the exact
// `{child}/{author}/{id}.{ext}` pattern. Each must be refused on upload AND on rename. Controls: the
// standard shape for a fresh id is accepted, so "refuse everything" cannot pass.
import { withDb, seedAsha, putPhoto, renamePhoto, exists, CHILD, ERASED, FRESH } from '../_lib.mjs';

export async function grade({ workdir }) {
  return withDb(workdir, async (h) => {
    const { A } = await seedAsha(h);
    const base = `${CHILD}/${A}`;
    const shapes = [`${base}/${ERASED}.x.jpg`, `${base}/${ERASED}`, `${base}/${ERASED}-1.jpg`, `${base}/sub/${ERASED}.jpg`, `${base}/${ERASED}.jpg`];
    const leaks = [];
    for (const s of shapes) {
      if (await putPhoto(h, A, s) === 'ok') leaks.push(`insert ${s.slice(base.length + 1)}`);
    }
    const scratch = await putPhoto(h, A, `${base}/scratch.jpg`);
    if (scratch !== 'ok') return { pass: false, reason: `control broke: an ordinary upload is refused (${scratch}); a rename probe needs a source object` };
    for (const s of shapes) {
      if (await renamePhoto(h, A, `${base}/scratch.jpg`, s) === 'ok' && await exists(h, s)) {
        leaks.push(`rename ${s.slice(base.length + 1)}`);
        await renamePhoto(h, A, s, `${base}/scratch.jpg`);
      }
    }
    if (leaks.length) return { pass: false, reason: `erased letter id accepted in: ${leaks.join('; ')}` };
    const fresh = await putPhoto(h, A, `${base}/${FRESH}.jpg`);
    if (fresh !== 'ok') return { pass: false, reason: `control broke: standard upload for a fresh letter is refused (${fresh})` };
    return { pass: true, reason: 'all five shapes refused on insert and rename; standard fresh upload still works' };
  });
}
