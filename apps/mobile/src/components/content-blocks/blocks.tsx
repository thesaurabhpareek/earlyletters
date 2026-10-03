// web: apps/web (later), same block vocabulary | android: same
/**
 * Native renderers for the content block vocabulary (ADR 0016, decision 16).
 * The server chooses words from a closed set of block types; these components
 * decide everything else (layout, type, motion, accessibility), so a block
 * can never change a screen's structure, collect data or alter the paywall.
 *
 *   <StoryCard card index total />      onboarding story card (PRD A section 4)
 *   <PromptCard prompt childName />     tonight's prompt (Prompt from @scribe/core)
 *   <TipCard tip />                     a short hint
 *   <AnnouncementCard block onDismiss/> a dismissible note with an optional in-app or site link
 *   <ContentBlockView block ... />      any block; unknown types render nothing
 *
 * Accessibility: each card is one VoiceOver element with its whole text as the
 * label (A-REQ-007 for stories: "Story 2 of 4. Headline. Line."); type scales
 * to AX5 through the design-system Text; illustrations are decorative.
 */
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';
import { brand } from '@scribe/brand';
import type { AnnouncementBlock, ContentBlock, TipBlock } from '@scribe/api';
import { renderTemplate, type Prompt } from '@scribe/core';
import { Button, Card, LineArt, Text, type LineArtName } from '@/components/ui';
import { copy, fill } from '@/lib/copy';
import { contentBlocksCopy } from './copy';
import type { StoryCardLike } from '@/lib/remote/content.logic';

/**
 * Bundled drawings for each story visual. Two have no drawing of their own
 * yet (design request: `two-hands`, `letter-underline`); they use the nearest
 * existing one until the design system adds them.
 */
const VISUAL_ART: Record<StoryCardLike['visual'], LineArtName> = {
  'envelope-fold': 'envelopeOpen',
  'letter-underline': 'page',
  moon: 'moon',
  'two-hands': 'envelope',
};

/** Routes an announcement may open (closed list in @scribe/api ANNOUNCEMENT_ROUTES). */
const ROUTE_HREF: Record<Extract<NonNullable<AnnouncementBlock['action']>, { kind: 'route' }>['route'], Href> = {
  tonight: '/' as Href,
  book: '/book' as Href,
  family: '/family' as Href,
  settings: '/settings' as Href,
  'settings/storage': '/settings/storage' as Href,
  'settings/reminders': '/settings/reminders' as Href,
};

/** Placeholders a block may use. Unknown ones were already rejected by the schema. */
function fillText(text: string, values: { child?: string; signsAs?: string }): string {
  return renderTemplate(text, { app: brand.name, ...(values.child ? { child: values.child } : {}), ...(values.signsAs ? { signsAs: values.signsAs } : {}) });
}

export function StoryCard({ card, index, total }: { card: StoryCardLike; index: number; total: number }) {
  const headline = fillText(card.headline, {});
  const line = fillText(card.line, {});
  return (
    <View
      className="flex-1 items-center justify-center gap-6 px-6"
      accessible
      accessibilityLabel={[fill(contentBlocksCopy.storyPositionA11y, { n: index + 1, count: total }), headline, line].join(' ')}>
      <LineArt name={VISUAL_ART[card.visual]} width={200} />
      <View className="gap-3">
        <Text variant="title1" className="text-center">
          {headline}
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          {line}
        </Text>
      </View>
    </View>
  );
}

export function PromptCard({ prompt, childName, signsAs }: { prompt: Pick<Prompt, 'text'>; childName?: string; signsAs?: string }) {
  const text = fillText(prompt.text, { child: childName, signsAs });
  return (
    <Card variant="tinted" accessible accessibilityLabel={text}>
      <Text variant="prompt">{text}</Text>
    </Card>
  );
}

export function TipCard({ tip, childName }: { tip: TipBlock; childName?: string }) {
  const title = tip.title ? fillText(tip.title, { child: childName }) : null;
  const body = fillText(tip.body, { child: childName });
  return (
    <Card variant="flat" padding={4} accessible accessibilityLabel={[title, body].filter(Boolean).join('. ')}>
      {title ? <Text variant="headline">{title}</Text> : null}
      <Text variant="subhead" tone="muted">
        {body}
      </Text>
    </Card>
  );
}

export function AnnouncementCard({ block, onDismiss }: { block: AnnouncementBlock; onDismiss?: (id: string) => void }) {
  const title = fillText(block.title, {});
  const body = fillText(block.body, {});
  const action = block.action;
  const run = () => {
    if (!action) return;
    if (action.kind === 'route') router.push(ROUTE_HREF[action.route]);
    else void WebBrowser.openBrowserAsync(`${brand.web.origin}${action.path}`);
  };
  return (
    <Card variant="outlined" padding={4}>
      <View accessible accessibilityLabel={`${title}. ${body}`} className="gap-1">
        <Text variant="headline">{title}</Text>
        <Text variant="subhead" tone="muted">
          {body}
        </Text>
      </View>
      {(action || (block.dismissible && onDismiss)) && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {action ? (
            <Button variant="secondary" size="sm" onPress={run}>
              <Text>{fillText(action.label, {})}</Text>
            </Button>
          ) : null}
          {block.dismissible && onDismiss ? (
            <Button variant="quiet" size="sm" onPress={() => onDismiss(block.id)}>
              <Text>{copy.common.closeButton}</Text>
            </Button>
          ) : null}
        </View>
      )}
    </Card>
  );
}

/** Renders any block with its component. Story cards need position, so they render through StoryCard directly. */
export function ContentBlockView({
  block,
  childName,
  signsAs,
  onDismiss,
}: {
  block: ContentBlock;
  childName?: string;
  signsAs?: string;
  onDismiss?: (id: string) => void;
}) {
  switch (block.type) {
    case 'prompt':
      return <PromptCard prompt={block} childName={childName} signsAs={signsAs} />;
    case 'tip':
      return <TipCard tip={block} childName={childName} />;
    case 'announcement':
      return <AnnouncementCard block={block} onDismiss={onDismiss} />;
    case 'story':
      return <StoryCard card={block} index={block.order - 1} total={block.order} />;
    default:
      return null;
  }
}
