import { dueDatePassed } from '@scribe/core';
import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { inviteHref } from '@/lib/family/entry.logic';
import { longDate as formatDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { getChild, hideChild, listChildren, subscribe, todayISO, updateChild } from '@/lib/store';
import { BornEditor, DateEditor, NameEditor, SignsAsEditor, type ChildPatch } from '@/components/child/child-editors';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ListRow, ListSection, ToggleRow } from '@/components/ui/list-row';
import { ordinalOf, track } from '@/lib/analytics/track';

/** One child's book settings (PRD B F2): each child is managed separately. */
export default function ChildSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [child, setChild] = useState(() => getChild(id));
  const [editing, setEditing] = useState<'name' | 'date' | 'signsAs' | 'born' | null>(null);
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

  const save = (key: 'display_name' | 'date' | 'signs_as') => (patch: ChildPatch) => {
    // Only the child's own row changes: no letter, transcript, captured date or audio is touched.
    updateChild(child.id, patch);
    track('child_setting_changed', { key, child_ordinal: ordinalOf(child.id) });
    haptic('success');
    setEditing(null);
  };
  const e = copy.childrenExtra.edit;
  const offerBorn = !child.birthday && dueDatePassed(child.dueDate, todayISO());

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

      {offerBorn && editing !== 'born' ? (
        <Card variant="tinted" padding={5}>
          <Text variant="body">{e.born.offerBody}</Text>
          <Button variant="secondary" label={fill(e.born.offer, { child: name })} onPress={() => setEditing('born')} />
        </Card>
      ) : null}
      {editing === 'born' ? <BornEditor child={child} onSave={save('date')} onCancel={() => setEditing(null)} /> : null}

      <ListSection title={s.detailsLabel}>
        <ListRow title={e.nameLabel} trailing={name} onPress={() => setEditing('name')} accessibilityHint={e.rowHint} />
        <ListRow title={dateRow.title} trailing={dateRow.value} onPress={() => setEditing('date')} accessibilityHint={e.rowHint} />
        <ListRow title={fill(s.signsAsLabel, { child: name })} trailing={child.signsAs} onPress={() => setEditing('signsAs')} accessibilityHint={e.rowHint} />
      </ListSection>
      {editing === 'name' ? <NameEditor child={child} onSave={save('display_name')} onCancel={() => setEditing(null)} /> : null}
      {editing === 'date' ? <DateEditor child={child} onSave={save('date')} onCancel={() => setEditing(null)} /> : null}
      {editing === 'signsAs' ? <SignsAsEditor child={child} onSave={save('signs_as')} onCancel={() => setEditing(null)} /> : null}

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

