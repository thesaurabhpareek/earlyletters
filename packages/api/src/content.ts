/**
 * Content blocks, contract version 1 (ADR 0016, founder decision 16).
 *
 * A small, closed vocabulary of typed blocks that the app renders with its
 * own native components. Screens, navigation and behaviour stay in the app;
 * the server can change words, never layout, data collection or the paywall.
 *
 * Block types:
 *  - `prompt`: a writing prompt (mirrors `Prompt` in @scribe/core);
 *  - `tip`: a short hint shown in one fixed placement;
 *  - `story`: an onboarding story card (PRD A section 4) with a bundled
 *    illustration chosen from a closed list (no remote images);
 *  - `announcement`: a dismissible note, optionally linking to an in-app
 *    route from a closed list or a path on the brand website.
 *
 * Text is plain (no markup). The only placeholders are `{child}`, `{app}` and
 * `{signsAs}`. The content rules that a parser can check cheaply are checked
 * here too (no em or en dashes, curly quotes or ellipsis characters), as a
 * second line behind the build-time rules test.
 *
 * Parsing is lenient per block: an unknown type or an invalid block is
 * skipped and counted. The app then falls back to its packaged copy for any
 * slot the server bundle leaves empty.
 */
import * as v from 'valibot';
import { DocVersionSchema, IsoTimestampSchema, LanguageTagSchema, SemverSchema, StableIdSchema } from './common';
import { satisfiesMin } from './semver';

export const CONTENT_SCHEMA_VERSION = 1;

export const ALLOWED_PLACEHOLDERS = ['child', 'app', 'signsAs'] as const;
const PLACEHOLDER_RE = /\{([^{}]*)\}/g;
/** Characters the content rules forbid (CLAUDE.md, VOICE.md): en and em dashes, curly quotes, the ellipsis character. */
const FORBIDDEN_CHARS_RE = /[–—‘’“”…]/;
// No control characters at all, newlines included: every text field is one paragraph.
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

export function textProblems(s: string): string[] {
  const out: string[] = [];
  if (FORBIDDEN_CHARS_RE.test(s)) out.push('forbidden_character');
  if (CONTROL_RE.test(s)) out.push('control_character');
  if (s.trim() !== s || s.length === 0) out.push('whitespace');
  for (const m of s.matchAll(PLACEHOLDER_RE)) {
    if (!(ALLOWED_PLACEHOLDERS as readonly string[]).includes(m[1])) out.push('unknown_placeholder');
  }
  if (/[{}]/.test(s.replace(PLACEHOLDER_RE, ''))) out.push('stray_brace');
  return out;
}

const text = (max: number) => v.pipe(v.string(), v.maxLength(max), v.check((s) => textProblems(s).length === 0, 'text_rules'));

/** Mirrors `PromptBand` and `PromptKind` in @scribe/core (test/content.test.ts asserts they stay equal). */
export const PROMPT_BANDS = ['any', '0-3', '4-6', '7-9', '10-12', '13-18', '19-24', '25-36', '37-60'] as const;
export const PROMPT_KINDS = ['opening', 'gap', 'hard', 'family', 'together'] as const;

export const TIP_PLACEMENTS = ['tonight', 'review', 'book', 'settings'] as const;
/** Illustrations bundled in the app (PRD A section 4 default visuals). Adding one needs an app release. */
export const STORY_VISUALS = ['envelope-fold', 'letter-underline', 'moon', 'two-hands'] as const;
/** In-app destinations an announcement may open. The app maps each to a real route. */
export const ANNOUNCEMENT_ROUTES = ['tonight', 'book', 'family', 'settings', 'settings/storage', 'settings/reminders'] as const;
/** A path on the brand website (the app prefixes the origin from packages/brand). */
export const SITE_PATH_RE = /^\/[a-z0-9][a-z0-9/-]{0,119}$/;

const base = {
  /** Stable key. Never reuse a key for new wording (same rule as prompt keys). */
  id: StableIdSchema,
  /** Hidden on apps older than this. */
  minAppVersion: v.optional(SemverSchema),
};

export const PromptBlockSchema = v.object({
  ...base,
  type: v.literal('prompt'),
  text: text(200),
  band: v.picklist(PROMPT_BANDS),
  kind: v.picklist(PROMPT_KINDS),
});

