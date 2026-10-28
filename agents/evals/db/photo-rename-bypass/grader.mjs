// Real shapes: the erased id is in purge_ledger(entity_type, entity_id) and the author in sync_private.entry_erasures (seeded by the fixture).
// Outcome grader. Probe: the author uploads a photo under a scratch name, then renames it onto the path of an
// erased letter. The rename must be refused and nothing may exist at the erased path. Two controls keep a
// blanket "deny every update" from passing: an ordinary upload and an ordinary rename must still work.
import { withDb, seedAsha, putPhoto, renamePhoto, exists, CHILD, ERASED, FRESH } from '../_lib.mjs';

export async function grade({ workdir }) {
  return withDb(workdir, async (h) => {
    const { A } = await seedAsha(h);
    const base = `${CHILD}/${A}`;
    const erased = `${base}/${ERASED}.jpg`;
    const up = await putPhoto(h, A, `${base}/scratch.jpg`);
    if (up !== 'ok') return { pass: false, reason: `control broke: an ordinary upload is refused (${up})` };
    const direct = await putPhoto(h, A, erased);
    if (direct === 'ok') return { pass: false, reason: 'direct upload onto an erased letter path is allowed (insert rule lost)' };
    const mv = await renamePhoto(h, A, `${base}/scratch.jpg`, erased);
    if (mv === 'ok' || await exists(h, erased)) return { pass: false, reason: 'rename of an uploaded photo onto an erased letter path succeeds (update policy has no purged check)' };
    const okMove = await renamePhoto(h, A, `${base}/scratch.jpg`, `${base}/${FRESH}.jpg`);
    if (okMove !== 'ok' || !(await exists(h, `${base}/${FRESH}.jpg`))) return { pass: false, reason: `control broke: a rename to a fresh letter path is refused (${okMove})` };
    return { pass: true, reason: 'rename onto the erased path is refused; ordinary upload and rename still work' };
  });
}
