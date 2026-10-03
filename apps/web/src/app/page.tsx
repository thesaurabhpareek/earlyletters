import { Film } from '@/film/Film';
import { ComingSoon } from '@/components/site/ComingSoon';

/** SITE_MODE=coming-soon (set on Production in Vercel) shows the holding page; previews show the film. */
const comingSoon = process.env.SITE_MODE === 'coming-soon';

export default function Home() {
  return comingSoon ? <ComingSoon /> : <Film />;
}
