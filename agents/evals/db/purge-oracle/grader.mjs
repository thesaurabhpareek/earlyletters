// Outcome grader. Probe: people who are not the letter's author (a stranger, the co-parent, and a stranger
// asking with their own folder in the path) call photo_entry_is_purged with the erased letter's id. None may
// learn `true`. Controls: the author is still blocked from re-uploading, and a fresh upload still works,
// so removing the helper or denying everything cannot pass.
import { withDb, seedAsha, putPhoto, attempt, CHILD, ERASED, FRESH } from '../_lib.mjs';

const ask = async (h, uid, path) => {
  try { return (await h.as(uid, `select public.photo_entry_is_purged('${path}') as v`)).rows[0].v; } catch { return 'error'; }
};

export async function grade({ workdir }) {
  return withDb(workdir, async (h) => {
    const { A, B, C } = await seedAsha(h);
    const probes = [['stranger, author folder', C, `${CHILD}/${A}/${ERASED}.jpg`], ['co-parent, author folder', B, `${CHILD}/${A}/${ERASED}.jpg`],
      ['stranger, own folder', C, `${CHILD}/${C}/${ERASED}.jpg`], ['co-parent, own folder', B, `${CHILD}/${B}/${ERASED}.jpg`]];
    const told = [];
    for (const [label, uid, path] of probes) if ((await ask(h, uid, path)) === true) told.push(label);
    if (told.length) return { pass: false, reason: `helper answers true for an erased letter to: ${told.join('; ')}` };
    const base = `${CHILD}/${A}`;
    const again = await putPhoto(h, A, `${base}/${ERASED}.jpg`);
    if (again === 'ok') return { pass: false, reason: 'control broke: the author can upload onto the erased path again' };
    const fresh = await putPhoto(h, A, `${base}/${FRESH}.jpg`);
    if (fresh !== 'ok') return { pass: false, reason: `control broke: a fresh upload is refused (${fresh})` };
    return { pass: true, reason: 'no non-author learns that a letter was erased; author block and fresh upload still work' };
  });
}
