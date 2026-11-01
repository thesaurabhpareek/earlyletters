/**
 * The export's server reads against a real Supabase stack (BL-323, BL-529;
 * LEGAL-REQ-034): real GoTrue sign-in, real PostgREST, the migrations' real
 * access rules, and the app's own reader (`postgrestReader` and
 * `readServerRecords` in src/lib/export/server-records.logic.ts, the code
 * device.ts runs). The PGlite tests prove the SQL; this proves the HTTP path
 * a phone takes, which no hosted project can show until staging exists
 * (docs/ops/DEPLOY.md, founder step 1).
 *
 * Run by .github/workflows/db-cli.yml after `supabase db reset --local`:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY  (from `supabase status -o env`)
 *   SUPABASE_DB_CONTAINER                                  (the stack's Postgres container)
 *   npx tsx apps/mobile/test/live/export-server-reads.live.ts
 * Fixture SQL runs as the database owner through `docker exec ... psql`, as the
 * founder's APPLY.md steps do on a hosted project. Fictional family "Asha" only.
 * Exits 1 on any failed check; never skips.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { uuidv7From } from '../../src/lib/db/repos/ids';
import { postgrestReader, readServerRecords, type PostgrestLike } from '../../src/lib/export/server-records.logic';

const env = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not set`);
  return v;
};
const URL_ = env('SUPABASE_URL');
const ANON = env('SUPABASE_ANON_KEY');
const SERVICE = env('SUPABASE_SERVICE_KEY');
const DB = env('SUPABASE_DB_CONTAINER');

const sql = (q: string): string =>
  execFileSync('docker', ['exec', '-i', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tA', '-c', q], { encoding: 'utf8' }).trim();

let failures = 0;
let passes = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || detail === undefined ? '' : `\n      ${JSON.stringify(detail)}`}`);
  if (ok) passes++;
  else failures++;
};

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const fresh = () => createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

async function person(tag: string): Promise<{ id: string; sb: SupabaseClient }> {
  const email = `asha-${tag}-${randomUUID().slice(0, 8)}@example.invalid`;
  const password = `pw-${randomUUID()}`;
  const made = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (made.error || !made.data.user) throw new Error(`createUser ${tag}: ${made.error?.message}`);
  const sb = fresh();
  const signed = await sb.auth.signInWithPassword({ email, password });
  if (signed.error) throw new Error(`signIn ${tag}: ${signed.error.message}`);
  return { id: made.data.user.id, sb };
}

async function consent(sb: SupabaseClient, document: string, context: Record<string, unknown>, method: string, surface: string) {
  const { error } = await sb
    .rpc('record_policy_act', {
      p_document: document,
      p_version: '1.0.0',
      p_action: 'accept',
      p_method: method,
      p_surface: surface,
      p_app_version: '1.0.0',
      p_platform: 'ios',
      p_locale: 'en',
      p_client_recorded_at: new Date().toISOString(),
      p_context: context,
    })
    .setHeader('idempotency-key', randomUUID());
  if (error) throw new Error(`record_policy_act ${document}: ${error.message}`);
}

const read = (o: { sb: SupabaseClient | null; uid: string | null; owner?: string | null; timeoutMs?: number }) =>
  readServerRecords({
    authUserId: o.uid,
    ownerId: o.owner ?? null,
    reader: o.sb ? postgrestReader(o.sb as unknown as PostgrestLike) : null,
    timeoutMs: o.timeoutMs ?? 10_000,
    now: () => new Date(),
  });

async function main() {
  // Published policy versions, as APPLY.md step 8 does on a hosted project.
  for (const doc of ['terms', 'sensitive-data']) {
    sql(`insert into public.policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from,
           effective_at, content_sha256, url, summary)
         values ('${doc}', '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
           sha256(convert_to('${doc}', 'UTF8')), 'https://example.invalid/${doc}/1.0.0', 'First version')
         on conflict do nothing`);
  }

  const a = await person('mama');
  const b = await person('papa');
  for (const p of [a, b]) {
    await consent(p.sb, 'terms', { auth: 'email', age_attested: true }, 'signin_sheet', 'auth.sheet');
    await consent(p.sb, 'sensitive-data', {}, 'consent_sheet', 'consent.sensitive');
  }
  const setName = async (p: { id: string; sb: SupabaseClient }, name: string) => {
    const { error } = await p.sb.from('profiles').update({ display_name: name }).eq('id', p.id);
    if (error) throw new Error(`profiles update: ${error.message}`);
  };
  await setName(a, 'Asha Mama');
  await setName(b, 'Asha Papa');

  // A book for A, and B as its co-parent (a direct fixture: the invite flow is tested elsewhere).
  const child = uuidv7From(randomBytes(16), Date.now()); // the server takes only a device-made UUIDv7
  const made = await a.sb.rpc('create_child', { p_id: child, p_name: 'Asha', p_date_of_birth: '2026-03-08' });
  if (made.error) throw new Error(`create_child: ${made.error.message}`);
  sql(`insert into public.child_members (child_id, profile_id, role) values ('${child}', '${b.id}', 'parent') on conflict do nothing`);
  const seen = await a.sb.from('profiles').select('id');
  check('co-parents can read each other\'s profile over the API (why the export filters by id)', (seen.data ?? []).length === 2, seen.error ?? seen.data?.length);

  // The export as A, through the app's own reader.
  const r = await read({ sb: a.sb, uid: a.id, owner: a.id });
  check('consent record included over the real API', r.consent.status === 'included', r.consent.status);
  check('it holds A\'s two acts, terms then sensitive-data', r.consent.acts.map((x) => x.document).join() === 'terms,sensitive-data', r.consent.acts.map((x) => x.document));
  check('the terms act carries the age attestation as stored', r.consent.acts[0]?.context?.age_attested === true, r.consent.acts[0]?.context);
  check('my_policy_state gives the latest act per document', r.consent.current.map((x) => `${x.document}:${x.action}`).join() === 'sensitive-data:accept,terms:accept', r.consent.current);
  // Defence in depth over the table's own-rows policy: B's rows look like A's (same document, version, action),
  // so only the time tells them apart (B acted after A). Red if the view ever returns another person's rows.
  const latestOfA = (doc: string) => r.consent.acts.filter((x) => x.document === doc).map((x) => x.at).sort().pop();
  check('each current row is A\'s own latest act, not B\'s (my_policy_state is own rows only)', r.consent.current.length === 2 && r.consent.current.every((x) => x.at === latestOfA(x.document)), { current: r.consent.current.map((x) => x.at), acts: r.consent.acts.map((x) => x.at) });
  const all = JSON.stringify(r);
  check('no account id anywhere in what the export reads (consent and profile)', !all.includes(a.id) && !all.includes(b.id));
  const keys = (o: object) => Object.keys(o).sort().join();
  const ACT_KEYS = 'action,app_version,at,client_recorded_at,context,document,id,locale,method,platform,rendered_sha256,surface,version';
  check('each act carries exactly the exported fields (no profile_id, subject_hash or retention columns)', r.consent.acts.length > 0 && r.consent.acts.every((x) => keys(x) === ACT_KEYS), r.consent.acts.map(keys));
  check('each current row carries exactly document, version, action, at', r.consent.current.length > 0 && r.consent.current.every((x) => keys(x) === 'action,at,document,version'), r.consent.current.map(keys));
  check('the profile carries exactly its exported fields (no id)', keys(r.profile) === 'created_at,display_name,read_at,signs_as,status', keys(r.profile));
  check('profile included, A\'s own only', r.profile.status === 'included' && r.profile.display_name === 'Asha Mama', r.profile);
  check('B\'s profile never enters A\'s export', !JSON.stringify(r).includes('Asha Papa'));

  // The other statuses. The first two are decided on the phone before any read; the third reaches the API with no session.
  const other = await read({ sb: a.sb, uid: a.id, owner: b.id });
  check('a different account than the owner of the letters: nothing read', other.consent.status === 'different_account' && other.profile.status === 'different_account', other);
  const signedOut = await read({ sb: null, uid: null });
  check('signed out: not_signed_in', signedOut.consent.status === 'not_signed_in' && signedOut.profile.status === 'not_signed_in', signedOut);
  const anon = fresh();
  const noSession = await read({ sb: anon, uid: a.id, owner: a.id });
  check('a client with no session gets no record, never a partial or someone else\'s one', noSession.consent.status !== 'included' || (noSession.consent.acts.length === 0 && noSession.consent.current.length === 0), noSession.consent);
  check('and no profile', noSession.profile.status === 'unavailable', noSession.profile);

  // The spelling list stays on the device: the API refuses the table to a signed-in person.
  const dict = await a.sb.from('dictionary_terms').select('term').limit(1);
  // A permission refusal, not any error: a missing or renamed table must not pass this.
  check('dictionary_terms is refused over the API (the export reads it from the phone)', dict.error?.code === '42501', dict.error ?? dict.data);
}

main()
  .catch((e) => {
    console.log(`FAIL  the run stopped: ${e instanceof Error ? e.message : String(e)}`);
    failures++;
  })
  .finally(() => {
    console.log(failures ? `\n${failures} FAILED (${passes} passed)` : `\nALL PASSED (${passes} checks)`);
    process.exit(failures ? 1 : 0);
  });
