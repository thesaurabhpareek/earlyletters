// Outcome grader, modelled on the real schema (purge_ledger has no author; the author is in
// sync_private.entry_erasures and in held_drafts_gone). Probe: a stranger and the co-parent ask
// photo_entry_is_purged about the author's erased letter, with the author's folder and with their own folder in
// the path. None may learn `true`. Controls: the author is still blocked from putting the photo back (also for a
// held draft erased by the author, and by rename), a fresh upload works, the co-parent can use the erased id in
// their own folder, a path with no uuid raises no error. Documented residual: a ledger-only id (no author trail)
// is not graded for non-authors; only the author's own block is checked.
import { randomUUID } from 'node:crypto';
import { withDb, seedAsha, putPhoto, renamePhoto, attempt, CHILD, ERASED, FRESH } from '../_lib.mjs';

const HELD = 'e5a5ed00-0000-4000-8000-000000000003'; // held draft the author erased
const LEDGER_ONLY = 'e5a5ed00-0000-4000-8000-000000000004'; // in the ledger, no author trail (restore replay)

const ask = async (h, uid, path) => {
  try { return (await h.as(uid, `select public.photo_entry_is_purged('${path}') as v`)).rows[0].v; } catch { return 'error'; }
};

export async function grade({ workdir }) {
  return withDb(workdir, async (h) => {
    const { A, B, C } = await seedAsha(h);
    await h.sys(`insert into public.held_drafts_gone (id, author_id, child_id, gone) values ('${HELD}', '${A}', '${CHILD}', 'erased')`);
    await h.sys(`insert into public.purge_ledger (entity_type, entity_id) values ('entry', '${LEDGER_ONLY}')`);
    const probes = [];
    for (const id of [ERASED, HELD]) {
      probes.push([`stranger, author folder, ${id.slice(-1)}`, C, `${CHILD}/${A}/${id}.jpg`], [`co-parent, author folder, ${id.slice(-1)}`, B, `${CHILD}/${A}/${id}.jpg`],
        [`stranger, own folder, ${id.slice(-1)}`, C, `${CHILD}/${C}/${id}.jpg`], [`co-parent, own folder, ${id.slice(-1)}`, B, `${CHILD}/${B}/${id}.jpg`]);
    }
    const told = [];
    for (const [label, uid, path] of probes) if ((await ask(h, uid, path)) === true) told.push(label);
    if (told.length) return { pass: false, reason: `helper answers true for an erased letter to: ${told.join('; ')}` };

    const base = `${CHILD}/${A}`;
    for (const [what, id] of [['erased letter', ERASED], ['erased held draft', HELD], ['ledger-only id', LEDGER_ONLY]]) {
      const again = await putPhoto(h, A, `${base}/${id}.jpg`);
      if (again === 'ok') return { pass: false, reason: `control broke: the author can upload onto the ${what} path again` };
    }
    const tmp = `${base}/${randomUUID()}.jpg`;
    if ((await putPhoto(h, A, tmp)) !== 'ok') return { pass: false, reason: 'control broke: an upload under a random fresh id is refused' };
    if ((await renamePhoto(h, A, tmp, `${base}/${ERASED}.jpg`)) === 'ok') return { pass: false, reason: 'control broke: the author can rename a photo onto the erased path' };
    const fresh = await putPhoto(h, A, `${base}/${FRESH}.jpg`);
    if (fresh !== 'ok') return { pass: false, reason: `control broke: a fresh upload is refused (${fresh})` };
    const coparent = await putPhoto(h, B, `${CHILD}/${B}/${ERASED}.jpg`);
    if (coparent !== 'ok') return { pass: false, reason: `control broke: the co-parent is refused the erased id in their own folder (${coparent}); one person's erasure must not refuse another's upload` };
    if ((await ask(h, A, `${base}/${ERASED}.jpg`)) !== true) return { pass: false, reason: 'control broke: the author no longer gets true for their own erased letter' };
    for (const p of ['x', '', `${base}/cover.jpg`]) if ((await ask(h, A, p)) !== false) return { pass: false, reason: `a path without a uuid file name (${JSON.stringify(p)}) does not answer false cleanly` };
    const grants = (await h.sys(`select has_function_privilege('anon', 'public.photo_entry_is_purged(text)', 'execute') a,
      has_function_privilege('authenticated', 'public.photo_entry_is_purged(text)', 'execute') u`)).rows[0];
    if (grants.a || !grants.u) return { pass: false, reason: `helper grants wrong: anon=${grants.a}, authenticated=${grants.u}` };
    const cfg = (await h.sys(`select proconfig from pg_proc where proname = 'photo_entry_is_purged'`)).rows[0].proconfig ?? [];
    if (!cfg.some((c) => /^search_path=pg_catalog, public, pg_temp$/.test(c))) return { pass: false, reason: `search_path not pinned: ${JSON.stringify(cfg)}` };
    return { pass: true, reason: 'no non-author learns that a letter was erased (author or own folder); author block, held draft, rename, fresh upload and co-parent controls hold; ledger-only id is a documented residual (not graded for non-authors)' };
  });
}
