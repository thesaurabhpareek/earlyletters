/**
 * Weekly insights report (founder decision 12; docs/analytics/INSIGHTS_LOOP.md).
 *
 *   npm run insights -w @scribe/analytics -- --dry-run            synthetic data, prints the report
 *   npm run insights -w @scribe/analytics -- --dry-run --out <dir>
 *   npm run insights -w @scribe/analytics                         real sources, writes docs/insights/YYYY-MM-DD.md
 *
 * Options: --date YYYY-MM-DD (default today, UTC), --weeks N (default 12),
 * --out DIR (default docs/insights for a real run; stdout for a dry run).
 *
 * Environment for a real run (read-only credentials; never commit them):
 *   POSTHOG_API_HOST           https://us.posthog.com (private API host, not us.i.posthog.com)
 *   POSTHOG_PROJECT_ID         numeric project id
 *   POSTHOG_PERSONAL_API_KEY   personal API key with the Query Read scope only
 *   SUPABASE_URL               https://<project>.supabase.co
 *   SUPABASE_PUBLISHABLE_KEY   the publishable (anon) key
 *   SUPABASE_INSIGHTS_TOKEN    bearer for role insights_reader (see INSIGHTS_LOOP.md 4)
 * Either source may be missing; the report says which ones it used. With
 * neither, the run stops.
 *
 * Output never contains user content: the engine works on counts and
 * catalogue enum values, and `assertContentFree` refuses the file otherwise.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  assertContentFree,
  computeInsights,
  fetchPostHog,
  fetchServer,
  renderReport,
  syntheticInput,
  type DeviceData,
  type FetchLike,
  type InsightsInput,
  type ServerAggregates,
} from '../../packages/analytics/src/insights';

export interface RunOptions {
  dryRun: boolean;
  date: string;
  weeks: number;
  out: string | null;
  env: Record<string, string | undefined>;
  fetch: FetchLike;
  log: (line: string) => void;
}

const REPO = resolve(__dirname, '..', '..');

export function parseArgs(argv: string[], now = new Date()): Pick<RunOptions, 'dryRun' | 'date' | 'weeks' | 'out'> {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const date = get('--date') ?? now.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date must be YYYY-MM-DD');
  const weeks = Number(get('--weeks') ?? 12);
  if (!Number.isInteger(weeks) || weeks < 4 || weeks > 104) throw new Error('--weeks must be 4 to 104');
  return { dryRun: argv.includes('--dry-run'), date, weeks, out: get('--out') ?? null };
}

/** Returns the report text and, when written, its path. */
export async function run(o: RunOptions): Promise<{ markdown: string; path: string | null }> {
  let input: InsightsInput;
  if (o.dryRun) {
    input = syntheticInput(o.date, { weeks: o.weeks });
  } else {
    const e = o.env;
    let device: DeviceData | null = null;
    let server: ServerAggregates | null = null;
    if (e.POSTHOG_PERSONAL_API_KEY && e.POSTHOG_PROJECT_ID) {
      device = await fetchPostHog(
        { apiHost: e.POSTHOG_API_HOST ?? 'https://us.posthog.com', projectId: e.POSTHOG_PROJECT_ID, apiKey: e.POSTHOG_PERSONAL_API_KEY, weeks: o.weeks },
        o.fetch,
      );
      o.log(`posthog: ${device.rows.length} rows, ${device.funnel.length} funnel weeks`);
    } else o.log('posthog: not configured, skipped');
    if (e.SUPABASE_URL && e.SUPABASE_PUBLISHABLE_KEY && e.SUPABASE_INSIGHTS_TOKEN) {
      server = await fetchServer({ url: e.SUPABASE_URL, publishableKey: e.SUPABASE_PUBLISHABLE_KEY, bearer: e.SUPABASE_INSIGHTS_TOKEN, weeks: o.weeks }, o.fetch);
      o.log(`server: ${server.weekly_keeping_families.length} weeks`);
    } else o.log('server: not configured, skipped');
    if (!device && !server) throw new Error('no source configured: set the PostHog or Supabase variables, or use --dry-run');
    input = { date: o.date, server, device };
  }

  const markdown = renderReport(computeInsights(input));
  assertContentFree(markdown);

  const outDir = o.out ?? (o.dryRun ? null : join(REPO, 'docs', 'insights'));
  if (!outDir) return { markdown, path: null };
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, `${o.date}.md`);
  writeFileSync(path, markdown);
  return { markdown, path };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { markdown, path } = await run({
    ...args,
    env: process.env,
    fetch: (url, init) => globalThis.fetch(url, init),
    log: (l) => console.error(l),
  });
  if (path) console.error(`wrote ${path}`);
  else process.stdout.write(markdown);
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  main().catch((e: unknown) => {
    // Our errors carry only a code, status and query name.
    console.error(e instanceof Error ? e.message : 'insights_failed');
    process.exit(1);
  });
}
