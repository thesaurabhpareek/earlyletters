// Log canary (LEGAL-REQ-014, DATA-REQ-004, TDD 05 9.5): run both functions end to end
// with the Asha fixtures in every input, including failures, then scan every log line
// and the internal alert email. Zero fixture strings, UUIDs, emails or JWTs may appear.
import assert from 'node:assert/strict';
import { makeForgetHandler } from '../../analytics-forget/handler.ts';
import { advance, ashaWorld, run, testConfig } from '../../purge-worker/test/helpers.ts';
import { CANARY, findCanaries } from './canary.ts';

Deno.test('canary: purge worker logs and alert mail stay content-free through success and failure', async () => {
  const { w } = await ashaWorld();
  w.resendStatus = 503;
  w.requests[0].executing_at = new Date(w.now.getTime() - 8 * 86_400_000).toISOString();
  w.sla = { ...w.sla, tombstones_overdue: 2, requests_executing_over_24h: 1, steps_failed: 1, queue_stuck: 1, purge_run_age_minutes: null };
  w.extraResidue = [{ table_schema: 'public', table_name: 'entries', column_name: 'author_id' }];
  w.put('entry-photos', `${CANARY.childId}/${CANARY.coParentId}/${CANARY.letterText}.jpg`, CANARY.profileId);
  const runs = [await run(w, testConfig())];
  w.resendStatus = 200;
  advance(w, 3 * 3600_000);
  w.alertState.clear();
  runs.push(await run(w, testConfig()));
  runs.push(await run(w, testConfig(), 'daily'));
  const logs = runs.flatMap((r) => r.log.raw).join('\n');
  assert.ok(logs.length > 500, 'the runs logged');
  assert.deepEqual(findCanaries(logs), []);
  const alerts = w.emails.filter((e) => e.to === 'hello@earlyletters.com');
  assert.ok(alerts.length >= 1);
  for (const a of alerts) assert.deepEqual(findCanaries(a.subject + '\n' + a.text, { emails: ['hello@earlyletters.com'] }), []);
});

Deno.test('canary: analytics-forget logs nothing it was sent', async () => {
  const lines: string[] = [];
  for (const status of [202, 500]) {
    const handler = makeForgetHandler((n) => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', POSTHOG_PERSONAL_API_KEY: 'p', POSTHOG_PROJECT_ID: '1' } as Record<string, string>)[n], {
      fetch: (url) => Promise.resolve(url.endsWith('/auth/v1/user')
        ? new Response(JSON.stringify({ id: CANARY.profileId, email: CANARY.parentEmail }))
        : url.includes('ops_consume') ? new Response('true') : new Response(`{"detail":"${CANARY.analyticsId}"}`, { status })),
      logSink: (l) => lines.push(l),
    });
    await handler(new Request('https://fn.local/analytics-forget/v1', {
      method: 'POST',
      headers: { Authorization: `Bearer ${CANARY.sessionJwt}` },
      body: JSON.stringify({ ids: [CANARY.analyticsId, CANARY.profileId], reason: 'account_deletion' }),
    }));
  }
  assert.equal(lines.length >= 2, true);
  assert.deepEqual(findCanaries(lines.join('\n')), []);
});
