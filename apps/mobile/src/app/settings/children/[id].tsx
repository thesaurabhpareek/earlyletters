import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { inviteHref } from '@/lib/family/entry.logic';
import { longDate as formatDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { getChild, hideChild, listChildren, subscribe, updateChild } from '@/lib/store';
import { ListRow, ListSection, ToggleRow } from '@/components/ui/list-row';
import { ordinalOf, track } from '@/lib/analytics/track';

/** One child's book settings (PRD B F2): each child is managed separately. */
export default function ChildSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [child, setChild] = useState(() => getChild(id));
  useEffect(() => subscribe(() => setChild(getChild(id))), [id]);

  if (!child) return null;
  const s = copy.children.settings;
  const x = copy.childrenExtra;
  const name = child.name;
  const dateRow = child.birthday
    ? { title: copy.settings.birthdayLabel, value: formatDate(child.birthday) }
    : child.dueDate
      ? { title: x.dueDateLabel, value: formatDate(child.dueDate) }
      : { title: copy.settings.birthdayLabel, value: x.notSet };

  const hide = () => {
    haptic('warning');
    Alert.alert(s.hideLabel, fill(s.hideBody, { child: name }), [
      { text: copy.common.cancelButton, style: 'cancel' },
      {
        text: s.hideLabel,
        style: 'destructive',
        onPress: () => {
          track('child_setting_changed', { key: 'hidden', child_ordinal: ordinalOf(child.id) });
          hideChild(child.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: fill(s.title, { child: name }) }} />

      <ListSection title={s.detailsLabel}>
        <ListRow title={copy.settings.childLabel} trailing={name} />
        <ListRow title={dateRow.title} trailing={dateRow.value} />
        <ListRow title={fill(s.signsAsLabel, { child: name })} trailing={child.signsAs} />
      </ListSection>

      <ListSection footer={fill(s.remindersHelp, { child: name })}>
        <ToggleRow
          title={fill(s.remindersLabel, { child: name })}
          value={child.remindersOn}
          onValueChange={(v) => {
            updateChild(child.id, { remindersOn: v });
            track('child_setting_changed', { key: 'include_in_reminders', child_ordinal: ordinalOf(child.id) });
          }}
        />
      </ListSection>

      {/* Co-parent sharing: v1.0 opens the coming-soon sheet; v1.1 opens the invite (lib/family/entry.logic.ts). */}
      <ListSection footer={serverFeaturesEnabled() ? undefined : familyCopy.soon.settingsRowHelp}>
        <ListRow
          title={familyCopy.soon.settingsRow}
          value={serverFeaturesEnabled() ? undefined : familyCopy.soon.status}
          trailing="chevron"
          onPress={() => router.push(inviteHref('settings_child', serverFeaturesEnabled(), child.id) as Href)}
        />
      </ListSection>

      <ListSection footer={fill(x.familyCanReadHelp, { child: name })}>
        <ToggleRow title={fill(s.familyCanReadLabel, { child: name })} value={child.familyCanRead} onValueChange={() => {}} disabled />
      </ListSection>

      {listChildren().length > 1 && (
        <ListSection footer={fill(s.hideBody, { child: name })}>
          <ListRow title={s.hideLabel} variant="destructive" onPress={hide} />
        </ListSection>
      )}
    </ScrollView>
  );
}

