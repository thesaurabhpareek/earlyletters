// android: same
/**
 * Family (EXPERIENCE_PASS_2026-10 S57, steps J17-01 to J17-03; PRD V2 F11 6.2 A and D; PRD B F5). Co-parent only
 * at v1.0 (B1): the "Family" role and its explanation stay hidden.
 *
 * The room: the lamp's still `family` scene, low (0.4), sharing the tabs' light (persistKey "tabs"), so coming
 * here never re-arrives the lamp; under Increase Contrast it is plain paper. The dateline as on Tonight, then
 * "Who writes to {child}" in title1, the room's one literary line. The people are signatures, not accounts:
 * "From Mama" with "You" or "Co-parent" under it (components/family/member-row.tsx), never an avatar, initials
 * or an email address, and never more than two parents (D-069). Nothing is counted.
 *
 * With server features on (D-100, drafted as D-089: "the Family tab is live"), the tab shows who writes to the
 * open book: you, the co-parent who joined (from the last pull, signed with what the child calls them), and
 * pending invites as the server lists them (sync_books, lib/family/invite-list.logic.ts): open ones as
 * "Invited, open until {date}" with Share again and Cancel invite, and, for 14 days, expired ones as the server
 * marks them, with Share again (F11-REQ-019, F11-U04); in a full book expired rows are hidden. While
 * `killSwitches.invites` is on, Share again says invites are paused and sends nothing, and Cancel invite still
 * works (closing a link is the safe direction). While `killSwitches.sync` is on the list is not asked for, and
 * the rows shown stay. While the book has one parent and no invite is open it offers the invite card
 * (components/family/invite-card.tsx); with two (D-069) it offers nothing more. Build 2 has no Leave row (D-113):
 * a book this phone leaves is not listed anywhere yet, so the leaver's own letters would have no screen
 * (lib/family/entry.logic.ts LEAVE_BOOK_OFFERED). When the other parent leaves, one neutral note fades in once
 * and stays until dismissed (F11-REQ-023). Before sign-in the tab shows you alone, and the invite card opens the
 * invite sheet, whose first step is sign-in (trigger invite_create), and which comes back to the invite (PRD A F3.3a).
 *
 * Motion: the first time this phone shows the co-parent's row it enters and carries the 1.6 s wash, once. A
 * pending row that appears after the list was first shown (an invite just shared) enters; Cancel invite
 * collapses its row and says "Invite cancelled." as the tab's toast. A sheet's closing line (the invite's
 * "The invite waits on the Family tab until they join.") shows as that toast too (components/family/family-notice.ts).
 *
 * With server features off (the kill path) the tab keeps its place and shows the co-parent "coming soon"
 * presentation instead, unchanged (components/family/coparent-soon.tsx).
 */
