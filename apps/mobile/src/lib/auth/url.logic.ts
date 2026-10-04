/**
 * A small, strict URL splitter for incoming links. Pure (no URL polyfill), so
 * the same code runs in Node tests and on the phone. Only what link routing
 * needs: scheme, host, path, query and fragment parameters.
 *
 * Never log a URL that came from outside: invite and sign-in links carry
 * secrets (LEGAL-REQ-014, A-NFR-012).
 */
export interface SplitUrl {
  /** Lowercase, without ':' ("https", "scribe"). */
  scheme: string;
  /** Lowercase host, '' for scheme URLs without one. */
  host: string;
  /** Always starts with '/'; percent-decoding is not applied. */
  path: string;
  query: Record<string, string>;
  fragment: Record<string, string>;
}

function params(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of s.split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const k = i < 0 ? part : part.slice(0, i);
    const v = i < 0 ? '' : part.slice(i + 1);
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      // Malformed escapes: keep the raw value rather than throwing on a link.
      out[k] = v;
    }
  }
  return out;
}

export function splitUrl(raw: string): SplitUrl | null {
  const url = raw.trim();
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/s.exec(url);
  if (!m) return null;
  const scheme = m[1].toLowerCase();
  let rest = m[2];

  let fragment = '';
  const hashAt = rest.indexOf('#');
  if (hashAt >= 0) {
    fragment = rest.slice(hashAt + 1);
    rest = rest.slice(0, hashAt);
  }
  let query = '';
  const qAt = rest.indexOf('?');
  if (qAt >= 0) {
    query = rest.slice(qAt + 1);
    rest = rest.slice(0, qAt);
  }

  let host = '';
  let path = rest;
  if (rest.startsWith('//')) {
    const afterSlashes = rest.slice(2);
    const slashAt = afterSlashes.indexOf('/');
    const authority = slashAt < 0 ? afterSlashes : afterSlashes.slice(0, slashAt);
    path = slashAt < 0 ? '/' : afterSlashes.slice(slashAt);
    // Drop userinfo and port: links we act on never have them, and a userinfo trick must not pass a host check.
    if (authority.includes('@')) return null;
    host = authority.replace(/:\d+$/, '').toLowerCase();
  }
  if (!path.startsWith('/')) path = `/${path}`;
  return { scheme, host, path, query: params(query), fragment: params(fragment) };
}

/** Host of an https origin such as "https://earlyletters.com" -> "earlyletters.com". */
export function originHost(origin: string): string {
  return splitUrl(origin)?.host ?? '';
}
