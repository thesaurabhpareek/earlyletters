/**
 * The source registry (NS-53-R36): each source lists its surfaces as data. The library source never lists push,
 * email or a widget; no source lists email without a founder decision id.
 */
import { describe, expect, it } from 'vitest';
import { assertRegistry, SOURCES, type SourceSpec } from '../../src/moments/registry';

const find = (id: string) => SOURCES.find((s) => s.id === id)!;
const withSource = (id: string, patch: Partial<SourceSpec>): SourceSpec[] => SOURCES.map((s) => (s.id === id ? { ...s, ...patch } : s));

describe('[NS-53-R36] the shipped registry', () => {
  it('passes its own check (the check runs here, in the tests, not when the app loads)', () => {
    expect(() => assertRegistry(SOURCES)).not.toThrow();
  });
  it('has S1 to S7 and the holiday table, each once', () => {
    expect(SOURCES.map((s) => s.id)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'H']);
  });
  it('makes only S1, S2, S3 and S6 pushSafe, and only S3 serverSafe', () => {
    expect(SOURCES.filter((s) => s.pushSafe).map((s) => s.id)).toEqual(['S1', 'S2', 'S3', 'S6']);
    expect(SOURCES.filter((s) => s.serverSafe).map((s) => s.id)).toEqual(['S3']);
  });
  it('lists push exactly where pushSafe holds, and email nowhere in the first release', () => {
    for (const s of SOURCES) {
      expect(s.surfaces.includes('push')).toBe(s.pushSafe);
      expect(s.surfaces).not.toContain('email');
      expect(s.surfaces).not.toContain('widget');
      expect(s.surfaces).toContain('card');
    }
  });
  it('gives the library (S7) the card surface only', () => {
    expect(find('S7').surfaces).toEqual(['card']);
    expect(find('S7').pushSafe).toBe(false);
    expect(find('S7').serverSafe).toBe(false);
  });
  it('is frozen, so a caller cannot widen a surface at run time', () => {
    expect(Object.isFrozen(SOURCES) && SOURCES.every((s) => Object.isFrozen(s) && Object.isFrozen(s.surfaces))).toBe(true);
  });
});

describe('[NS-53-R36] the check fails the build for a wrong registry', () => {
  it.each(['push', 'email', 'widget'] as const)('fails when the library source lists %s', (surface) => {
    expect(() => assertRegistry(withSource('S7', { surfaces: ['card', surface] }))).toThrow('moments_registry_invalid');
  });
  it('fails when the library source is marked pushSafe or serverSafe', () => {
    expect(() => assertRegistry(withSource('S7', { pushSafe: true }))).toThrow('moments_registry_invalid');
    expect(() => assertRegistry(withSource('S7', { serverSafe: true }))).toThrow('moments_registry_invalid');
  });
  it('fails when any source lists email without a founder decision id', () => {
    expect(() => assertRegistry(withSource('S3', { surfaces: ['card', 'push', 'email'] }))).toThrow('moments_registry_invalid');
    expect(() => assertRegistry(withSource('S3', { surfaces: ['card', 'push', 'email'], emailDecisionId: '' }))).toThrow('moments_registry_invalid');
  });
  it('allows email on a serverSafe source that carries a decision id', () => {
    expect(() => assertRegistry(withSource('S3', { surfaces: ['card', 'push', 'email'], emailDecisionId: 'D-999' }))).not.toThrow();
  });
  it('fails email on a source that is not serverSafe even with a decision id', () => {
    expect(() => assertRegistry(withSource('S1', { surfaces: ['card', 'push', 'email'], emailDecisionId: 'D-999' }))).toThrow('moments_registry_invalid');
  });
  it('fails when push is listed without pushSafe', () => {
    expect(() => assertRegistry(withSource('S4', { surfaces: ['card', 'push'] }))).toThrow('moments_registry_invalid');
  });
  it('fails on a duplicate id or an unknown surface, and the message never carries data', () => {
    expect(() => assertRegistry([...SOURCES, SOURCES[0]])).toThrow('moments_registry_invalid');
    expect(() => assertRegistry(withSource('S1', { surfaces: ['card', 'sms' as never] }))).toThrow('moments_registry_invalid');
  });
});
