/**
 * `content` Edge Function routes (ADR 0016, ADR 0017):
 *   GET /content/v1/bundle?locale=en   signed ContentBundle for one locale
 * Public, read-only, cacheable; no user data in or out. The v1.0 interface is
 * English only (decision 6), so `en` is the only published locale for now.
 */
import { CACHE_POLICY } from '../../../packages/api/src/standards.ts';
import { makeDocumentHandler, type ServeOptions } from '../config/serve.ts';

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;

export function makeContentHandler(bundles: Readonly<Record<string, string>>, opts: ServeOptions = {}) {
  return makeDocumentHandler(
    'content',
    {
      'v1/bundle': (url) => {
        const locale = url.searchParams.get('locale') ?? 'en';
        if (!LOCALE_RE.test(locale)) return null;
        const body = Object.prototype.hasOwnProperty.call(bundles, locale) ? bundles[locale] : undefined;
        return body ? { body, cacheControl: CACHE_POLICY.contentBundle } : null;
      },
    },
    opts,
  );
}
