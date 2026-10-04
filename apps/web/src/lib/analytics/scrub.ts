/**
 * Owner: E3 (release). Runs on every page view and custom event before it leaves the browser
 * (the `beforeSend` hook of Vercel Web Analytics).
 *
 * Page views and events carry the page URL. We cut it down to the path plus, at most, three campaign
 * parameters whose value is a short plain token (letters, digits, hyphen, underscore). Everything else in the
 * query string and the whole fragment is removed, so an address or a name that ends up in a link
 * (for example `?email=...`) is never sent.
 */
import type { BeforeSendEvent } from '@vercel/analytics';

const KEEP = new Set(['ref', 'utm_source', 'utm_medium', 'utm_campaign']);
const PLAIN_TOKEN = /^[A-Za-z0-9_-]{1,30}$/;

export function scrubUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const kept = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (KEEP.has(key) && PLAIN_TOKEN.test(value)) kept.set(key, value);
    }
    url.search = kept.toString();
    url.hash = '';
    return url.toString();
  } catch {
    // Not a parseable URL: keep only what comes before any query or fragment.
    return raw.split(/[?#]/)[0] ?? '';
  }
}

export function scrubEvent(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: scrubUrl(event.url) };
}
