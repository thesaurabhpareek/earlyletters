/// <reference types="node" />
/** CI-Q1: the reader of the macOS launch job's timings. Fixtures are trimmed copies of the shape `gh api .../runs/<id>/jobs` returns (21 Nov 2026). */
import { describe, expect, it } from 'vitest';
import { jobTimes, main, median, render, summarize } from '../../../scripts/ci/ci-timing.mjs';

const t = (m: number) => new Date(Date.UTC(2026, 10, 21, 1, 0, 0) + m * 60000).toISOString();
/** A launch job: created at 0, started `queue` min later, steps laid end to end. */
const launch = (queue: number, prebuild: number, restore: number, xcode: number, conclusion = 'success') => {
  let at = queue;
  const step = (name: string, m: number, c = 'success') => ({ name, started_at: t(at), completed_at: t((at += m)), conclusion: c });
  const steps = [step('Set up job', 0.1), step('expo prebuild --platform ios --no-install', prebuild), step('pod install', 0.7), step('Restore DerivedData (Release)', restore), step('xcodebuild (iOS Simulator, Release, CODE_SIGNING_ALLOWED=NO)', xcode), step('Install and launch the app', 1.5), step('Stay up for 20 s', 0.5), step('Why the app stopped (on failure)', 0, 'skipped')];
  return { name: 'store-profile Release launch (testflight env, no seam, 20 s)', created_at: t(0), started_at: t(queue), completed_at: t(at), conclusion, steps };
};
const other = { name: 'native files changed?', created_at: t(0), started_at: t(1), completed_at: t(2), conclusion: 'success', steps: [] };

describe('ci-timing', () => {
  it('[T-01] one launch job: queue wait, run time and the steps that matter, in minutes', () => {
    const r = jobTimes(launch(45, 0.1, 0.4, 17.6));
    expect(r.queue).toBe(45);
    expect(r.steps).toMatchObject({ prebuild: 0.1, 'restore DerivedData': 0.4, 'pod install': 0.7, xcodebuild: 17.6, 'simulator and launch': 2 });
    expect(r.run).toBeCloseTo(0.1 + 0.1 + 0.7 + 0.4 + 17.6 + 2, 1);
  });

  it('[T-01] medians over runs; failed launch jobs and other jobs are not counted', () => {
    const s = summarize([
      { id: 1, jobs: [other, launch(10, 0.1, 0.5, 15)] },
      { id: 2, jobs: [launch(30, 0.1, 0.5, 17)] },
      { id: 3, jobs: [launch(0, 0.1, 0.5, 9)] },
      { id: 4, jobs: [launch(99, 0.1, 0.5, 99, 'failure')] },
      { id: 5, jobs: [other] },
    ]);
    expect(s.launches).toBe(3);
    expect(s.queue).toEqual({ n: 3, min: 0, median: 10, max: 30 });
    expect(s.steps.xcodebuild).toEqual({ n: 3, min: 9, median: 15, max: 17 });
    expect(s.rows.map((r: { id: number }) => r.id)).toEqual([1, 2, 3]);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('[T-01] the report prints the numbers and the queue now', () => {
    const text = render(summarize([{ id: 1, jobs: [launch(10, 0.1, 0.5, 15)] }]), { queued: 36, inProgress: 3 });
    expect(text).toContain('queue wait (min): min 10, median 10, max 10 (n=1)');
    expect(text).toContain('xcodebuild (min): min 15, median 15, max 15 (n=1)');
    expect(text).toContain('now: 36 runs queued, 3 in progress');
  });

  it('[T-01] it reads with GET calls only and never asks for log text', async () => {
    const calls: string[] = [];
    const api = async (path: string) => {
      calls.push(path);
      if (path.includes('status=success')) return { workflow_runs: [{ id: 7 }] };
      if (path.includes('/jobs')) return { jobs: [launch(5, 0.1, 0.5, 14)] };
      return { total_count: 2 };
    };
    const out: string[] = [];
    const w = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((s: string) => (out.push(String(s)), true)) as typeof process.stdout.write;
    try {
      expect(await main(['--runs', '1'], api)).toBe(0);
    } finally {
      process.stdout.write = w;
    }
    expect(out.join('')).toContain('launch jobs read: 1');
    expect(calls.every((c) => !/logs|artifacts/.test(c))).toBe(true);
    await expect(main(['--repo', 'bad repo'], api)).rejects.toThrow(/owner\/name/);
  });
});
