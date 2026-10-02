import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { getChild, hideChild, listChildren, subscribe, updateChild } from '@/lib/store';
import { Row, Section, ToggleRow } from '@/components/settings/settings-ui';

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

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
          hideChild(child.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerClassName="gap-7 px-4 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: fill(s.title, { child: name }) }} />

      <Section title={s.detailsLabel}>
        <Row first title={copy.settings.childLabel} value={name} />
        <Row title={dateRow.title} value={dateRow.value} />
        <Row title={fill(s.signsAsLabel, { child: name })} value={child.signsAs} />
      </Section>

      <Section footer={fill(s.remindersHelp, { child: name })}>
        <ToggleRow first title={fill(s.remindersLabel, { child: name })} value={child.remindersOn} onChange={(v) => updateChild(child.id, { remindersOn: v })} />
      </Section>

      <Section footer={fill(x.familyCanReadHelp, { child: name })}>
        <ToggleRow first title={fill(s.familyCanReadLabel, { child: name })} value={child.familyCanRead} onChange={() => {}} disabled />
      </Section>

      {listChildren().length > 1 && (
        <Section footer={fill(s.hideBody, { child: name })}>
          <Row first title={s.hideLabel} destructive onPress={hide} />
        </Section>
      )}
    </ScrollView>
  );
}
