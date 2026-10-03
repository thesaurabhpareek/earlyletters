import { Film } from '@/film/Film';
import { ComingSoon } from '@/components/site/ComingSoon';
import { resolveSiteMode } from '@/lib/site-mode';

/** Production shows the holding page until SITE_MODE=film is set; previews show the film. See lib/site-mode.ts. */
const comingSoon = resolveSiteMode(process.env) === 'coming-soon';

export default function Home() {
  return comingSoon ? <ComingSoon /> : <Film />;
}
