/**
 * Policy macros (BL-1335): FR-POL-05, FR-POL-06 and FR-POL-07 in docs/product/prd/functions/support.md.
 *
 * Reads `docs/support/macros.md` once. The words are PROPOSED until the exec team's counsel read (D-172); this test
 * holds their shape, not their wording: one dispute reply for both parents, no reply at all to legal process with the
 * date logged the same day, and one neutral under-18 reply that asks for no proof and names no account.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { ASKS_FOR_MATERIAL, NAMES_AN_ACCOUNT, bodyText, parseMacros, parseSends, readMacrosFile, type Macro, type Send } from './support/macros-file';

let md: string;
let macros: Map<string, Macro>;
let sends: Send[];

/** The house bans of CLAUDE.md that apply to any word a person reads. */
const BANNED_CHARACTERS = /[–—‘’“”…\u{1F300}-\u{1FAFF}☀-➿]/u;

beforeAll(() => {
  md = readMacrosFile();
  macros = parseMacros(md);
  sends = parseSends(md);
});

function macro(key: string): Macro {
  const m = macros.get(key);
  if (!m) throw new Error(`docs/support/macros.md has no macro ${key}`);
  return m;
}

/** Problems with an under-18 reply, empty when it is neutral (FR-POL-07). Exported shape kept local: the test plants bad bodies. */
function under18Problems(body: string): string[] {
  const text = bodyText(body);
  const out: string[] = [];
  for (const re of ASKS_FOR_MATERIAL) if (re.test(text)) out.push(`asks for proof or material: ${re}`);
  for (const re of NAMES_AN_ACCOUNT) if (re.test(text)) out.push(`names an account or what happened to it: ${re}`);
  return out;
}

describe('docs/support/macros.md', () => {
  it('is marked PROPOSED until the exec-team counsel read (D-172)', () => {
    expect(md).toMatch(/^Status: PROPOSED\b/m);
    expect(md).toMatch(/D-172/);
  });

  it('every macro has a trigger, and every word a person reads keeps the house character bans', () => {
    expect(macros.size).toBeGreaterThan(0);
    for (const m of macros.values()) {
      expect(m.notes.Trigger, `${m.key} has no Trigger line`).toBeTruthy();
      expect(BANNED_CHARACTERS.test(m.body), `${m.key} has a banned character`).toBe(false);
      expect(m.body, `${m.key} types the product name; use \${brand.name}`).not.toMatch(/Early Letters/);
    }
  });

  it('every send in the table names a macro that exists, or none', () => {
    for (const s of sends) if (s.key) expect(macros.has(s.key), `${s.situation} -> ${s.key}`).toBe(true);
  });
});

describe('[FR-POL-05] one reply for a family or custody dispute, the same words to both parents', () => {
  const KEY = 'policy.familyDispute';

  it('[FR-POL-05] both parents get the same macro key, read once from the file', () => {
    const dispute = sends.filter((s) => /custody|dispute/i.test(s.situation));
    expect(dispute.length).toBeGreaterThanOrEqual(2);
    expect(dispute.some((s) => /parent who wrote/i.test(s.recipient))).toBe(true);
    expect(dispute.some((s) => /other parent/i.test(s.recipient))).toBe(true);
    expect(new Set(dispute.map((s) => s.key))).toEqual(new Set([KEY]));
  });

  it('[FR-POL-05] says we do not decide disputes, will not move or hand over letters, and act on a verifiable court order (Terms 4.4)', () => {
    const text = bodyText(macro(KEY).body);
    expect(text).toMatch(/don't decide custody or family disputes/);
    expect(text).toMatch(/won't move or hand over one parent's letters/);
    expect(text).toMatch(/valid court order/);
    expect(text).toMatch(/verify/);
  });

  it('[FR-POL-05] the safety pointer goes first when the message mentions danger', () => {
    expect(macro(KEY).notes['Before it']).toMatch(/danger/);
    expect(macro(KEY).notes['Before it']).toMatch(/M6/);
  });
});

describe('[FR-POL-06] a letter from a lawyer, a court or the police gets no reply, action or disclosure until counsel says so', () => {
  const KEY = 'policy.legalProcess';

  it('[FR-POL-06] the macro sends nothing, and the table sends nothing to the sender', () => {
    expect(macro(KEY).body.trim()).toBe('');
    const legal = sends.filter((s) => /lawyer|court|police/i.test(s.situation));
    expect(legal.length).toBe(1);
    expect(legal[0].key).toBeNull();
  });

  it('[FR-POL-06] says no reply, no action and no disclosure until counsel says so', () => {
    const sendTo = macro(KEY).notes['Send to'];
    expect(sendTo).toMatch(/no reply/);
    expect(sendTo).toMatch(/no action/);
    expect(sendTo).toMatch(/no disclosure/);
    expect(sendTo).toMatch(/until counsel says so/);
  });

  it('[FR-POL-06] logs kind legal_process with legal_date the same day', () => {
    expect(macro(KEY).notes['Same day']).toMatch(/legal_date/);
    const section = md.split(/^## /m).find((s) => s.startsWith('Letters from a lawyer'))!;
    expect(section).toMatch(/\| kind \| `legal_process` \|/);
    expect(section).toMatch(/\| legal_date \| [^|]*same day[^|]*\|/);
  });
});

describe('[FR-POL-07] one neutral reply to a report that someone is under 18', () => {
  const KEY = 'policy.under18Report';

  it('[FR-POL-07] every under-18 report gets the one macro', () => {
    const rows = sends.filter((s) => /under 18/i.test(s.situation));
    expect(rows.map((s) => s.key)).toEqual([KEY]);
  });

  it('[FR-POL-07] the reply asks for no proof of age and says nothing about any account', () => {
    expect(under18Problems(macro(KEY).body)).toEqual([]);
  });

  it('[FR-POL-07] the check fails on a reply that names an account or asks for proof', () => {
    expect(under18Problems('Hi,\n\nThanks. We found their account and closed it.\n')).not.toEqual([]);
    expect(under18Problems('Hi,\n\nThanks. Please send us proof of age for the person.\n')).not.toEqual([]);
    expect(under18Problems('Hi,\n\nThanks. The account has been looked at.\n')).not.toEqual([]);
    for (const planted of [
      'We could not find an account for that address.',
      'There is no account with that email.',
      'An account under that address exists.',
      'Could you tell us how old they are?',
      'We have no record of anyone using that address.',
      "We've disabled their profile.",
      "We've taken action on this.",
      'What year were they born?',
      'Nobody is signed up with that address.',
      "We've dealt with it.",
      "We'll let you know the outcome.",
      'If they are under 18, we will delete it.',
      'We will remove them if so.',
    ]) {
      expect(under18Problems(`Hi,\n\nThanks. ${planted}\n`), planted).not.toEqual([]);
    }
  });

  it('[FR-POL-07] the safety pointer goes first when the report says the child is in danger', () => {
    expect(macro(KEY).notes['Before it']).toMatch(/danger/);
    expect(macro(KEY).notes['Before it']).toMatch(/M6/);
  });

  it('[FR-POL-07] hands the report to underage-account.md', () => {
    expect(macro(KEY).notes.Then).toMatch(/underage-account\.md/);
  });
});
