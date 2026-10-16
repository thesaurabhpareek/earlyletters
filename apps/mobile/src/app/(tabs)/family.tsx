// android: same
/**
 * Family (DESIGN_LANGUAGE 12; PRD V2 F11 6.2 A and D; PRD B F5). Co-parent only at v1.0 (B1): the
 * "Family" role and its explanation stay hidden.
 *
 * With server features on (D-100, drafted as D-089: "the Family tab is live"), the tab shows who
 * writes to the open book: you, the co-parent who joined (from the last pull, signed with what the
 * child calls them), and invites still open ("Invited, open until {date}", with Share again and
 * Cancel invite; F11-REQ-019). While the book has one parent it offers "Write this book together";
 * with two (D-069) it offers nothing more to invite and shows "Leave {child}'s book" (F11-REQ-011).
 * When the other parent leaves, one neutral note shows once (F11-REQ-023). Before sign-in the
 * tab shows you alone and the invite card starts sign-in (PRD A F3.3a).
 *
 * With them off (the kill path) the tab keeps its place and shows the co-parent "coming soon"
 * presentation instead (components/family/coparent-soon.tsx).
 */
import { router, useFocusEffect, Redirect, type Href } from 'expo-router';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { inviteOpenUntil } from '@scribe/core/src/invite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildren } from '@/components/child/use-children';
import { CoParentSoon } from '@/components/family/coparent-soon';
import { MemberRow } from '@/components/family/member-row';
import { Button } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { capabilities } from '@/lib/capabilities';
import { useAuth } from '@/lib/auth/session-provider';
import { ErrorLine, useColors } from '@/lib/auth/ui';
import { copy, fill } from '@/lib/copy';
import { dateLocale } from '@/lib/dates';
import { familyCopy } from '@/lib/family/copy';
import { makeInviteDraft } from '@/lib/family/device-invite';
import { inviteErrorKind, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { createCoParentInvite, listPendingInvites, revokeInvite, type PendingInviteRow } from '@/lib/family/invites';
import { decodeSeen, encodeSeen, familyTabState, leftSince, seenCoParentsKey, type SeenCoParent } from '@/lib/family/members.logic';
import { shareInviteLink } from '@/lib/family/share';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { getSetting, listMembers, setSetting, subscribe } from '@/lib/store';

function RowAction({ label, icon, onPress, disabled, testID }: { label: string; icon: React.ReactNode; onPress: () => void; disabled?: boolean; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="min-h-11 flex-row items-center gap-2 rounded-full px-3 active:bg-secondary">
      {icon}
      <Text className="text-base font-medium text-primary">{label}</Text>
    </Pressable>
  );
}

/** Fixed per build (lib/capabilities.ts), so the choice never changes the hook order. */
export default function FamilyTab() {
  return capabilities.coParent ? <FamilyShared /> : <FamilySoon />;
}

function FamilySoon() {
  const { active } = useChildren();
  if (!active) return <Redirect href="/onboarding" />;
  return <CoParentSoon presentation="screen" childName={active.name} />;
}

/** The book's members from the last pull, live (sync rewrites them). */
function useMembers(childId: string | null) {
  const read = useCallback(() => (childId ? listMembers(childId) : []), [childId]);
  const [members, setMembers] = useState(read);
  useEffect(() => {
    setMembers(read());
    return subscribe(() => setMembers(read()));
  }, [read]);
  return members;
}

function FamilyShared() {
  const c = useColors();
  const { enter } = useMotion();
  const { active } = useChildren();
  const auth = useAuth();
  const [pending, setPending] = useState<PendingInviteRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  // Notes belong to the book they were found in; switching books never carries one over.
  const [leftNotes, setLeftNotes] = useState<{ childId: string; list: SeenCoParent[] } | null>(null);
  const f = familyCopy;
  const childId = active?.id ?? null;
  const client = auth.client;
  const can = auth.canSync;
  const members = useMembers(childId);
  const state = useMemo(() => familyTabState({ role: active?.role, members, openInvites: pending.length }), [active?.role, members, pending.length]);

  const load = useCallback(async () => {
    if (!childId || !client || !can) {
      setPending([]);
      return;
    }
    try {
      setPending(await listPendingInvites(client, childId));
    } catch {
      // Keep what is shown; offline or not synced yet. The local view (you, and the last pull) always works.
    }
  }, [childId, client, can]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // F11-REQ-023: a co-parent this phone showed before and who is gone now gets one neutral note, once.
  const coParentKey = state.coParents.map((m) => `${m.id}:${m.signsAs}`).join('|');
  useEffect(() => {
    if (!childId) return;
    const key = seenCoParentsKey(childId);
    const gone = leftSince(decodeSeen(getSetting(key)), state.coParents, active?.role !== undefined);
    if (gone.length > 0) setLeftNotes({ childId, list: gone });
    setSetting(key, encodeSeen(state.coParents));
    // coParentKey stands for state.coParents (a new array on every pull).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, coParentKey, active?.role]);

  if (!active) return <Redirect href="/onboarding" />;
  const child = active.name;
  const locale = dateLocale();

  const invite = () => {
    haptic('tap');
    if (!auth.signedIn) router.push({ pathname: '/sign-in', params: { trigger: 'invite_create' } });
    else router.push({ pathname: '/invite/new', params: { childId: active.id } });
  };

  const shareAgain = async (row: PendingInviteRow) => {
    if (!client) return;
    setBusyId(row.id);
    setError(null);
    try {
      // A new link, then the old one stops working: a forwarded copy of the old link is never revived.
      const fresh = await createCoParentInvite(client, active.id, row.signsAs, await makeInviteDraft());
      await shareInviteLink(fresh.url, child, row.signsAs);
      await revokeInvite(client, row.id).catch(() => {});
    } catch (e) {
      setError(inviteErrorKind(e));
    } finally {
      setBusyId(null);
      void load();
    }
  };

  const cancel = (row: PendingInviteRow) => {
    if (!client) return;
    Alert.alert(f.pending.cancelTitle, f.pending.cancelBody, [
      { text: f.pending.keep, style: 'cancel' },
      {
        text: f.pending.cancel,
        style: 'destructive',
        onPress: async () => {
          setBusyId(row.id);
          setError(null);
          try {
            await revokeInvite(client, row.id);
            haptic('soft');
          } catch (e) {
            setError(inviteErrorKind(e));
          } finally {
            setBusyId(null);
            void load();
          }
        },
      },
    ]);
  };

  const openUntil = (expiresAt: string) => {
    try {
      return fill(f.members.openUntil, { date: inviteOpenUntil(expiresAt, locale) });
    } catch {
      return f.members.invited;
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView testID="family.screen" contentContainerClassName="gap-8 px-5 pb-10 pt-4">
        <Animated.View entering={enter(0)} className="gap-2">
          <Text role="heading" maxFontSizeMultiplier={1.5} className="font-serif text-4xl leading-[44px] text-foreground">
            {copy.family.title}
          </Text>
          <Text className="text-lg leading-7 text-muted-foreground">{fill(copy.family.subtitle, { child })}</Text>
        </Animated.View>

        {(leftNotes?.childId === active.id ? leftNotes.list : []).map((m) => (
          <View key={m.id} testID="family.leftNote" accessible accessibilityLiveRegion="polite" className="rounded-2xl bg-secondary px-4 py-3">
            <Text className="text-base leading-6 text-foreground">{fill(f.left.note, { signsAs: m.signsAs.trim() || f.members.coParent, child })}</Text>
          </View>
        ))}

        <View className="gap-2">
          <ListSection title={fill(copy.familyTab.membersTitle, { child })}>
            <View testID="family.member" className="px-4">
              <MemberRow signsAs={active.signsAs || f.members.you} role={f.members.you} />
            </View>
            {state.coParents.map((m) => (
              <View key={m.id} testID="family.member" className="px-4">
                <MemberRow signsAs={m.signsAs.trim() || f.members.coParent} role={f.members.coParent} />
              </View>
            ))}
            {pending.map((p) => (
              <View key={p.id} testID="family.pending" className="px-4 pb-2">
                <MemberRow signsAs={p.signsAs ?? f.members.invitedName} role={f.members.coParent} status={openUntil(p.expiresAt)} />
                <View className="flex-row flex-wrap gap-1 pl-12">
                  {!state.full && (
                    <RowAction
                      testID="family.pending.shareAgain"
                      label={f.pending.shareAgain}
                      icon={<ShareNetworkIcon size={18} color={c.accent} />}
                      disabled={busyId !== null}
                      onPress={() => void shareAgain(p)}
                    />
                  )}
                  <RowAction
                    testID="family.pending.cancel"
                    label={f.pending.cancel}
                    icon={<XIcon size={18} color={c.accent} />}
                    disabled={busyId !== null}
                    onPress={() => cancel(p)}
                  />
                </View>
              </View>
            ))}
          </ListSection>
          {state.coParents.length === 0 && pending.length === 0 && (
            <View className="gap-1 pt-2">
              <Text className="font-serif text-xl text-foreground">{copy.familyTab.emptyTitle}</Text>
              <Text className="text-base leading-6 text-muted-foreground">{copy.familyTab.emptyBody}</Text>
            </View>
          )}
          {/* F11-U10: the inviter's line for a full book is create.full; errors.book_full is the invitee's. */}
          <ErrorLine message={error ? fill(error === 'book_full' ? f.create.full : f.errors[error], { child }) : null} />
        </View>

        {state.showInviteCard && (
          <View className="gap-3 rounded-[20px] bg-muted p-5">
            <Text role="heading" className="font-serif text-2xl text-foreground">
              {f.card.title}
            </Text>
            <Text className="text-base leading-6 text-foreground">{fill(f.card.body, { child })}</Text>
            <Button testID="family.invite" className="self-start" onPress={invite}>
              <UserPlusIcon size={18} color={c.onAccent} />
              <Text>{f.card.button}</Text>
            </Button>
            {!auth.signedIn && <Text className="text-sm leading-5 text-muted-foreground">{f.card.signedOutNote}</Text>}
          </View>
        )}

        {state.canLeave && (
          <ListSection>
            <ListRow
              testID="family.leave"
              title={fill(f.leave.row, { child })}
              variant="destructive"
              onPress={() => router.push({ pathname: '/invite/leave', params: { childId: active.id } } as unknown as Href)}
            />
          </ListSection>
        )}

        <Text className="text-sm leading-5 text-muted-foreground">{fill(f.card.privacy, { child })}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
