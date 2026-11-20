/// <reference types="node" />
/**
 * The privacy label guard (scripts/release/label-effect.mjs; BL-975, card 07 rows NS-07-G11-1a to G11-5). Diff
 * fixtures are written inline; the CLI runs once on a throwaway git repository. Decisions D-900 and D-901 are fictional.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LABEL_FILE, labelTriggers, parseDiff, runGuard } from '../../../scripts/release/label-effect.mjs';

const REPO = join(__dirname, '..', '..', '..');
const GUARD = join(REPO, 'scripts', 'release', 'label-effect.mjs');

const diff = (path: string, added: string[], removed: string[] = []) =>
  [`diff --git a/${path} b/${path}`, `--- a/${path}`, `+++ b/${path}`, `@@ -1,${removed.length} +1,${added.length} @@`, ...removed.map((l) => `-${l}`), ...added.map((l) => `+${l}`)].join('\n');
const LABEL_EDIT = diff(LABEL_FILE, ['| Photos | Collected, linked |']);
const DECISIONS = [
  '## Index',
  '| D-900 | Pictures go to the family | Decided |',
  '### D-900 Pictures go to the family (fictional)',
  '- **Decision:** a picture is uploaded with its letter. The privacy label adds Photos, linked, App Functionality.',
  '### D-901 Colours (fictional)',
  '- **Decision:** the accent colour changes.',
].join('\n');
const guard = (diffText: string, body = '') => runGuard({ diffText, body, decisionsBase: DECISIONS });

const LEAVING = {
  'a network call with a transcript': diff('apps/mobile/src/lib/sync/push.ts', ['const res = await fetch(url, {', '  body: JSON.stringify({ raw_transcript: entry.rawTranscript }),', '});']),
  'a recording upload': diff('apps/mobile/src/lib/backup/upload.ts', ["await sb.storage.from('entry-audio').upload(path, bytes);"]),
  'a server column for a picture': diff('supabase/migrations/20261201000000_photos.sql', ['alter table public.entries', '  add column photo_path text;']),
  'a server function taking a child name': diff('supabase/migrations/20261201000001_names.sql', ['create or replace function public.set_child_name(c uuid, child_name text) returns void', "language sql as $$ update public.children set name = child_name where id = c $$;"]),
  'a server bucket for pictures': diff('supabase/migrations/20261201000003_bucket.sql', ["insert into storage.buckets (id, name) values ('entry-photos', 'entry-photos');"]),
  'a child date on the children table': diff('supabase/migrations/20261201000004_due.sql', ['alter table public.children add column due_date date;']),
  'the children table with a name': diff('supabase/migrations/20261201000005_book.sql', ['create table public.children (', '  id uuid primary key,', '  name text not null', ');']),
};

describe('[NS-07-G11-1] data leaving the phone needs a recorded label change', () => {
  for (const [what, d] of Object.entries(LEAVING)) {
    it(`[NS-07-G11-1a] an unrecorded data-leaving diff fails: ${what}`, () => {
      const r = guard(d, 'Agent: mobile');
      expect(r.failed).toBe(true);
      expect(r.lines[0]).toMatch(/^FAIL G11-1a \S+:\d+ adds a (network call|server table, column, bucket or function)/);
      expect(r.lines.join('\n')).not.toMatch(/raw_transcript|entry-audio|photo_path|children/); // paths and ids only
    });
  }

  it('[NS-07-G11-1a] fails when any one of the four conditions is missing', () => {
    const d = LEAVING['a recording upload'];
    const cases: [string, string, RegExp][] = [
      ['', d + '\n' + LABEL_EDIT, /names no D-id/],
      ['Per D-777.', d + '\n' + LABEL_EDIT, /D-777: not a decision in docs\/DECISIONS\.md on the base branch/],
      ['Per D-901.', d + '\n' + LABEL_EDIT, /does not name the privacy label/],
      ['Per D-900.', d, /app-store-privacy-labels\.md is not changed/],
    ];
    for (const [body, text, why] of cases) {
      const r = guard(text, body);
      expect(r.failed).toBe(true);
      expect(r.lines.join('\n')).toMatch(why);
    }
  });

  it('[NS-07-G11-1a] a decision added in the same PR does not count', () => {
    const r = guard(LEAVING['a recording upload'] + '\n' + LABEL_EDIT + '\n' + diff('docs/DECISIONS.md', ['### D-950 Recordings leave (privacy label)']), 'Per D-950.');
    expect(r.failed).toBe(true);
  });

  for (const [what, d] of Object.entries(LEAVING)) {
    it(`[NS-07-G11-1b] a recorded label change passes: ${what}`, () => {
      const r = guard(d + '\n' + LABEL_EDIT, 'Label: D-900.');
      expect(r.failed).toBe(false);
      expect(r.lines[0]).toMatch(/^PASS G11-1a .*\(recorded\)$/);
    });
  }

  it('[NS-07-G11-1c] an ordinary diff passes whatever the PR body says', () => {
    const ordinary = [
      diff('apps/mobile/src/lib/packs/manifest.ts', ['const res = await fetch(manifestUrl);']),
      diff('apps/mobile/src/lib/db/migrations.ts', ["db.exec('create table entry_media (photo_path text)');"]),
      diff('apps/mobile/test/sync.test.ts', ["fetch(url, { body: 'transcript' });"]),
      diff('apps/mobile/src/lib/sync/push.ts', ['// fetch() never carries the raw_transcript here']),
      diff('supabase/migrations/20261201000002_ops.sql', ['create table ops.cron_runs (id bigint);', 'create function public.purge_due() returns void', 'language plpgsql as $$', 'begin', "  perform public.enqueue_storage_purge('entry-photos', p, false);", 'end $$;']),
      diff('apps/mobile/app.config.ts', ["const STRIP = ['com.apple.developer.applesignin'];", "  ['expo-image-picker', { photosPermission: false, cameraPermission: false }],"]),
      diff('supabase/migrations/20261201000006_scoped.sql', ['create table public.child_notes_seen (child_id uuid references public.children(id), seen_at timestamptz);', 'alter table public.children add column archived_at timestamptz;']),
      diff('supabase/migrations/20261201000007_access.sql', ['create or replace function public.can_read_entry_photo(p_name text) returns boolean', 'language sql as $$ select true $$;']),
      diff('docs/product/prd/01-photo-with-a-letter.md', ['fetch the photo']),
    ].join('\n');
    for (const body of ['', 'Per D-900.', 'Per D-777.']) expect(guard(ordinary, body)).toEqual({ lines: [], failed: false });
    expect(guard('', 'D-777')).toEqual({ lines: [], failed: false });
  });
});

describe('[NS-07-G11-3] a new SDK, entitlement or usage string', () => {
  const adds = {
    'an analytics SDK': diff('apps/mobile/package.json', ['    "posthog-react-native": "^4.0.0",']),
    'a crash SDK': diff('apps/mobile/package.json', ['    "@sentry/react-native": "^7.0.0",']),
    'an entitlement': diff('apps/mobile/app.config.ts', ["      'com.apple.developer.healthkit': true,"]),
    'an entitlements file key': diff('apps/mobile/ios/App.entitlements', ['<key>com.apple.developer.icloud-services</key>']),
    'a usage string': diff('apps/mobile/app.config.ts', ['      NSCameraUsageDescription: copy.camera,']),
  };
  for (const [what, d] of Object.entries(adds)) {
    it(`[NS-07-G11-3] a new SDK, entitlement or usage string needs a recorded decision: ${what}`, () => {
      expect(guard(d, 'Per D-900.').lines[0]).toMatch(/^FAIL G11-3 apps\/mobile\/(package\.json|app\.config\.ts|ios\/App\.entitlements):1 adds the /);
      expect(guard(d + '\n' + LABEL_EDIT, 'Per D-900.').failed).toBe(false);
    });
  }

  it('[NS-07-G11-3] a version bump or a reworded usage string is not new', () => {
    const bump = diff('apps/mobile/package.json', ['    "@sentry/react-native": "^7.1.0",'], ['    "@sentry/react-native": "^7.0.0",']);
    const reword = diff('apps/mobile/app.config.ts', ['      NSMicrophoneUsageDescription: copy.micV2,'], ['      NSMicrophoneUsageDescription: copy.mic,']);
    const other = diff('apps/mobile/package.json', ['    "expo-image": "~3.0.0",']);
    const entitlement = diff('apps/mobile/app.config.ts', ["      'com.apple.developer.healthkit': true,"], ["      'com.apple.developer.healthkit': false,"]);
    expect(guard([bump, reword, other, entitlement].join('\n'))).toEqual({ lines: [], failed: false });
  });
});

describe('reading the diff', () => {
  it('[NS-07-G11-1a] names a SQL statement by its first non-blank line', () => {
    const [t] = labelTriggers(parseDiff(diff('supabase/migrations/20261201000008_x.sql', ['', 'alter table public.entries add column final_text text;'])));
    expect(t.line).toBe(2);
  });

  it('[NS-07-G11-1a] a diff header it cannot read stops the guard instead of skipping the file', () => {
    expect(() => parseDiff('diff --git "a/apps/mobile/src/x\\"y.ts" "b/apps/mobile/src/x\\"y.ts"\n+fetch(transcript)')).toThrow(/cannot read/);
  });
});

/** A throwaway git repository for the CLI, with the base branch committed. */
function scratchRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'label-guard-'));
  const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=Asha', '-c', 'user.email=asha@example.invalid', ...a], { cwd: dir, encoding: 'utf8' });
  const put = (p: string, t: string) => (mkdirSync(join(dir, dirname(p)), { recursive: true }), writeFileSync(join(dir, p), t));
  const commit = (m: string) => (git('add', '-A'), git('commit', '-q', '-m', m));
  const run = (args: string[], body = '') => spawnSync(process.execPath, [GUARD, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, PR_BODY: body } });
  git('init', '-q', '-b', 'base');
  put('docs/DECISIONS.md', DECISIONS + '\n');
  put('scripts/helpers/send.ts', 'await fetch(u, { body: transcript });\n');
  commit('base');
  return { dir, git, put, commit, run };
}

