// android: same
/**
 * Family (DESIGN_LANGUAGE 12; PRD B F5). Co-parent only at launch (BRIEF
 * decision 5): the "Family" role and its explanation stay hidden.
 *
 * Shows who writes to the open book: you, co-parents who joined, and invites
 * still open (Share again makes a new link and cancels the old one; Cancel
 * invite stops the link). Members and invites come from the server once the
 * account can sync; before that the tab shows you alone and the invite card
 * starts sign-in (PRD A F3.3a).
 */
import { router, useFocusEffect, Redirect } from 'expo-router';
import { ShareNetworkIcon, UserPlusIcon, XIcon } from 'phosphor-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChildren } from '@/components/child/use-children';
import { MemberRow } from '@/components/family/member-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { currentAuthUserId } from '@/lib/auth/auth-store';
import { useAuth } from '@/lib/auth/session-provider';
import { ErrorLine, useColors } from '@/lib/auth/ui';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { inviteErrorKind, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { createCoParentInvite, listBookMembers, listPendingInvites, revokeInvite, type BookMember, type PendingInviteRow } from '@/lib/family/invites';
import { shareInviteLink } from '@/lib/family/share';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';

function RowAction({ label, icon, onPress, disabled }: { label: string; icon: React.ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="min-h-11 flex-row items-center gap-2 rounded-full px-3 active:bg-secondary">
      {icon}
      <Text className="text-base font-medium text-primary">{label}</Text>
    </Pressable>
  );
}

export default function Family() {
  const c = useColors();
  const { enter } = useMotion();
  const { active } = useChildren();
  const auth = useAuth();
  const [members, setMembers] = useState<BookMember[]>([]);
  const [pending, setPending] = useState<PendingInviteRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const f = familyCopy;
  const childId = active?.id ?? null;
  const client = auth.client;
  const can = auth.canSync;

  const load = useCallback(async () => {
    const me = currentAuthUserId();
    if (!childId || !client || !can || !me) {
      setMembers([]);
      setPending([]);
      return;
    }
    try {
      const [m, p] = await Promise.all([listBookMembers(client, childId, me), listPendingInvites(client, childId)]);
      setMembers(m);
      setPending(p);
    } catch {
      // Keep what is shown; offline or not synced yet. The local view (you) always works.
    }
  }, [childId, client, can]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!active) return <Redirect href="/onboarding" />;
  const child = active.name;
  const coParents = members.filter((m) => m.role === 'parent' && !m.isYou);
  const showCard = coParents.length === 0 && pending.length === 0;

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
      const fresh = await createCoParentInvite(client, active.id, row.signsAs);
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

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-8 px-5 pb-10 pt-4">
        <Animated.View entering={enter(0)} className="gap-2">
          <Text role="heading" maxFontSizeMultiplier={1.5} className="font-serif text-4xl leading-[44px] text-foreground">
            {copy.family.title}
          </Text>
          <Text className="text-lg leading-7 text-muted-foreground">{fill(copy.family.subtitle, { child })}</Text>
        </Animated.View>

        <View className="gap-2">
          <Text role="heading" className="text-xs font-medium tracking-[1.2px] text-muted-foreground">
            {fill(copy.familyTab.membersTitle, { child }).toUpperCase()}
          </Text>
          <View className="rounded-[20px] border border-border bg-card px-4">
            <MemberRow signsAs={active.signsAs || f.members.you} role={f.members.you} />
            {coParents.map((m) => (
              <View key={m.profileId} className="border-t border-border">
                <MemberRow signsAs={m.label ?? f.members.coParent} role={f.members.coParent} />
              </View>
            ))}
            {pending.map((p) => (
              <View key={p.id} className="border-t border-border pb-2">
                <MemberRow signsAs={p.signsAs ?? f.members.invitedName} role={f.members.coParent} status={f.members.invited} />
                <View className="flex-row flex-wrap gap-1 pl-12">
                  <RowAction
                    label={f.pending.shareAgain}
                    icon={<ShareNetworkIcon size={18} color={c.accent} />}
                    disabled={busyId !== null}
                    onPress={() => void shareAgain(p)}
                  />
                  <RowAction label={f.pending.cancel} icon={<XIcon size={18} color={c.accent} />} disabled={busyId !== null} onPress={() => cancel(p)} />
                </View>
              </View>
            ))}
          </View>
          {coParents.length === 0 && pending.length === 0 && (
            <View className="gap-1 pt-2">
              <Text className="font-serif text-xl text-foreground">{copy.familyTab.emptyTitle}</Text>
              <Text className="text-base leading-6 text-muted-foreground">{copy.familyTab.emptyBody}</Text>
            </View>
          )}
          <ErrorLine message={error ? fill(f.errors[error], { child }) : null} />
        </View>

        {showCard && (
          <View className="gap-3 rounded-[20px] bg-muted p-5">
            <Text role="heading" className="font-serif text-2xl text-foreground">
              {f.card.title}
            </Text>
            <Text className="text-base leading-6 text-foreground">{fill(f.card.body, { child })}</Text>
            <Button className="self-start" onPress={invite}>
              <UserPlusIcon size={18} color={c.onAccent} />
              <Text>{f.card.button}</Text>
            </Button>
            {!auth.signedIn && <Text className="text-sm leading-5 text-muted-foreground">{f.card.signedOutNote}</Text>}
          </View>
        )}

        <Text className="text-sm leading-5 text-muted-foreground">{fill(f.card.privacy, { child })}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
