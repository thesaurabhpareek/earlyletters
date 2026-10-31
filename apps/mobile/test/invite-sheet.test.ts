/// <reference types="node" />
/**
 * EXPERIENCE_PASS_2026-10 S58, Invite a co-parent (package P8b): its two acceptance boxes, and the states and
 * motion the sheet decides, on the real invite call against a fake server and on the sheet's source, read as text.
 *  - The link carries no child name (BL-348, #165) and works once for 7 days.
 *  - The app sends nothing itself; the person sends the link from the share sheet.
 * Fictional family Asha only.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { authCopy, familyCopy } from '@scribe/content';
import { INVITE_TTL_DAYS } from '@scribe/core/src/invite';
import { afterShare, inviteSheetView } from '../src/components/family/invite-sheet.logic';
import { newInviteDraft } from '../src/lib/family/invite-draft.logic';
import { createCoParentInvite, type FamilyClient } from '../src/lib/family/invites';
import { setFamilyKillSourceForTests } from '../src/lib/family/invites-switch';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (p: string) => src(p).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
const SHEET = 'app/invite/new.tsx';
const ASHA_BOOK = '0199e4a2-7b3c-7d10-8a1b-2c3d4e5f6a7b';

/** A server that makes the invite the phone sent, and records every call. */
function fakeServer() {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const client = {
    rpc: (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args });
      return Promise.resolve({ data: args.p_invite_id, error: null });
    },
    from: () => {
      throw new Error('no table read in the invite');
    },
  } as unknown as FamilyClient;
  return { client, calls };
}

describe('[S58] the link carries no child name and works once for 7 days', () => {
  // Invites are not paused in this test (the switch itself is family-switch.test.ts's).
  beforeAll(() => setFamilyKillSourceForTests({ on: () => false }));
  afterAll(() => setFamilyKillSourceForTests(null));

  it('the shared link is the brand host, /j and the token in the fragment: no name, no sign-off, no book id', async () => {
    const { client, calls } = fakeServer();
    const draft = await newInviteDraft({
      randomBytes: (n) => new Uint8Array(randomBytes(n)),
      sha256Hex: async (t) => createHash('sha256').update(t, 'utf8').digest('hex'),
      newId: () => randomUUID(),
    });
    const invite = await createCoParentInvite(client, ASHA_BOOK, 'Papa', draft);
    expect(invite.url).toMatch(/^https:\/\/earlyletters\.com\/j#t=[A-Za-z0-9_-]{43}$/);
    for (const word of ['Asha', 'asha', 'Papa', ASHA_BOOK]) expect(invite.url).not.toContain(word);
    // The server gets the book's id, the sign-off and the token's hash: never the token, never the child's name.
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0].args)).not.toContain(draft.token);
    expect(JSON.stringify(calls[0].args)).not.toMatch(/Asha/);
  });

  it('the sheet says the link works once, for 7 days, and an invite lasts 7 days', () => {
    expect(familyCopy.create.linkNote).toBe('The link works once, for 7 days. You can cancel it any time.');
    expect(INVITE_TTL_DAYS).toBe(7);
  });
});

describe('[S58] a share sheet dismissed without sending (critics\' pass S1)', () => {
  beforeAll(() => setFamilyKillSourceForTests({ on: () => false }));
  afterAll(() => setFamilyKillSourceForTests(null));

  it('shared: one tick, the sheet closes and the tab says the invite waits; dismissed: the sheet stays, no tick, no toast', () => {
    expect(afterShare('shared')).toEqual({ close: true, tick: true, notice: true, keepDraft: false });
    expect(afterShare('dismissed')).toEqual({ close: false, tick: false, notice: false, keepDraft: true });
    expect(code(SHEET)).toMatch(/const after = afterShare\(shared\);\s*if \(!after\.close\) return;\s*haptic\('success'\);\s*draft\.current = null;\s*familyNotice\.leave\(k\.done\);\s*close\(\);/);
    // The share sheet's answer is the one that tells the two apart.
    expect(code('lib/family/share.ts')).toMatch(/return res\?\.action === Share\.dismissedAction \? 'dismissed' : 'shared';/);
  });

  it('a second tap after a dismissed sheet shares the same invite: the same draft, the same link, one invite', async () => {
    const { client, calls } = fakeServer();
    const draft = await newInviteDraft({
      randomBytes: (n) => new Uint8Array(randomBytes(n)),
      sha256Hex: async (t) => createHash('sha256').update(t, 'utf8').digest('hex'),
      newId: () => randomUUID(),
    });
    const first = await createCoParentInvite(client, ASHA_BOOK, 'Papa', draft);
    const again = await createCoParentInvite(client, ASHA_BOOK, 'Papa', draft);
    expect(again).toEqual(first);
    expect(new Set(calls.map((c) => c.args.p_invite_id)).size).toBe(1);
    // The sheet keeps the draft while the sign-off is unchanged (draftFor), and drops it only after a send.
    expect(code(SHEET)).toMatch(/if \(!fresh && draft\.current && draft\.current\.signsAs === s\) return draft\.current\.draft;/);
  });
});