import { Redirect, router, useFocusEffect } from 'expo-router';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { inviteOpenUntil } from '@scribe/core/src/invite';
import { tokens } from '@scribe/design-tokens';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useChildren } from '@/components/child/use-children';
import { CoParentSoon } from '@/components/family/coparent-soon';
import { arrivedSince, inviteCardNote, peopleRows, pendingSignature } from '@/components/family/family-tab.logic';
import { familyNotice } from '@/components/family/family-notice';
import { InviteCard } from '@/components/family/invite-card';
import { MemberRow } from '@/components/family/member-row';
import { tonightDateline } from '@/components/tonight/draft-card.logic';
import { IconButton } from '@/components/ui/button';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { capabilities } from '@/lib/capabilities';
import { useAuth } from '@/lib/auth/session-provider';
import { ErrorLine, useColors } from '@/lib/auth/ui';
import { copy, fill } from '@/lib/copy';
import { ageText, dateLocale, dayDate } from '@/lib/dates';
import { familyCopy } from '@/lib/family/copy';
import { makeInviteDraft } from '@/lib/family/device-invite';
import { inviteErrorKind, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { openInvites, visiblePendingRows } from '@/lib/family/invite-list.logic';
import { listPendingInvites, revokeInvite, shareInviteAgain, type PendingInviteRow } from '@/lib/family/invites';
import { decodeSeen, encodeSeen, familyTabState, leftSince, seenCoParentsKey, type SeenCoParent } from '@/lib/family/members.logic';
import { shareInviteLink } from '@/lib/family/share';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { getSetting, listMembers, setSetting, subscribe, todayISO } from '@/lib/store';

/** A pending row's quiet button: ShareNetwork or X at 20 pt and the word, in `accent`, 44 pt tall. */
function RowAction({ label, icon, onPress, disabled, testID }: { label: string; icon: React.ReactNode; onPress: () => void; disabled?: boolean; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      className="min-h-11 shrink flex-row items-center gap-2 rounded-full px-3 active:bg-secondary">
      {icon}
      {/* shrink: at the largest text sizes the label wraps inside the row instead of running off the edge. */}
      <Text className="shrink text-base font-medium text-primary">{label}</Text>
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

const NOTE_IN = FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);

function FamilyShared() {
  const c = useColors();
  const motion = useMotion();
  const toast = useToast();
  const { active } = useChildren();
  const auth = useAuth();
  const [pending, setPending] = useState<PendingInviteRow[]>([]);
  // The first list has been drawn: rows that come after it (an invite just shared) enter; the first ones do not.
  const [listed, setListed] = useState(false);
  const settled = useRef(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  // What Share again left open, when it did not end cleanly (lib/family/invites.ts ShareAgainOutcome).
  const [shareNote, setShareNote] = useState<string | null>(null);
  // Notes and washes belong to the book they were found in; switching books never carries one over.
  const [leftNotes, setLeftNotes] = useState<{ childId: string; list: SeenCoParent[] } | null>(null);
  const [washes, setWashes] = useState<{ childId: string; at: Record<string, number> } | null>(null);
  const f = familyCopy;
  const childId = active?.id ?? null;
  const client = auth.client;
  const can = auth.canSync;
  const members = useMembers(childId);
  // Only an invite that still works holds back the invite card; an expired one is listed, not counted.
  const openCount = openInvites(pending).length;
  const state = useMemo(() => familyTabState({ role: active?.role, members, openInvites: openCount }), [active?.role, members, openCount]);

  const load = useCallback(async () => {
    if (!childId || !client || !can) {
      setPending([]);
      setListed(true);
      return;
    }
    try {
      setPending(await listPendingInvites(client, childId));
    } catch {
      // Keep what is shown; offline or not synced yet. The local view (you, and the last pull) always works.
    }
    setListed(true);
  }, [childId, client, can]);

  useEffect(() => {
    if (listed) settled.current = true;
  }, [listed]);

  useFocusEffect(
    useCallback(() => {
      void load();
      // A sheet that just closed over this tab left its line here (the invite's "waits on the Family tab").
      const note = familyNotice.take();
      if (note) toast.show({ message: note });
    }, [load, toast]),
  );

  // F11-REQ-023: a co-parent this phone showed before and who is gone now gets one neutral note, once. A
  // co-parent this phone has not shown before gets the arrival wash, once (S57 Motion).
  const coParentKey = state.coParents.map((m) => `${m.id}:${m.signsAs}`).join('|');
  useEffect(() => {
    if (!childId) return;
    const key = seenCoParentsKey(childId);
    const seen = decodeSeen(getSetting(key));
    const onServer = active?.role !== undefined;
    const gone = leftSince(seen, state.coParents, onServer);
    if (gone.length > 0) setLeftNotes({ childId, list: gone });
    const arrived = arrivedSince(seen, state.coParents, onServer);
    if (arrived.length > 0) {
      const at = Date.now();
      setWashes({ childId, at: Object.fromEntries(arrived.map((id) => [id, at])) });
    }
    setSetting(key, encodeSeen(state.coParents));
    // coParentKey stands for state.coParents (a new array on every pull).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, coParentKey, active?.role]);

  if (!active) return <Redirect href="/onboarding" />;
  const child = active.name;
  const locale = dateLocale();
  const today = todayISO();
  const dateline = tonightDateline(child, ageText(active, today), dayDate(today));
  const people = peopleRows(active, state.coParents);
  const notes = leftNotes?.childId === active.id ? leftNotes.list : [];
  const washOf = (key: string) => (washes?.childId === active.id ? washes.at[key] : undefined);

  const invite = () => {
    // Signed in or not: the invite sheet's first step signs in (S52, invite_create) and comes back to the sheet.
    router.push({ pathname: '/invite/new', params: { childId: active.id } });
  };

  const shareAgain = async (row: PendingInviteRow) => {
    if (!client) return;
    setBusyId(row.id);
    setError(null);
    setShareNote(null);
    try {
      // A new link; the old one stops working only once the share sheet says the new one was sent.
      const outcome = await shareInviteAgain(client, active.id, row, await makeInviteDraft(), (url) => shareInviteLink(url, child, row.signsAs));
      if (outcome === 'old_still_open') setShareNote(f.pending.oldStillOpen);
      if (outcome === 'not_sent') setShareNote(f.pending.notSent);
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
          setShareNote(null);
          try {
            await revokeInvite(client, row.id);
            // The row goes now: the reload below is skipped while sync is paused.
            setPending((rows) => rows.filter((r) => r.id !== row.id));
            haptic('soft');
            toast.show({ message: f.pending.cancelled });
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
      <Lamp scene="family" persistKey="tabs" />
      <ScrollView testID="family.screen" className="flex-1" contentContainerClassName="gap-6 px-5 pb-10 pt-5">
        <View className="gap-3">
          <Text variant="letterDateline" caps accessibilityLabel={dateline.a11y}>
            {dateline.text}
          </Text>
          <Text variant="title1" asHeading={1}>
            {fill(copy.familyTab.membersTitle, { child })}
          </Text>
        </View>

        {notes.map((m) => (
          <Animated.View key={m.id} entering={NOTE_IN} testID="family.leftNote" className="flex-row items-center gap-2 rounded-md bg-secondary py-2 pl-4 pr-1">
            <View accessible accessibilityLiveRegion="polite" className="flex-1">
              <Text variant="body">{m.signsAs.trim() ? fill(f.left.note, { signsAs: m.signsAs.trim(), child }) : fill(f.left.noteUnsigned, { child })}</Text>
            </View>
            <IconButton
              testID="family.leftNote.close"
              icon={XIcon}
              label={copy.common.closeButton}
              size="sm"
              onPress={() => setLeftNotes((n) => (n ? { ...n, list: n.list.filter((x) => x.id !== m.id) } : n))}
            />
          </Animated.View>
        ))}

        <View>
          {people.map((p) => (
            <Animated.View key={p.key} entering={washOf(p.key) ? motion.enter(0) : undefined}>
              <MemberRow testID="family.member" signature={p.signature} role={p.role} wash={washOf(p.key)} />
            </Animated.View>
          ))}
          {visiblePendingRows(pending, state.full).map((p) => (
            <Animated.View key={p.id} entering={settled.current ? motion.enter(0) : undefined} exiting={motion.exit()} layout={motion.layout('standard')}>
              <MemberRow testID="family.pending" pending signature={pendingSignature()} status={p.status === 'open' ? openUntil(p.expiresAt) : f.members.expired}>
                <View className="-ml-3 flex-row flex-wrap gap-1 pt-1">
                  {!state.full && (
                    <RowAction
                      testID="family.pending.shareAgain"
                      label={f.pending.shareAgain}
                      icon={<ShareNetworkIcon size={20} color={c.accent} />}
                      disabled={busyId !== null}
                      onPress={() => void shareAgain(p)}
                    />
                  )}
                  {/* An expired link already stopped working: nothing to cancel, and the server stops listing it after 14 days. */}
                  {p.status === 'open' && (
                    <RowAction
                      testID="family.pending.cancel"
                      label={f.pending.cancel}
                      icon={<XIcon size={20} color={c.accent} />}
                      disabled={busyId !== null}
                      onPress={() => cancel(p)}
                    />
                  )}
                </View>
              </MemberRow>
            </Animated.View>
          ))}
        </View>

        {state.showInviteCard && <InviteCard child={child} note={inviteCardNote({ needsConsent: auth.state.status === 'needsConsent' })} onInvite={invite} />}

        {/* F11-U10: the inviter's line for a full book is create.full; errors.book_full is the invitee's. */}
        <ErrorLine message={shareNote ?? (error ? fill(error === 'book_full' ? f.create.full : f.errors[error], { child }) : null)} />

        {/* No Leave row in build 2 (D-113): it returns, with left books listed under "Letters to {child}", before build 3. */}
      </ScrollView>
    </SafeAreaView>
  );
}
