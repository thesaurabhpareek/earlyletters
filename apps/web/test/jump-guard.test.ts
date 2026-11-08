import { describe, expect, it } from 'vitest';
import { JUMP_MS, makeJumpGuard } from '../src/film/jump-guard';

describe('jump guard', () => {
  it('is quiet until a jump is marked, so manual scrolling keeps its tick', () => {
    let now = 0;
    const g = makeJumpGuard(() => now);
    expect(g.active()).toBe(false);
    now = 5000;
    expect(g.active()).toBe(false);
  });
  it('is active for the length of a jump and then lets ticks through again', () => {
    let now = 1000;
    const g = makeJumpGuard(() => now);
    g.mark();
    now += JUMP_MS - 1;
    expect(g.active()).toBe(true);
    now += 2;
    expect(g.active()).toBe(false);
  });
  it('a second press extends the window and a shorter one never shortens it', () => {
    let now = 0;
    const g = makeJumpGuard(() => now);
    g.mark(2000);
    now = 1500;
    g.mark(100);
    expect(g.active()).toBe(true);
    now = 1999;
    expect(g.active()).toBe(true);
    now = 2001;
    expect(g.active()).toBe(false);
  });
  it('covers Lenis (1.5 s) with room to settle', () => {
    expect(JUMP_MS).toBeGreaterThanOrEqual(1700);
  });
});