describe('[S58] the app sends nothing itself', () => {
  it('the link goes only to the system share sheet; the sheet opens no mail, message or web request of its own', () => {
    const sheet = code(SHEET);
    expect(sheet).toMatch(/await shareInviteLink\(invite\.url, child, s \|\| null\)/);
    expect(sheet).not.toMatch(/fetch\(|Linking\.|MailComposer|expo-sms|openURL|Clipboard|setString/);
    const share = code('lib/family/share.ts');
    expect(share).toMatch(/Share\.share\(\{ message: `\$\{text\} \$\{url\}`/);
    expect(share).not.toMatch(/fetch\(|Linking\./);
  });

  it('no contact picker, and the link is never kept, shown again, logged or tracked', () => {
    const sheet = code(SHEET);
    expect(sheet).not.toMatch(/expo-contacts|Contacts\./);
    expect(sheet).not.toMatch(/console\.|setSetting|SecureStore/);
    expect(sheet).toMatch(/trackInviteCreated\(\{ role: 'parent', channel: 'share_sheet', shared: shared === 'shared', childIndex: childIndexOf\(book\.id\) \}\)/);
    expect(sheet).not.toMatch(/track[A-Za-z]*\([^)]*(?:url|token|signsAs|child\b)/);
  });
});

describe('[S58] states', () => {
  it('two parents already: the full line and no Share; no book on this phone: the book line; otherwise the form', () => {
    expect(inviteSheetView({ hasBook: false, full: false })).toBe('missing');
    expect(inviteSheetView({ hasBook: true, full: true })).toBe('full');
    expect(inviteSheetView({ hasBook: true, full: false })).toBe('form');
    const sheet = code(SHEET);
    expect(sheet).toMatch(/view === 'full' \? \(\s*<SheetBody>\{fill\(k\.full, \{ child \}\)\}<\/SheetBody>/);
    expect(familyCopy.create.full).toBe("{child}'s book has two parents.");
  });

  it('signed out: the sign-in sheet first, with its own invite_create body (card.signedOutNote is retired)', () => {
    const sheet = code(SHEET);
    expect(sheet).toMatch(/<AccountGate trigger="invite_create" signInBody=\{authCopy\.sheet\.bodies\.invite_create\}>/);
    expect(typeof authCopy.sheet.bodies.invite_create).toBe('string');
    expect('signedOutNote' in familyCopy.card).toBe(false);
  });

  it('the book cover is the invite\'s subject: 132 by 176, closed, the name, and the typed sign-off on its foot line after a pause', () => {
    const sheet = code(SHEET);
    expect(sheet).toMatch(/<BookCover name=\{child\} signsAs=\{coverSignsAs \|\| undefined\} size="md"/);
    expect(sheet).toMatch(/useSettled\(signsAs, COVER_PAUSE_MS\)/);
    expect(sheet).toMatch(/const COVER_PAUSE_MS = 300;/);
    expect(sheet).toMatch(/<TextField[\s\S]*?face="serif"/);
    expect(sheet).toMatch(/<Chip\s+key=\{ex\}\s+label=\{ex\}\s+selected=\{signsAs === ex\}/);
  });

  it('the primary is the frame\'s footer, above the keyboard, with the error line above it, once the account can invite (critics\' pass S3)', () => {
    const sheet = code(SHEET);
    expect(sheet).toMatch(/const footer =\s*view === 'form' && auth\.canSync \? \(\s*<>\s*<ErrorLine message=\{error \? fill\(familyCopy\.errors\[error\], \{ child \}\) : null\} \/>[\s\S]*?<Button testID="inviteNew\.share"[\s\S]*?<\/>\s*\) : undefined;/);
    expect(sheet).toMatch(/<SheetFrame closeLabel=\{familyCopy\.accept\.close\} closeDisabled=\{busy\} footer=\{footer\}>/);
    // One primary only, and not in the scrolling body.
    expect(sheet.match(/testID="inviteNew\.share"/g)).toHaveLength(1);
    const body = sheet.slice(sheet.indexOf('<SheetFrame closeLabel={familyCopy.accept.close} closeDisabled={busy} footer={footer}>'));
    expect(body).not.toMatch(/inviteNew\.share/);
  });

  it('getting the link keeps the primary\'s size with its busy line inside it', () => {
    const sheet = code(SHEET);
    expect(sheet).toMatch(/<Button testID="inviteNew\.share" size="lg" loading=\{busy\} label=\{busy \? k\.working : k\.share\}/);
  });

  it('when the share sheet closes, this sheet closes and the Family tab says the invite waits there', () => {
    const sheet = code(SHEET);
    expect(sheet).toMatch(/familyNotice\.leave\(k\.done\);\s*close\(\);/);
    expect(familyCopy.create.done).toBe('The invite waits on the Family tab until they join.');
  });
});
