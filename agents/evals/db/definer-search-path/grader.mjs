// Outcome grader, two parts. (1) Sweep: every security definer function in public pins a search_path that
// starts with pg_catalog and ends with pg_temp. (2) Shadow probe: a stranger's temp table named child_members
// (made in the same session) must not change what any definer helper answers; with pg_temp last, relation
// lookups skip the temp schema first. Controls: the helpers still exist and still answer correctly for a real member.
import { withDb, seedAsha, CHILD } from '../_lib.mjs';

const FNS = ['is_child_member', 'is_child_parent', 'member_count', 'my_role'];

export async function grade({ workdir }) {
  return withDb(workdir, async (h) => {
    const { A, C } = await seedAsha(h);
    const rows = (await h.sys(`select p.proname, (select substr(c, 13) from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%') sp
        from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef`)).rows;
    if (FNS.some((f) => !rows.some((r) => r.proname === f))) return { pass: false, reason: 'a helper was dropped or lost security definer; keep all four as they are' };
    const bad = rows.filter((r) => !(r.sp && /^pg_catalog(, [a-z_]+)*, pg_temp$/.test(r.sp)));
    if (bad.length) return { pass: false, reason: `search_path not pg_catalog first and pg_temp last: ${bad.map((r) => `${r.proname} (${r.sp ?? 'not set'})`).join(', ')}` };

    const real = [(await h.as(A, `select public.is_child_member('${CHILD}') a, public.is_child_parent('${CHILD}') b, public.member_count('${CHILD}') c, public.my_role('${CHILD}') d`)).rows[0]][0];
    if (real.a !== true || real.b !== true || real.c !== 2 || real.d !== 'parent') return { pass: false, reason: `control broke: helpers answer wrongly for a real member (${JSON.stringify(real)})` };

    await h.sys(`create temp table child_members (child_id uuid, profile_id uuid, role text)`);
    await h.sys(`insert into pg_temp.child_members values ('${CHILD}', '${C}', 'parent'), ('${CHILD}', '${C}', 'parent'), ('${CHILD}', '${C}', 'parent')`);
    const shadow = (await h.as(C, `select public.is_child_member('${CHILD}') a, public.is_child_parent('${CHILD}') b, public.member_count('${CHILD}') c, public.my_role('${CHILD}') d`)).rows[0];
    await h.sys(`drop table pg_temp.child_members`);
    if (shadow.a !== false || shadow.b !== false || shadow.c !== 0 || shadow.d !== null)
      return { pass: false, reason: `a temp table shadowed child_members and changed an answer for a stranger (${JSON.stringify(shadow)})` };
    return { pass: true, reason: 'all definer functions pin pg_catalog first and pg_temp last; a temp-table shadow changes nothing' };
  });
}
