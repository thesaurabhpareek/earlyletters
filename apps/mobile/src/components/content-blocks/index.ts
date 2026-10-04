/**
 * Server-driven content inside native screens (ADR 0016, decision 16).
 * Screens import from here; the coordinator wires `useStoryCards` into the
 * intro and `usePromptLibrary` into Tonight's `selectPrompt` call.
 */
export { AnnouncementCard, ContentBlockView, PromptCard, StoryCard, TipCard } from './blocks';
export { useAnnouncements, usePromptLibrary, useStoryCards, useTips } from './hooks';
