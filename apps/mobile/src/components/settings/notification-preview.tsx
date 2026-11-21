/**
 * "How it will look" on Settings, Reminders (reminders-settings.md 2): a flat card with the real words of the first
 * planned notification (lib/reminders nextReminder, from the pure planner). Neutral unless "Names in notifications"
 * is on (D-025; the planner decides). Never a picture of the iOS alert: no app icon, no "now", no system chrome.
 *
 * Local to Settings for now; design-systems may promote it to components/ui/NotificationPreview once its
 * COMPONENTS.md spec (PR #596) lands. AX5: both lines wrap and never truncate. VoiceOver reads it as one element:
 * "How it will look. <title>. <body>".
 */
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export function NotificationPreview({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <View accessible accessibilityLabel={`${label}. ${title}. ${body}`} className="gap-1 rounded-[14px] border border-border bg-card px-4 py-3" testID="reminders.preview">
      <Text variant="headline">{title}</Text>
      <Text variant="subhead">{body}</Text>
    </View>
  );
}
