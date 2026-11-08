/** A generic status bar: time left, signal and battery right. */
import { u } from './units';

export function StatusBar() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: u(54),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${u(6)} ${u(34)} 0 ${u(40)}`,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: u(16),
        letterSpacing: '0.01em',
        zIndex: 4,
      }}
    >
      <span>9:41</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: u(6) }}>
        <svg viewBox="0 0 18 12" style={{ width: u(17), height: u(11) }} fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 27 13" style={{ width: u(25), height: u(12) }} fill="none" stroke="currentColor">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" opacity="0.45" />
          <rect x="2.5" y="2.5" width="16" height="8" rx="2" fill="currentColor" stroke="none" />
          <path d="M25.5 4.5v4" strokeLinecap="round" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}
