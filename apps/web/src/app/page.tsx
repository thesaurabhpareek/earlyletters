import { Film } from '@/film/Film';
import { Landing } from '@/components/landing/Landing';
import { footerLinks } from '@/lib/legal/links';
import { resolveSiteMode } from '@/lib/site-mode';

/** Production shows the organised home page (Landing) until SITE_MODE=film is set; previews show the film. See lib/site-mode.ts. */
const comingSoon = resolveSiteMode(process.env) === 'coming-soon';

export default async function Home() {
  // The footer's legal links, after the gate (lib/legal/links.ts): read at build, the page stays static.
  const legalLinks = await footerLinks();
  return comingSoon ? <Landing legalLinks={legalLinks} /> : <Film footerLinks={legalLinks} />;
}
