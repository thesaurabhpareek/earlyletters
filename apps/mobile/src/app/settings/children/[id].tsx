import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { inviteHref, visibleCoParentDoors } from '@/lib/family/entry.logic';
import { longDate as formatDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { deleteSetting, getChild, getSetting, hideChild, listChildren, listMembers, setSetting, subscribe, todayISO, updateChild } from '@/lib/store';
import { BornEditor, DateEditor, NameEditor, SignsAsEditor, type ChildPatch } from '@/components/child/child-editors';
import { bookRow, bornCard, bornCardHiddenKey, bornCardShown, coParentOf, hideFooter } from '@/components/child/child-settings.logic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ListRow, ListSection, ToggleRow } from '@/components/ui/list-row';
import { ordinalOf, track } from '@/lib/analytics/track';

/**
 * One child's book settings (PRD B F2; EXPERIENCE_PASS_2026-10 S46, package P6): each child is managed separately.
 * Editing a name, a date or a signature writes only the child's own row; no letter ever changes
 * (child-editors.tsx, test/store.child-edit.test.ts). The rules for the due-date card, the hide footer and the
 * "Write this book together" row are components/child/child-settings.logic.ts.
 */
export default function ChildSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [child, setChild] = useState(() => getChild(id));
  const doors = visibleCoParentDoors(serverFeaturesEnabled());
  const [editing, setEditing] = useState<'name' | 'date' | 'signsAs' | 'born' | null>(null);
  const [hiddenFor, setHiddenFor] = useState(() => readHidden(id));
  const [members, setMembers] = useState(() => (id ? listMembers(id) : []));
  useEffect(
    () =>
      subscribe(() => {
        setChild(getChild(id));
        setMembers(id ? listMembers(id) : []);
      }),
    [id],
  );

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
  const born = bornCard(name);
  const showBorn = bornCardShown({ birthday: child.birthday, dueDate: child.dueDate, today: todayISO(), hiddenFor });
  const coParent = coParentOf(members);
  const row = bookRow({ serverFeatures: serverFeaturesEnabled(), coParent, invite: inviteHref('settings_child', serverFeaturesEnabled(), child.id) });

  /** "Hide": the card goes away on this phone until the Due date row is opened again (S46). Nothing is sent. */
  const hideBornCard = () => {
    if (!child.dueDate) return;
    writeHidden(child.id, child.dueDate);
    setHiddenFor(child.dueDate);
  };
  const openDate = () => {
    if (hiddenFor !== null) {
      writeHidden(child.id, null);
      setHiddenFor(null);
    }
    setEditing('date');
  };

  // Nothing is deleted, so the confirm is a plain choice, not a destructive one (S46).
  const hide = () => {
    Alert.alert(s.hideLabel, fill(s.hideBody, { child: name }), [
      { text: copy.common.cancelButton, style: 'cancel' },
      {
        text: s.hideLabel,
        style: 'default',
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

      {/* The due-date card: never presumes a birth, never celebrates, never counts days (S46). */}
      {showBorn && editing !== 'born' ? (
        <Card variant="raised" padding={5} testID="child.bornCard">
          <View className="gap-1">
            <Text variant="headline" asHeading>
              {born.title}
            </Text>
            <Text variant="body">{born.body}</Text>
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" label={born.setButton} onPress={() => setEditing('born')} testID="child.bornCard.set" />
            <Button variant="quiet" size="sm" label={born.hideButton} onPress={hideBornCard} testID="child.bornCard.hide" />
          </View>
        </Card>
      ) : null}
      {editing === 'born' ? <BornEditor child={child} onSave={save('date')} onCancel={() => setEditing(null)} /> : null}

      <ListSection title={s.detailsLabel}>
        <ListRow title={x.edit.nameLabel} trailing={name} onPress={() => setEditing('name')} accessibilityHint={x.edit.rowHint} />
        <ListRow title={dateRow.title} trailing={dateRow.value} onPress={openDate} accessibilityHint={x.edit.rowHint} />
        <ListRow title={fill(s.signsAsLabel, { child: name })} trailing={child.signsAs} onPress={() => setEditing('signsAs')} accessibilityHint={x.edit.rowHint} />
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

      {/* "Write this book together": coming soon with server features off; the invite with one parent, the Family tab
          with two (child-settings.logic.ts bookRow). The label is familyCopy.bookRow.label with server features on, and
          the kill path's familyCopy.soon.settingsRow with them off (the same words, S46). */}
      <ListSection footer={row.footer}>
        <ListRow title={serverFeaturesEnabled() ? familyCopy.bookRow.label : familyCopy.soon.settingsRow} value={row.value} trailing="chevron" onPress={() => router.push(row.href as Href)} testID="child.bookRow" />
      </ListSection>

      {/* A switch that cannot be turned on is hidden until co-parent sharing exists (D-087). */}
      {doors.familyCanReadSwitch && (
        <ListSection footer={fill(x.familyCanReadHelp, { child: name })}>
          <ToggleRow title={fill(s.familyCanReadLabel, { child: name })} value={child.familyCanRead} onValueChange={() => {}} disabled />
        </ListSection>
      )}

      {listChildren().length > 1 && (
        <ListSection footer={hideFooter(name, coParent)}>
          <ListRow title={s.hideLabel} onPress={hide} testID="child.hide" />
        </ListSection>
      )}
    </ScrollView>
  );
}

function readHidden(childId: string | undefined): string | null {
  if (!childId) return null;
  try {
    return getSetting(bornCardHiddenKey(childId));
  } catch {
    return null;
  }
}

function writeHidden(childId: string, dueDate: string | null): void {
  try {
    if (dueDate) setSetting(bornCardHiddenKey(childId), dueDate);
    else deleteSetting(bornCardHiddenKey(childId));
  } catch {
    // A courtesy: if it cannot be kept, the card shows again next time.
  }
}
