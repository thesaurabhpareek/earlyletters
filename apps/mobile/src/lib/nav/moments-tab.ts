/**
 * The Moments tab flag (spec docs/product/prd/28-moments-tab.md, F1 `EXPO_PUBLIC_MOMENTS_TAB`; ruling CPO-17: Moments is
 * the second of four tabs, Home stays the landing tab). Pure: no React Native, no library read, no network.
 *
 * Off (the default: unset, blank or anything but `on`) the bar is Home, Book, Me exactly as before. The route file exists
 * either way, so the layout hides it (no button, display none) when the flag is off, and the screen sends anyone who reaches
 * it by a link to Home.
 */
import { parseServerFeatures } from '@/lib/capabilities';

/** Inlined at bundle time: Expo only inlines `process.env.EXPO_PUBLIC_*` written out in full. */
export const MOMENTS_TAB_ON: boolean = parseServerFeatures(process.env.EXPO_PUBLIC_MOMENTS_TAB);

/** The visible tab ids, in bar order, for a flag value (CPO-17: Home, Moments, Book, Me). */
export function visibleTabIds(momentsOn: boolean): readonly ('index' | 'moments' | 'book' | 'you')[] {
  return momentsOn ? ['index', 'moments', 'book', 'you'] : ['index', 'book', 'you'];
}

/**
 * The extra Tabs.Screen options: nothing when on; when off, no button and no room in the bar. Never `href`: expo-router's
 * tabs throw "Cannot use `href` and `tabBarButton` together" (build/layouts/TabsClient.js), and the layout sets tabBarButton
 * on iOS. This object is spread last, so its tabBarButton replaces the layout's.
 */
export function momentsTabVisibility(momentsOn: boolean): { tabBarButton?: () => null; tabBarItemStyle?: { display: 'none' } } {
  return momentsOn ? {} : { tabBarButton: () => null, tabBarItemStyle: { display: 'none' } };
}

/**
 * The tab label. `tabs.moments` is a PROPOSED content key owned by `content` (not yet in packages/content); until it
 * lands the placeholder reuses an existing key so no word is invented here. Dark behind the flag, so no parent sees it.
 */
export function momentsTabLabel(tabs: Readonly<Record<string, string>>): string {
  return tabs.moments ?? tabs.book;
}

/**
 * VoiceOver position for a tab. The library counts every route, hidden or not, so with the flag off it would read
 * "Book, tab, 3 of 4" for three visible tabs. This builds the library's own iOS string ("<label>, tab, <i> of <n>") from the
 * visible tabs, so no new words are made here. Flag on: undefined, and the library's default for four tabs stands.
 */
export function tabPositionLabel(id: 'index' | 'moments' | 'book' | 'you', label: string, momentsOn: boolean): string | undefined {
  if (momentsOn) return undefined;
  const ids = visibleTabIds(false);
  const at = ids.indexOf(id);
  return at < 0 ? undefined : `${label}, tab, ${at + 1} of ${ids.length}`;
}

/** The Tabs.Screen option for it: iOS only, where the library adds the position; elsewhere nothing is set. */
export function tabPositionOptions(id: 'index' | 'moments' | 'book' | 'you', label: string, momentsOn: boolean, ios: boolean): { tabBarAccessibilityLabel?: string } {
  const text = ios ? tabPositionLabel(id, label, momentsOn) : undefined;
  return text === undefined ? {} : { tabBarAccessibilityLabel: text };
}
