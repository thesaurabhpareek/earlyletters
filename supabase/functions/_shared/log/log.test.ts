// Deno tests for the content-free logger. Run (from the repo root):
//   npx -y deno@2.9.6 test --no-prompt --allow-read supabase/functions scripts/ops
import assert from 'node:assert/strict';
import { CANARY, CANARY_OBJECT_PATH, findCanaries } from './canary.ts';
import { createLogger, errorFields, EVENTS, memoryLogger, REQ_ID_RE, sanitize } from './log.ts';

Deno.test('a log line has only the fixed shape and a random 12-hex req_id', () => {
  const log = memoryLogger('purge-worker');
  log.info('worker.done', { counts: { requests: 2, objects: 10 }, duration_ms: 12.4, task: 'run' });
  const [line] = log.lines;
  assert.equal(line.event, 'worker.done');
  assert.equal(line.fn, 'purge-worker');
  assert.match(line.req_id, REQ_ID_RE);
  assert.deepEqual(line.counts, { requests: 2, objects: 10 });
  assert.equal(line.duration_ms, 12);
  assert.equal(line.dropped, undefined);
});

Deno.test('unknown fields, free text and ids are dropped, never logged', () => {
  const { clean, dropped } = sanitize({
    message: CANARY.letterText,
    child: CANARY.childName,
    email: CANARY.parentEmail,
    profile_id: CANARY.profileId,
    path: CANARY_OBJECT_PATH,
    step: 'storage_objects',
    bucket: CANARY_OBJECT_PATH,
    code: CANARY.letterText,
    sqlstate: 'not a sqlstate',
    counts: { rows: 3, letters: -1, [CANARY.childName]: 1 },
    provider: 'asha-provider',
  });
  assert.deepEqual(clean, { step: 'storage_objects', counts: { rows: 3 } });
  assert.equal(dropped, 11);
});

Deno.test('exceptions keep class, SQLSTATE and status only', () => {
  const err = Object.assign(new TypeError(`failed for ${CANARY.parentEmail}: ${CANARY.letterText}`), {
    sqlstate: '23514',
    status: 400,
    details: `Failing row contains (${CANARY.letterText})`,
    hint: CANARY.childName,
  });
  assert.deepEqual(errorFields(err), { code: 'type_error', sqlstate: '23514', status: 400 });
  const log = memoryLogger('analytics-forget');
  log.exception('forget.failed', err, { provider: 'posthog' });
  assert.deepEqual(findCanaries(log.raw.join('\n')), []);
  assert.equal(log.lines[0].code, 'type_error');
});

Deno.test('an unknown event name is replaced, not echoed', () => {
  const lines: string[] = [];
  const log = createLogger({ fn: 'ops-script', sink: (l) => lines.push(l) });
  // deno-lint-ignore no-explicit-any
  (log as any).info(`letter ${CANARY.letterText}`);
  assert.equal(JSON.parse(lines[0]).event, 'invalid_event');
  assert.deepEqual(findCanaries(lines.join('\n')), []);
});

Deno.test('every event, with every fixture in every field, logs no fixture', () => {
  const log = memoryLogger('purge-worker');
  for (const event of EVENTS) {
    for (const value of [...Object.values(CANARY), CANARY_OBJECT_PATH]) {
      log.info(event, { outcome: value, status: value, sqlstate: value, code: value, step: value, bucket: value, provider: value,
        task: value, alert: value, reason: value, counts: { rows: value }, duration_ms: value, cold_start: value } as never);
      log.exception(event, Object.assign(new Error(value), { code: value, sqlstate: value, status: value, name: value }));
    }
  }
  assert.deepEqual(findCanaries(log.raw.join('\n')), []);
});

Deno.test('a failing sink never throws into the caller', () => {
  const log = createLogger({ fn: 'purge-worker', sink: () => { throw new Error('disk full'); } });
  log.error('worker.done');
});

Deno.test('the canary scanner finds fixtures and generic shapes', () => {
  assert.deepEqual(findCanaries('nothing here'), []);
  assert.ok(findCanaries(`hello ${CANARY.childName.toLowerCase()}`).includes('childName'));
  assert.ok(findCanaries('id 3fa85f64-5717-4562-b3fc-2c963f66afa6').includes('uuid'));
  assert.ok(findCanaries('mail someone@example.org').some((h) => h.startsWith('email:')));
  assert.deepEqual(findCanaries('mail hello@earlyletters.com', { emails: ['hello@earlyletters.com'] }), []);
  assert.ok(findCanaries(CANARY.sessionJwt).includes('jwt'));
});

// Static rule (TDD 06 5.3): no direct console calls in function or ops-script code;
// everything goes through the logger (the one sink in log.ts) or the ops CLI printer.
Deno.test('no console.* calls outside the logger sink and the ops CLI printer', async () => {
  const root = new URL('../../../../', import.meta.url);
  const dirs = ['supabase/functions/purge-worker', 'supabase/functions/analytics-forget', 'supabase/functions/_shared/log', 'scripts/ops'];
  const allowed = new Set(['supabase/functions/_shared/log/log.ts', 'scripts/ops/lib/cli.ts']);
  const offenders: string[] = [];
  const walk = async (rel: string) => {
    let entries: Deno.DirEntry[] = [];
    try {
      entries = [...Deno.readDirSync(new URL(rel, root))];
    } catch {
      return;
    }
    for (const e of entries) {
      const path = `${rel}/${e.name}`;
      if (e.isDirectory) await walk(path);
      else if (/\.(ts|mjs|js)$/.test(e.name) && !/\.test\.ts$/.test(e.name) && !allowed.has(path)) {
        const text = await Deno.readTextFile(new URL(path, root));
        if (/\bconsole\s*\.\s*(log|info|warn|error|debug|trace|dir|table)\b/.test(text)) offenders.push(path);
      }
    }
  };
  for (const d of dirs) await walk(d);
  assert.deepEqual(offenders, []);
});
