/**
 * BL-1357 part A: all transcription runs on the phone in 1.0, a family with no
 * model still records and types, and the hosted edit model is off in every
 * store build. These are source and build-config scans plus one state test, so
 * a hosted path added later fails here before it ships. Requirements:
 * docs/product/prd/functions/ai-and-speech.md FR-AIS-16, 17, 19.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { initialQueue, nextJob, reduce, type QueueEvent } from '../src/lib/transcription-queue/machine';

const ROOT = join(__dirname, '..', '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

/** Non-test TypeScript and JavaScript under the shipped code: the app, the packages, the Edge Functions. */
function shippedSource(): Array<{ path: string; text: string }> {
  const out: Array<{ path: string; text: string }> = [];
  const walk = (rel: string) => {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) return;
    for (const name of readdirSync(abs)) {
      if (name === 'node_modules' || name === 'test' || name === '__tests__' || name === 'dist') continue;
      const r = `${rel}/${name}`;
      if (statSync(join(ROOT, r)).isDirectory()) walk(r);
      else if (/\.(ts|tsx|js|mjs)$/.test(name) && !/\.test\.|\.spec\./.test(name)) out.push({ path: r, text: read(r) });
    }
  };
  for (const d of ['apps/mobile/src', 'apps/mobile/app', 'supabase/functions']) walk(d);
  for (const p of readdirSync(join(ROOT, 'packages'))) walk(`packages/${p}/src`);
  return out;
}

/** Hosts and routes that would send a voice or words to someone else's recogniser or edit model. */
const HOSTED_AI = /api\.groq\.com|api\.deepinfra\.com|api\.openai\.com|audio\/transcriptions|api\.assemblyai\.com|api\.deepgram\.com|speech\.googleapis\.com|api\.together\.xyz|openrouter\.ai/i;
/** A build-profile key that would turn a hosted path on. */
const HOSTED_FLAG = /TRANSCRI|SPEECH_(HOST|SERVER|CLOUD|API)|HOSTED|GROQ|DEEPINFRA|EDIT_(MODEL|PASS|PROVIDER)|DIARI[SZ]/i;

interface EasProfile {
  distribution?: string;
  env?: Record<string, string>;
}
const eas = JSON.parse(read('apps/mobile/eas.json')) as { build: Record<string, EasProfile> };
const isStoreProfile = (p: EasProfile) => p.distribution === 'store' || ['preview', 'production'].includes(p.env?.EXPO_PUBLIC_APP_ENV ?? '');

describe('[FR-AIS-16] no model, or a failed download: the recording is kept and the letter waits for its words', () => {
  const enqueue: QueueEvent = { type: 'enqueue', id: 'asha-1', kind: 'entry', language: 'en', capturedAt: '2026-11-01T10:00:00Z' };

  it('[FR-AIS-16] with no pack installed the job waits, never runs, is never dropped and never goes to a server', () => {
    let s = reduce(initialQueue(), { type: 'foreground', value: true });
    s = reduce(s, enqueue);
    expect(s.ready).toEqual([]);
    expect(s.jobs['asha-1'].phase).toBe('waiting_for_pack');
    expect(nextJob(s, 0)).toBeNull();
    // A download that failed changes nothing here: no 'packs' event arrives, the job is still waiting and kept.
    s = reduce(s, { type: 'recording', value: false });
    expect(s.jobs['asha-1'].phase).toBe('waiting_for_pack');
    expect(nextJob(s, 10 * 60_000)).toBeNull();
    // The pack arrives later: the same job runs, nothing was lost.
    s = reduce(s, { type: 'packs', ready: ['en'] });
    expect(nextJob(s, 0)).toBe('asha-1');
  });

  it('[FR-AIS-16] the only transcribers are on the phone: whisper and a dev sample', () => {
    expect(read('apps/mobile/src/lib/transcribe.ts')).toMatch(/export type TranscriberId = 'whisper' \| 'sample';/);
  });
});

describe('[FR-AIS-17] v1.0 sends no audio, transcript chunk or prompt to a server for recognition', () => {
  it('[FR-AIS-17] no shipped file names a hosted recogniser or edit-model host or route', () => {
    const files = shippedSource();
    expect(files.length).toBeGreaterThan(100); // the scan is not looking at nothing
    const hits = files.filter((f) => HOSTED_AI.test(f.text)).map((f) => f.path);
    expect(hits).toEqual([]);
  });

  it('[FR-AIS-17] no Edge Function is a transcription or edit-model function', () => {
    const fns = readdirSync(join(ROOT, 'supabase/functions')).filter((n) => !n.startsWith('_'));
    expect(fns.filter((n) => /transcri|whisper|speech|asr|edit|llm|model/i.test(n))).toEqual([]);
  });

  it('[FR-AIS-17] no store build profile carries a hosted-transcription flag or host', () => {
    const store = Object.entries(eas.build).filter(([, p]) => isStoreProfile(p));
    expect(store.map(([n]) => n)).toEqual(expect.arrayContaining(['preview', 'production', 'testflight']));
    for (const [name, p] of store) {
      for (const [k, v] of Object.entries(p.env ?? {})) {
        expect(k, `${name}.${k}`).not.toMatch(HOSTED_FLAG);
        expect(v, `${name}.${k}`).not.toMatch(HOSTED_AI);
      }
    }
  });
});

describe('[FR-AIS-19] the hosted edit model is off in every store build: until then the edit pass is rules only', () => {
  it('[FR-AIS-19] the model-backed edit provider is built only in core and the experiment harness, never in the app or a function', () => {
    const hits = shippedSource()
      .filter((f) => !f.path.startsWith('packages/core/'))
      .filter((f) => /JsonModelEditProvider|ModelCallRequest|EDIT_SYSTEM_PROMPT/.test(f.text))
      .map((f) => f.path);
    expect(hits).toEqual([]);
  });

  it('[FR-AIS-19] no store profile sets an edit-model switch, and none is set on at all', () => {
    for (const [name, p] of Object.entries(eas.build)) {
      for (const [k, v] of Object.entries(p.env ?? {})) {
        if (/EDIT|MODEL/i.test(k)) expect(`${name}.${k}=${v}`).toMatch(/=(off|0|false)$/);
      }
    }
  });
});
