/**
 * Five small line icons for the privacy promises (S09), in the same thin hairline hand as the drawings.
 * Decorative: each promise is fully said in words, so the svgs are hidden from assistive tech.
 * Order matches site.scenes.s09.points: invite only, no ads, never trains AI, export, delete.
 */
import type { ReactElement } from 'react';

const PATHS: ReactElement[] = [
  // A lock: only the people you invite.
  <g key="lock">
    <rect x="5.2" y="10.6" width="13.6" height="9.6" rx="2.2" />
    <path d="M8.4 10.6V8a3.6 3.6 0 0 1 7.2 0v2.6" />
    <path d="M12 14.6v2" />
  </g>,
  // A circle with a slash: no ads, nothing sold.
  <g key="noads">
    <circle cx="12" cy="12" r="8" />
    <path d="M6.4 17.6 17.6 6.4" />
  </g>,
  // A shield with a tick: kept out of AI training.
  <g key="shield">
    <path d="M12 3.6 5.2 6.2v5.4c0 4 2.8 7 6.8 8.8 4-1.8 6.8-4.8 6.8-8.8V6.2L12 3.6Z" />
    <path d="m9 12 2.2 2.2L15.2 10" />
  </g>,
  // An arrow leaving a tray: export.
  <g key="export">
    <path d="M12 15V4.6" />
    <path d="m8.2 8.2 3.8-3.8 3.8 3.8" />
    <path d="M5 14.4v3.2c0 1 .8 1.8 1.8 1.8h10.4c1 0 1.8-.8 1.8-1.8v-3.2" />
  </g>,
  // A bin: delete.
  <g key="bin">
    <path d="M4.8 7h14.4" />
    <path d="M9.4 7V5.2c0-.7.5-1.2 1.2-1.2h2.8c.7 0 1.2.5 1.2 1.2V7" />
    <path d="M6.8 7l.8 11.2c.1 1 .9 1.8 1.9 1.8h5c1 0 1.8-.8 1.9-1.8L17.2 7" />
    <path d="M10 10.8v5.2M14 10.8v5.2" />
  </g>,
];

export function PromiseIcon({ index, className }: { index: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[index % PATHS.length]}
    </svg>
  );
}
