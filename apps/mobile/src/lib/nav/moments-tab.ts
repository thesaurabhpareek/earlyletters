/**
 * The Moments tab flag (spec docs/product/prd/28-moments-tab.md, F1 `EXPO_PUBLIC_MOMENTS_TAB`; ruling CPO-17: Moments is
 * the second of four tabs, Home stays the landing tab). Pure: no React Native, no library read, no network.
 *
 * Off (the default: unset, blank or anything but `on`) the bar is Home, Book, Me exactly as before. The route file exists
 * either way, so the layout hides it with `href: null` when the flag is off, and the screen sends anyone who reaches
 * it by a link to Home.
 */
import { parseServerFeatures } from '@/lib/capabilities';

/** Inlined at bundle time: Expo only inlines `process.env.EXPO_PUBLIC_*` written out in full. */
export const MOMENTS_TAB_ON: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_MOMENTS_TAB);

/** The visible tab ids, in bar order, for a flag value (CPO-17: Home, Moments, Book, Me). */
export function visibleTabIds(momentsOn: boolean): readonly ('index' | 'moments' | 'book' | 'you')[] {
  return momentsOn ? ['index', 'moments', 'book', 'you'] : ['index', 'book', 'you'];
}

/** The extra Tabs.Screen options: nothing when on, hidden from the bar when off. */
export function momentsTabVisibility(momentsOn: boolean): { href?: null } {
  return momentsOn ? {} : { href: null };
}

/**
 * The tab label. `tabs.moments` is a PROPOSED content key owned by `content` (not yet in packages/content); until it
 * lands the placeholder reuses an existing key so no word is invented here. Dark behind the flag, so no parent sees it.
 */
export function momentsTabLabel(tabs: Readonly<Record<string, string>>): string {
  return tabs.moments ?? tabs.book;
}
