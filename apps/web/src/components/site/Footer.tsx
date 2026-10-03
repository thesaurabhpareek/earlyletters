/** Owner: E1 (web platform). Legal links and contact. Stub. */
import { site } from '@/content/site';

export function Footer() {
  return (
    <footer style={{ background: 'var(--night)', color: 'var(--night-ink-muted)', padding: '48px var(--gutter)' }}>
      <nav aria-label="Legal">
        {site.footer.links.map((l) => (
          <a key={l.href} href={l.href} style={{ marginRight: 20 }}>{l.label}</a>
        ))}
      </nav>
    </footer>
  );
}
