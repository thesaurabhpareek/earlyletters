/**
 * The approved horizontal lockup: two opening quotation marks and the wordmark (brand registry
 * `logo.lockup.horizontal.ink`, context web.header). Drawn inline in currentColor, so one drawing serves every tone
 * the header takes (night, paper, dusk), 28 px tall as the context's rule asks. The paths come from the master
 * through scripts/web/sync-brand-assets.mjs (lockup.generated.ts); nothing here redraws or restyles the mark.
 *
 * This cut is for 27 px and taller (the registry's minimum); smaller places need the small cut, which is not on the
 * site yet. Inside a link that already carries the name, leave `label` off and the drawing stays out of the
 * accessibility tree; on its own, pass `label` and it reads as the brand name.
 */
import { brand } from '@scribe/brand';
import { lockupHorizontal as L } from './lockup.generated';

export const LOCKUP_HEIGHT = 28;

export function Lockup({ label = false, className }: { label?: boolean; className?: string }) {
  const width = Math.round(((L.width / L.height) * LOCKUP_HEIGHT) * 100) / 100;
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={L.viewBox}
      width={width}
      height={LOCKUP_HEIGHT}
      fill="currentColor"
      focusable="false"
      style={{ display: 'block' }}
      {...(label ? { role: 'img', 'aria-label': brand.name } : { 'aria-hidden': true })}
    >
      {L.paths.map((p) => (
        <path key={p.d.slice(0, 24)} transform={'transform' in p ? p.transform : undefined} d={p.d} />
      ))}
    </svg>
  );
}
