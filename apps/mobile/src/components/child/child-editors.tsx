/**
 * Inline editors for one child's details (Settings > the child's book): name, birthday,
 * due date, signature, and "was born, set the birthday".
 *
 * Rules come from packages/core (checkChildName, checkSignsAs, checkBirthday,
 * checkDueDate, bornPatch), the same ones first run uses. Saving writes only the child's
 * own row (store.updateChild): never a letter, its raw transcript, its captured date or
 * its audio, and never the child's id. A letter's month chapter is worked out from the
 * birthday each time it is shown, so a corrected birthday re-files letters on its own,
 * and a letter keeps the signature it was written with.
 *
 * Save stays off until there is a change worth saving; whenever it is off because
 * something is wrong, a line under the field says what, in words.
 */
import {
  CHILD_NAME_MAX,
  SIGNS_AS_MAX,
  bornPatch,
  bornPickerStart,
  checkBirthday,
  checkChildName,
  checkDueDate,
  checkSignsAs,
  clampText,
  latestDueDate,
  nearLimit,
  textLength,
} from '@scribe/core';
import * as React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { copy, fill } from '@/lib/copy';
import { todayISO, type Child } from '@/lib/store';
import { DateField } from './date-field';

export type ChildPatch = Partial<Pick<Child, 'name' | 'birthday' | 'dueDate' | 'signsAs'>>;

type EditorProps = { child: Child; onSave: (patch: ChildPatch) => void; onCancel: () => void };

function Actions({ canSave, onSave, onCancel, saveLabel }: { canSave: boolean; onSave: () => void; onCancel: () => void; saveLabel?: string }) {
  return (
    <View className="flex-row justify-end gap-2">
      <Button variant="quiet" size="sm" label={copy.common.cancelButton} onPress={onCancel} />
      <Button size="sm" label={saveLabel ?? copy.childrenExtra.edit.save} disabled={!canSave} onPress={onSave} />
    </View>
  );
}

function Hint({ children }: { children?: string | null }) {
  return children ? (
    <Text variant="footnote" accessibilityLiveRegion="polite">
      {children}
    </Text>
  ) : null;
}

export function NameEditor({ child, onSave, onCancel }: EditorProps) {
  const e = copy.childrenExtra.edit;
  const [draft, setDraft] = React.useState(child.name);
  const check = checkChildName(draft);
  const changed = check.ok && check.value !== child.name;
  return (
    <Card variant="flat" padding={5}>
      <TextField
        label={e.nameLabel}
        value={draft}
        onChangeText={(v) => setDraft(clampText(v, CHILD_NAME_MAX))}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        textContentType="givenName"
        returnKeyType="done"
        error={check.ok ? null : e.nameEmpty}
        helper={nearLimit(textLength(draft), CHILD_NAME_MAX) ? fill(e.nameLimit, { n: CHILD_NAME_MAX }) : undefined}
      />
      <Actions canSave={changed} onCancel={onCancel} onSave={() => check.ok && onSave({ name: check.value })} />
    </Card>
  );
}

export function SignsAsEditor({ child, onSave, onCancel }: EditorProps) {
  const e = copy.childrenExtra.edit;
  const [draft, setDraft] = React.useState(child.signsAs);
  const check = checkSignsAs(draft);
  const changed = check.ok && check.value !== child.signsAs;
  return (
    <Card variant="flat" padding={5}>
      <TextField
        label={fill(copy.children.settings.signsAsLabel, { child: child.name })}
        value={draft}
        onChangeText={(v) => setDraft(clampText(v, SIGNS_AS_MAX))}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        error={check.ok ? null : fill(e.signsAsEmpty, { child: child.name })}
        helper={nearLimit(textLength(draft), SIGNS_AS_MAX) ? fill(e.signsAsLimit, { n: SIGNS_AS_MAX }) : e.signsAsNewOnly}
      />
      <Actions canSave={changed} onCancel={onCancel} onSave={() => check.ok && onSave({ signsAs: check.value })} />
    </Card>
  );
}

/** Birthday (a child who is here) or due date (a child who is not yet). */
export function DateEditor({ child, onSave, onCancel }: EditorProps) {
  const e = copy.childrenExtra.edit;
  const born = !!child.birthday || !child.dueDate;
  const today = todayISO();
  const original = (born ? child.birthday : child.dueDate) ?? null;
  const [draft, setDraft] = React.useState<string | null>(original);
  const check = born ? checkBirthday(draft, today) : checkDueDate(draft, today);
  const label = born ? copy.settings.birthdayLabel : copy.childrenExtra.dueDateLabel;
  const problem = check.ok ? null : check.reason === 'missing' ? e.birthdayMissing : born ? (check.reason === 'invalid' ? e.dateInvalid : e.birthdayFuture) : check.reason === 'invalid' ? e.dateInvalid : e.dueDateRange;
  return (
    <Card variant="flat" padding={5}>
      <View className="min-h-12 flex-row flex-wrap items-center justify-between gap-2">
        <Text variant="labelSmall" tone="muted">
          {label}
        </Text>
        <DateField label={label} chooseLabel={copy.onboarding.child.chooseDate} value={draft} onChange={setDraft} startISO={today} min={born ? undefined : today} max={born ? today : latestDueDate(today)} />
      </View>
      <Hint>{draft === null && !original ? null : problem}</Hint>
      <Actions canSave={check.ok && check.value !== original} onCancel={onCancel} onSave={() => check.ok && onSave(born ? { birthday: check.value } : { dueDate: check.value })} />
    </Card>
  );
}

/** "Asha was born, set the birthday": the due date becomes the birthday. */
export function BornEditor({ child, onSave, onCancel }: EditorProps) {
  const e = copy.childrenExtra.edit.born;
  const today = todayISO();
  const [draft, setDraft] = React.useState<string | null>(null);
  const result = draft ? bornPatch({ birthday: child.birthday, dueDate: child.dueDate }, draft, today) : null;
  const problem = result && !result.ok ? (result.reason === 'future' ? copy.childrenExtra.edit.birthdayFuture : copy.childrenExtra.edit.dateInvalid) : null;
  const label = fill(e.pickerLabel, { child: child.name });
  return (
    <Card variant="tinted" padding={5}>
      <View className="min-h-12 flex-row flex-wrap items-center justify-between gap-2">
        <Text variant="labelSmall" tone="muted">
          {label}
        </Text>
        <DateField label={label} chooseLabel={copy.onboarding.child.chooseDate} value={draft} onChange={setDraft} startISO={bornPickerStart(child.dueDate, today)} max={today} />
      </View>
      <Hint>{problem ?? e.keepNote}</Hint>
      <Actions saveLabel={e.confirm} canSave={!!result && result.ok} onCancel={onCancel} onSave={() => result && result.ok && onSave(result.patch)} />
    </Card>
  );
}
