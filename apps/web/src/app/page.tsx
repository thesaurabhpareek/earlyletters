import { Film } from '@/film/Film';
import { Landing } from '@/components/landing/Landing';
import { resolveSiteMode } from '@/lib/site-mode';

/** Production shows the organised home page (Landing) until SITE_MODE=film is set; previews show the film. See lib/site-mode.ts. */
const comingSoon = resolveSiteMode(process.env) === 'coming-soon';

export default function Home() {
  return comingSoon ? <Landing /> : <Film />;
}