describe('the command line', () => {
  it('[NS-07-G11-1a] exits 1 on an unrecorded change, 0 once recorded, and 2 when the guard itself cannot run', () => {
    const { dir, git, put, commit, run } = scratchRepo();
    try {
      git('checkout', '-q', '-b', 'head');
      put('apps/mobile/src/lib/backup/upload.ts', "await sb.storage.from('entry-audio').upload(path, bytes);\n");
      commit('head');
      expect(run(['--base', 'base', '--head', 'head']).status).toBe(1);
      put(LABEL_FILE, '| Audio | Collected |\n');
      commit('label');
      expect(run(['--base', 'base', '--head', 'head'], 'Per D-900.').status).toBe(0);
      const broken = run(['--base', 'no-such-branch', '--head', 'head']);
      expect(broken.status).toBe(2);
      expect(broken.stderr).toMatch(/^Label guard error: /m);
      expect(run([]).status).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[NS-07-G11-1a] reads DECISIONS.md from the base, a moved file as added, and a non-ASCII path', () => {
    const { dir, git, put, commit, run } = scratchRepo();
    try {
      git('checkout', '-q', '-b', 'moved');
      mkdirSync(join(dir, 'apps/mobile/src/lib'), { recursive: true });
      git('mv', 'scripts/helpers/send.ts', 'apps/mobile/src/lib/send.ts');
      commit('move into the app');
      expect(run(['--base', 'base']).status).toBe(1);
      git('checkout', '-q', '-b', 'self-recorded', 'base');
      put('apps/mobile/src/lib/s\u00e9.ts', 'await fetch(u, { body: transcript });\n');
      put(LABEL_FILE, '| Other User Content | Collected |\n');
      put('docs/DECISIONS.md', `${DECISIONS}\n### D-950 Words leave the phone (fictional)\n- The privacy label changes.\n`);
      commit('a decision written in the same PR');
      const r = run(['--base', 'base'], 'Per D-950.');
      expect(r.status).toBe(1);
      expect(r.stdout).toMatch(/G11-1a apps\/mobile\/src\/lib\/s\u00e9\.ts:1 /);
      expect(r.stdout).toMatch(/D-950: not a decision in docs\/DECISIONS\.md on the base branch/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
