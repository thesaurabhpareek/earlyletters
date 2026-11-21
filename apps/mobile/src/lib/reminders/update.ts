/**
 * Re-plan once after an app update (BL-966c; NS-32-R16, NS-13-R21). The setting `app.lastPlannedVersion` holds the
 * app version the pending list was last planned by. When it differs from the running version, the whole list is
 * planned again (new words, a new category and level reach notifications iOS already holds), then the version is
 * kept. Run after the first frame and never awaited (L-03). A failed re-plan keeps the old version, so the next
 * launch tries again. Holds a version string only.
 */
export const LAST_PLANNED_VERSION_KEY = 'app.lastPlannedVersion';

export async function replanAfterUpdate(deps: {
  current: string;
  read: () => string | null;
  write: (v: string) => void;
  replan: () => Promise<{ ok: boolean }>;
}): Promise<boolean> {
  if (deps.read() === deps.current) return false;
  const r = await deps.replan();
  if (r.ok) deps.write(deps.current);
  return r.ok;
}
