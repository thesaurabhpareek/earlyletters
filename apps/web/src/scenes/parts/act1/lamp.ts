/**
 * Where the bedside lamp's light pools, shared by S01 and S02 so the handoff matches exactly.
 * Kept in step with .lamp in S01Evening.module.css and S02Minute.module.css.
 */
export function lampPool(w: number) {
  const narrow = w < 900;
  return narrow
    ? { x: '24%', y: '84%', size: '115vmax', fx: 0.24, fy: 0.84 }
    : { x: '24%', y: '80%', size: '82vmax', fx: 0.24, fy: 0.8 };
}
