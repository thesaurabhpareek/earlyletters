import { Redirect } from 'expo-router';
import { UserPlusIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View, useColorScheme } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { useMotion } from '@/lib/motion';
import { listMembers, subscribe, type Member } from '@/lib/store';
import { MemberRow } from '@/components/family/member-row';
import { useChildren } from '@/components/child/use-children';

/** Family (DESIGN_LANGUAGE 12, Family invite; PRD B F5). Invites need sign-in, so the action is honest and disabled. */
export default function Family() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { enter } = useMotion();
  const { active } = useChildren();
  const [members, setMembers] = useState<Member[]>([]);
  const f = copy.familyTab;

  useEffect(() => {
    if (!active) return;
    const read = () => setMembers(listMembers(active.id));
    read();
    return subscribe(read);
  }, [active?.id]);

  if (!active) return <Redirect href="/onboarding" />;
  const child = active.name;
  const roleLabel = (m: Member) => (m.role === 'parent' ? f.coParentLabel : f.familyLabel);

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
            {fill(f.membersTitle, { child }).toUpperCase()}
          </Text>
          <View className="rounded-[20px] border border-border bg-card px-4">
            <MemberRow signsAs={active.signsAs} role={f.youLabel} />
            {members.map((m) => (
              <View key={m.id} className="border-t border-border">
                <MemberRow signsAs={m.signsAs} role={roleLabel(m)} status={m.status === 'invited' ? copy.family.invite.pendingLabel : undefined} />
              </View>
            ))}
          </View>
          {members.length === 0 && (
            <View className="gap-1 pt-2">
              <Text className="font-serif text-xl text-foreground">{f.emptyTitle}</Text>
              <Text className="text-base leading-6 text-muted-foreground">{f.emptyBody}</Text>
            </View>
          )}
        </View>

        <View className="gap-3 rounded-[20px] bg-muted p-5">
          <Text role="heading" className="font-serif text-2xl text-foreground">
            {copy.family.invite.title}
          </Text>
          <Text className="text-base leading-6 text-foreground">{fill(copy.family.invite.body, { child })}</Text>
          <Button disabled className="self-start" accessibilityHint={f.inviteNeedsSignIn}>
            <UserPlusIcon size={18} color={c.onAccent} />
            <Text>{copy.onboarding.invite.addButton}</Text>
          </Button>
          <Text className="text-sm leading-5 text-muted-foreground">{f.inviteNeedsSignIn}</Text>
        </View>

        <View className="gap-3">
          <Text role="heading" className="text-xs font-medium tracking-[1.2px] text-muted-foreground">
            {f.rolesTitle.toUpperCase()}
          </Text>
          {[
            { label: f.coParentLabel, body: f.coParentBody },
            { label: f.familyLabel, body: fill(f.familyBody, { child }) },
          ].map((r) => (
            <View key={r.label} accessible className="gap-1 rounded-[14px] border border-border bg-card p-4">
              <Text className="text-lg font-semibold text-foreground">{r.label}</Text>
              <Text className="text-base leading-6 text-muted-foreground">{r.body}</Text>
            </View>
          ))}
          <Text className="text-sm leading-5 text-muted-foreground">{copy.onboarding.invite.privacyNote}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
