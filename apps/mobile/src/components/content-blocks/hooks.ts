/**
 * Content hooks for screens: the server's signed content blocks when present,
 * the packaged copy in @scribe/content otherwise (ADR 0016, decision 16).
 * Screens never know which one they got.
 */
import { useMemo, useState } from 'react';
import type { AnnouncementBlock, TipBlock } from '@scribe/api';
import { onboardingStories, PROMPTS } from '@scribe/content';
import type { Prompt } from '@scribe/core';
import { getSetting, setSetting } from '@/lib/store';
import { APP_VERSION, useContentBundle, useRemoteConfig } from '@/lib/remote';
import { liveAnnouncements, promptLibrary, storyCards, tipsFor, type ContentContext, type StoryCardLike } from '@/lib/remote/content.logic';

const DISMISSED_KEY = 'content.dismissed';
const MAX_DISMISSED = 100;

function useContext(): ContentContext {
  const server = useContentBundle();
  const config = useRemoteConfig();
  return useMemo(
    () => ({ server, serverContentKilled: config.killSwitches.serverContent, appVersion: APP_VERSION, now: new Date() }),
    [server, config.killSwitches.serverContent],
  );
}

/** The prompt library to pass to `selectPrompt` from @scribe/core. */
export function usePromptLibrary(): readonly Prompt[] {
  const ctx = useContext();
  return useMemo(() => promptLibrary(ctx, PROMPTS).prompts, [ctx]);
}

/** Onboarding story cards in display order, after remote config's intro variant (A-REQ-011). */
export function useStoryCards(): StoryCardLike[] {
  const ctx = useContext();
  const variant = useRemoteConfig().flags.introVariant;
  return useMemo(() => storyCards(ctx, onboardingStories, variant).cards, [ctx, variant]);
}

export function useTips(placement: TipBlock['placement']): TipBlock[] {
  const ctx = useContext();
  return useMemo(() => tipsFor(ctx, placement), [ctx, placement]);
}

function readDismissed(): Set<string> {
  try {
    const raw = JSON.parse(getSetting(DISMISSED_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Live announcements not yet dismissed on this phone, and a way to dismiss one. */
export function useAnnouncements(): { announcements: AnnouncementBlock[]; dismiss: (id: string) => void } {
  const ctx = useContext();
  const [dismissed, setDismissed] = useState(readDismissed);
  const announcements = useMemo(() => liveAnnouncements(ctx, dismissed), [ctx, dismissed]);
  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    const list = [...next].slice(-MAX_DISMISSED);
    setSetting(DISMISSED_KEY, JSON.stringify(list));
    setDismissed(new Set(list));
  };
  return { announcements, dismiss };
}
