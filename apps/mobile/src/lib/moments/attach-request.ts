/**
 * NS-53-R88 (PR 18a, BL-1473): every route into a letter (the day sheet, the system picker, later Route A) ends in
 * one `AttachRequest` handed to one stripper per media type. Pure TypeScript: no import, no native code. The picker
 * producer (`scribe-picker`, R271) and the library producer (`exportForAttach`, R220) land in later PRs and cite
 * these types. The request holds names only: no words, id, path, coordinate or time.
 */

export type AttachKind = 'image' | 'video';

/** A plain name of a file inside the picker's Caches folder. The producer wrote it; the strip reads it. */
export interface AttachItem {
  readonly source: 'picked' | 'library';
  readonly name: string;
  readonly kind: AttachKind;
}

export interface AttachRequest {
  readonly items: readonly AttachItem[];
  /** 'YYYY-MM-DD' for the day chip, or null. Never preselected from a picture. */
  readonly day: string | null;
}

/** Local closed codes. They never reach analytics (R282). */
export type AttachCode =
  | 'attach_empty'
  | 'attach_limit'
  | 'attach_bad_name'
  | 'attach_duplicate'
  | 'attach_bad_day'
  | 'attach_kind_unsupported';

export type AttachCheck = { ok: true } | { ok: false; code: AttachCode };

/** The same shape as `PLAIN_NAME` in `lib/photos/files.ts` (a test pins that they agree). */
export const ATTACH_PLAIN_NAME = /^[0-9A-Za-z-]{1,64}\.[0-9A-Za-z]{1,8}$/;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
function realDay(s: string): boolean {
  const m = DAY.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/**
 * The limit is the caller's (the code holds one picture per letter today, R90 plans more: founder item O-62), so no
 * number is fixed here. `kinds` defaults to images only; video joins when its stripper ships (PR 18c).
 */
export function checkAttachRequest(
  req: AttachRequest,
  opts: { limit: number; kinds?: readonly AttachKind[] },
): AttachCheck {
  const kinds = opts.kinds ?? ['image'];
  if (req.items.length === 0) return { ok: false, code: 'attach_empty' };
  if (req.items.length > opts.limit) return { ok: false, code: 'attach_limit' };
  const seen = new Set<string>();
  for (const it of req.items) {
    if (!ATTACH_PLAIN_NAME.test(it.name)) return { ok: false, code: 'attach_bad_name' };
    if (seen.has(it.name)) return { ok: false, code: 'attach_duplicate' };
    seen.add(it.name);
  }
  if (req.day !== null && !realDay(req.day)) return { ok: false, code: 'attach_bad_day' };
  if (req.items.some((it) => !kinds.includes(it.kind))) return { ok: false, code: 'attach_kind_unsupported' };
  return { ok: true };
}

/**
 * The one stripper of a media type. It reads the plain name the producer wrote, writes a metadata-free copy and
 * returns that copy's plain name. For images the implementation is `reencodeUpright` in `scribe-photo`, unchanged.
 * It never deletes the original: the caller removes it through `PickedFiles.remove` (R272).
 */
export interface AttachStripper {
  readonly kind: AttachKind;
  strip(name: string): Promise<{ readonly name: string }>;
}

/** Exactly one stripper per kind. None is an error, so a picture or video can never reach storage unstripped. */
export function stripperFor(kind: AttachKind, strippers: readonly AttachStripper[]): AttachStripper {
  const found = strippers.filter((s) => s.kind === kind);
  if (found.length === 0) throw new Error('attach_no_stripper');
  if (found.length > 1) throw new Error('attach_two_strippers');
  return found[0];
}
