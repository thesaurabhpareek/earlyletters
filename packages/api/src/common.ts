/**
 * Shared field schemas. Regexes rather than `URL` or `Intl` so parsing is the
 * same on Hermes, Node and Deno.
 */
import * as v from 'valibot';
import { SEMVER_RE } from './semver';
import { SHA256_HEX_RE } from './integrity';

export const SemverSchema = v.pipe(v.string(), v.regex(SEMVER_RE));
export const Sha256Schema = v.pipe(v.string(), v.regex(SHA256_HEX_RE));
export const IsoTimestampSchema = v.pipe(v.string(), v.maxLength(40), v.isoTimestamp());

/** https only, printable ASCII, no spaces, no credentials, at most 1024 characters. */
export const HTTPS_URL_RE = /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{2,5})?(\/[\x21-\x7e]*)?$/i;
export const HttpsUrlSchema = v.pipe(v.string(), v.maxLength(1024), v.regex(HTTPS_URL_RE));

/**
 * BCP 47 language tag as we use them: a 2 or 3 letter primary subtag, then
 * optional script or region subtags (`pt`, `pt-BR`, `zh-Hans`, `hi`), or
 * `mul` for a multilingual pack (ISO 639-2 "multiple languages").
 */
export const LANGUAGE_TAG_RE = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|[0-9]{3}))?$/;
export const LanguageTagSchema = v.pipe(v.string(), v.regex(LANGUAGE_TAG_RE));

/** Monotonic document version: an integer, 1 or more. */
export const DocVersionSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2_000_000_000));

/** Stable machine ids: lowercase letters, digits, dots and hyphens. */
export const STABLE_ID_RE = /^[a-z0-9][a-z0-9.-]{0,79}$/;
export const StableIdSchema = v.pipe(v.string(), v.regex(STABLE_ID_RE));
