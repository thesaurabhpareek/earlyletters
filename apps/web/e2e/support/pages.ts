/** Every page the site has, for the specs that visit them all. */
import { legalSlugs } from '../../src/lib/legal/documents';
import { unsubscribeToken } from './fixtures';

/** A well-formed token for a contact that does not exist: the confirm page checks the signature only, so it renders its form. */
const VALID_TOKEN = unsubscribeToken('11111111-2222-3333-4444-555555555555');

export type SitePage = { name: string; path: string; status: number };

export const PAGES: SitePage[] = [
  { name: 'home', path: '/', status: 200 },
  ...legalSlugs.map((slug) => ({ name: slug, path: `/${slug}`, status: 200 })),
  { name: 'delete-account', path: '/delete-account', status: 200 },
  { name: 'unsubscribe, no token', path: '/unsubscribe', status: 200 },
  { name: 'unsubscribe, confirm', path: `/unsubscribe?t=${encodeURIComponent(VALID_TOKEN)}`, status: 200 },
  { name: 'unsubscribe, could not send', path: `/unsubscribe?t=${encodeURIComponent(VALID_TOKEN)}&error=1`, status: 200 },
  { name: 'unsubscribe, done', path: '/unsubscribe?done=1', status: 200 },
  { name: '404', path: '/this-page-does-not-exist', status: 404 },
];
