/** earlyletters.app and the www names answer with a permanent redirect to earlyletters.com; nothing else does. */
import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';

async function rules() {
  return (await nextConfig.redirects?.()) ?? [];
}

describe('domain redirects', () => {
  it('sends .app and the www names to the primary domain, keeping the path', async () => {
    const hosts = (await rules()).map((r) => (r.has?.[0] as { value: string }).value).sort();
    expect(hosts).toEqual(['earlyletters.app', 'www.earlyletters.app', 'www.earlyletters.com']);
    for (const r of await rules()) {
      expect(r.source).toBe('/:path*');
      expect(r.destination).toBe('https://earlyletters.com/:path*');
      expect('permanent' in r && r.permanent).toBe(true);
    }
  });

  it('never redirects the primary domain to itself', async () => {
    const hosts = (await rules()).flatMap((r) => (r.has ?? []).map((h) => (h as { value?: string }).value));
    expect(hosts).not.toContain('earlyletters.com');
    expect((await rules()).every((r) => (r.has ?? []).length === 1)).toBe(true);
  });
});
