import { getCollection, type CollectionEntry } from 'astro:content';

/** Reading order for legal links. Unknown documents follow, by title. */
const ORDER = ['terms', 'privacy', 'subscription-terms', 'health-privacy', 'subprocessors'];

export async function legalDocs(): Promise<CollectionEntry<'legal'>[]> {
  const rank = (d: CollectionEntry<'legal'>) => d.data.order ?? (ORDER.includes(d.id) ? ORDER.indexOf(d.id) : 50);
  return (await getCollection('legal')).sort((a, b) => rank(a) - rank(b) || a.data.title.localeCompare(b.data.title));
}
