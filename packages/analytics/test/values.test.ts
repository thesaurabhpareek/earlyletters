import { describe, expect, it } from 'vitest';
import * as catalog from '../src/catalog';
import { isPiiLike } from '../src/pii';
import { ROUTE_MAP } from '../src/routes';
import * as values from '../src/values';

const exported = Object.entries(values);
const enums = exported.filter(([, v]) => !Array.isArray(v)) as [string, { type: 'enum'; values: readonly string[] }][];

const ENUM_SHAPE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

describe('values.ts (shared value sets)', () => {
  it('exports the value sets and the language list', () => {
    expect(enums.length).toBe(26);
    expect(values.V1_LANGUAGES).toEqual(values.LANG.values);
  });

  for (const [name, spec] of enums) {
    describe(name, () => {
      it('is a level L2 enum with at least one value and no duplicate', () => {
        expect(spec.type).toBe('enum');
        expect((spec as { level?: string }).level).toBe('L2');
        expect(spec.values.length).toBeGreaterThan(0);
        expect(new Set(spec.values).size).toBe(spec.values.length);
      });

      it('holds only closed-list shaped values: snake_case, 40 characters or fewer, nothing PII-like', () => {
        for (const v of spec.values) {
          expect(v, `${name}.${v}`).toMatch(ENUM_SHAPE);
          expect(v.length, `${name}.${v}`).toBeLessThanOrEqual(40);
          expect(isPiiLike(v), `${name}.${v}`).toBe(false);
        }
      });
    });
  }

  it('is identical to the copy still defined in catalog.ts, so the two cannot drift before P5 removes one', () => {
    for (const [name, value] of exported) {
      expect(Object.prototype.hasOwnProperty.call(catalog, name), `catalog.ts lacks ${name}`).toBe(true);
      expect((catalog as Record<string, unknown>)[name], name).toEqual(value);
    }
  });

  it('covers every route that routes.ts can send, and every route has a template', () => {
    const mapped = new Set(Object.values(ROUTE_MAP));
    for (const r of mapped) expect(values.ROUTE.values, r).toContain(r);
    for (const r of values.ROUTE.values) expect(mapped.has(r), `no template for ${r}`).toBe(true);
  });

  it('holds exactly the seven v1.0 spoken languages and nothing else', () => {
    expect([...values.LANG.values].sort()).toEqual(['ar', 'en', 'es', 'fr', 'hi', 'pt', 'zh']);
  });

  it('names no pack, route or error that carries a file name, a URL or a person', () => {
    for (const set of [values.PACK_ID, values.ROUTE, values.ERROR_CODE, values.PACK_FAILURE]) {
      for (const v of set.values) expect(v).not.toMatch(/\.|\/|asha/i);
    }
  });
});
