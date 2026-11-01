/**
 * Canonical JSON for signatures (ADR 0016).
 *
 * The bytes that are signed must be the same on the signing laptop (Node) and
 * on the phone (Hermes) whatever order a JSON parser kept keys in. Rules, a
 * subset of RFC 8785 (JCS) that is exact for the values our documents hold:
 *  - objects: keys sorted by UTF-16 code units (JavaScript's default sort),
 *    no whitespace; keys whose value is `undefined` are omitted, as
 *    JSON.stringify does;
 *  - arrays: in order, no whitespace;
 *  - strings: JSON.stringify escaping (the JCS rule);
 *  - numbers: finite only, JSON.stringify form (the ECMAScript shortest
 *    round-trip form, the JCS rule); -0 is written as 0;
 *  - booleans and null as themselves.
 * Anything else (functions, symbols, bigint, NaN, Infinity, cycles) throws, so
 * a document that cannot be canonicalised can never be signed or verified.
 */

export class CanonicalJsonError extends Error {
  override readonly name = 'CanonicalJsonError';
}

export function canonicalJson(value: unknown): string {
  const seen = new Set<object>();
  const walk = (v: unknown): string => {
    if (v === null) return 'null';
    switch (typeof v) {
      case 'boolean':
        return v ? 'true' : 'false';
      case 'number':
        if (!Number.isFinite(v)) throw new CanonicalJsonError('non_finite_number');
        return Object.is(v, -0) ? '0' : JSON.stringify(v);
      case 'string':
        return JSON.stringify(v);
      case 'object': {
        if (seen.has(v as object)) throw new CanonicalJsonError('cycle');
        seen.add(v as object);
        let out: string;
        if (Array.isArray(v)) {
          out = `[${v.map((item) => (item === undefined ? 'null' : walk(item))).join(',')}]`;
        } else {
          const proto = Object.getPrototypeOf(v);
          if (proto !== Object.prototype && proto !== null) throw new CanonicalJsonError('not_plain_object');
          const keys = Object.keys(v as Record<string, unknown>)
            .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
            .sort();
          out = `{${keys.map((k) => `${JSON.stringify(k)}:${walk((v as Record<string, unknown>)[k])}`).join(',')}}`;
        }
        seen.delete(v as object);
        return out;
      }
      default:
        throw new CanonicalJsonError(`unsupported_${typeof v}`);
    }
  };
  return walk(value);
}