export const TipBlockSchema = v.object({
  ...base,
  type: v.literal('tip'),
  placement: v.picklist(TIP_PLACEMENTS),
  title: v.optional(text(60)),
  body: text(280),
});

export const StoryBlockSchema = v.object({
  ...base,
  type: v.literal('story'),
  /** 1-based position in the intro. */
  order: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10)),
  headline: text(80),
  line: text(200),
  visual: v.picklist(STORY_VISUALS),
});

export const AnnouncementBlockSchema = v.object({
  ...base,
  type: v.literal('announcement'),
  title: text(60),
  body: text(280),
  startsAt: v.optional(IsoTimestampSchema),
  endsAt: v.optional(IsoTimestampSchema),
  dismissible: v.fallback(v.boolean(), true),
  action: v.optional(
    v.variant('kind', [
      v.object({ kind: v.literal('route'), label: text(22), route: v.picklist(ANNOUNCEMENT_ROUTES) }),
      v.object({ kind: v.literal('site'), label: text(22), path: v.pipe(v.string(), v.regex(SITE_PATH_RE)) }),
    ]),
  ),
});

export const ContentBlockSchema = v.variant('type', [PromptBlockSchema, TipBlockSchema, StoryBlockSchema, AnnouncementBlockSchema]);
export type ContentBlock = v.InferOutput<typeof ContentBlockSchema>;
export type PromptBlock = v.InferOutput<typeof PromptBlockSchema>;
export type TipBlock = v.InferOutput<typeof TipBlockSchema>;
export type StoryBlock = v.InferOutput<typeof StoryBlockSchema>;
export type AnnouncementBlock = v.InferOutput<typeof AnnouncementBlockSchema>;
export type ContentBlockType = ContentBlock['type'];

const ContentBundleTopSchema = v.object({
  schemaVersion: v.literal(CONTENT_SCHEMA_VERSION),
  version: DocVersionSchema,
  generatedAt: IsoTimestampSchema,
  locale: LanguageTagSchema,
  blocks: v.pipe(v.array(v.unknown()), v.maxLength(2000)),
});

export interface ContentBundle {
  schemaVersion: typeof CONTENT_SCHEMA_VERSION;
  version: number;
  generatedAt: string;
  locale: string;
  blocks: ContentBlock[];
}

/** Validates a bundle payload (after its signature was checked). Invalid blocks are skipped and counted. Never throws. */
export function parseContentBundle(
  payload: unknown,
): { ok: true; value: ContentBundle; skipped: number } | { ok: false; reason: 'invalid' } {
  const top = v.safeParse(ContentBundleTopSchema, payload);
  if (!top.success) return { ok: false, reason: 'invalid' };
  const blocks: ContentBlock[] = [];
  const ids = new Set<string>();
  let skipped = 0;
  for (const raw of top.output.blocks) {
    const b = v.safeParse(ContentBlockSchema, raw);
    if (!b.success || ids.has(`${b.output.type}:${b.output.id}`)) {
      skipped++;
      continue;
    }
    ids.add(`${b.output.type}:${b.output.id}`);
    blocks.push(b.output);
  }
  const { schemaVersion: _s, blocks: _b, ...rest } = top.output;
  return { ok: true, value: { schemaVersion: CONTENT_SCHEMA_VERSION, ...rest, blocks }, skipped };
}

/** Blocks of one type that this app version may show at `now` (announcements honour their window). */
export function blocksOf<T extends ContentBlockType>(
  bundle: Pick<ContentBundle, 'blocks'>,
  type: T,
  appVersion: string,
  now: Date = new Date(),
): Extract<ContentBlock, { type: T }>[] {
  const t = now.getTime();
  return bundle.blocks.filter((b): b is Extract<ContentBlock, { type: T }> => {
    if (b.type !== type) return false;
    if (b.minAppVersion && !satisfiesMin(appVersion, b.minAppVersion)) return false;
    if (b.type === 'announcement') {
      if (b.startsAt && Date.parse(b.startsAt) > t) return false;
      if (b.endsAt && Date.parse(b.endsAt) <= t) return false;
    }
    return true;
  });
}
