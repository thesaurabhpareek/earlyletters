/** Shared moves for the journey flows. Only fictional family data ("Asha"); everything goes through the real screens. */
import type { Page } from '@playwright/test';
import { authCopy, en } from '@scribe/content';
import { bookCopy } from '../../src/components/book/copy';
import { canary, expect, type Recorder } from './journey';
import type { Need } from './saved-moment';
import { assertUniqueStepId } from './step-id';

export const CHILD = 'Asha';
export const SIGNS_AS = 'Mama';

export const btn = (page: Page, name: string | RegExp) => page.getByRole('button', { name });

/** The agreement box on Before you begin (F2): a native checkbox named by its sentence. */
export const agreeBox = (page: Page) => page.getByRole('checkbox', { name: 'I agree to the Terms of Service and Privacy Policy.' });

/** Before you begin: Yes, the agreement box, Continue. The gate's words leave first (exitMs), then the welcome takes the light. */
export async function passAgeGate(page: Page) {
  await page.getByRole('radio', { name: 'Yes' }).click();
  await agreeBox(page).click();
  await btn(page, 'Continue').click();
  await expect(btn(page, 'Begin the book')).toBeVisible();
}

/**
 * The same gate on the server-on build (NX-31 R17, NX-36 S2): with no session and no book the first screen is the account-first
 * welcome, not "Begin the book". It offers Sign in with email and, where the build shows it, "I was invited". The words are
 * read from packages/content, so a copy round moves the flow with the screen.
 */
export async function passAgeGateToSignIn(page: Page) {
  await page.getByRole('radio', { name: 'Yes' }).click();
  await agreeBox(page).click();
  await btn(page, 'Continue').click();
  await expect(btn(page, authCopy.sheet.email)).toBeVisible();
  await expect(page.getByText(authCopy.sheet.bodies.sign_in_first)).toBeVisible();
  await expect(btn(page, 'Begin the book')).toHaveCount(0);
}

export async function startOnboarding(page: Page) {
  await btn(page, 'Begin the book').click();
  await expect(btn(page, 'Continue')).toBeVisible();
}

export async function toChildStep(page: Page) {
  await btn(page, 'Continue').click();
  await expect(page.getByText('Who is this book for?')).toBeVisible();
}

/** The child step's name fields (the date control, a web date input, is not a textbox). */
export const nameField = (page: Page, i = 0) => page.getByRole('textbox').nth(i);

/** Whole first run, ending on Tonight. */
export async function firstRun(page: Page, name = CHILD) {
  await passAgeGate(page);
  await startOnboarding(page);
  await toChildStep(page);
  await nameField(page).fill(name);
  // The date block arrives with the first letter of the name; "Born today" is a chip beside the date control.
  await btn(page, 'Born today').click();
  await btn(page, 'Continue').click();
  await page.getByText(SIGNS_AS, { exact: true }).click();
  await btn(page, 'Sign my letters').click();
  await btn(page, /Write the first one/).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/**
 * Numbered step recorder for one journey: `step('happy', title, note)` records J05-07 and so on, "from" defaulting to the
 * previous step. Pass `from` to branch. `start` keeps ids stable when a journey is split over several tests.
 */
export function journey(record: Recorder, code: string, name: string, start = 1, first?: string) {
  let n = start - 1;
  let last = first;
  // BL-480: ids used by THIS journey call; the map is per call, so a repeat inside one call throws. The J24 tests do not
  // rely on that: each has its own start id (AX1 01-03, AX3 04-06, AX5 07-09, hi/es/zh/fr/ar/pt 10-15; BL-1643).
  const seen = new Map<string, string>();
  return async (kind: 'happy' | 'unhappy', title: string, note: string, from?: string, opts?: { settle?: number; needs?: Need[] }): Promise<string> => {
    n += 1;
    const id = `${code}-${String(n).padStart(2, '0')}`;
    assertUniqueStepId(seen, id, title);
    await record({ id, journey: name, kind, title, note, from: from ?? last }, opts);
    last = id;
    return id;
  };
}

// `.first()`: while a modal is leaving, the tab and a hidden label can both match; the tab comes first.
export const tab = (page: Page, name: 'Home' | 'Book' | 'Me') => page.getByRole('tab', { name }).or(page.getByText(name, { exact: true }).last()).first();

/** The tab that is selected now: a landing check that fails if the app shows another tab (EXPERIENCE_PASS 5.8 row 5). */
export const selectedTab = (page: Page, name: 'Home' | 'Book' | 'Me') => page.getByRole('tab', { name, selected: true });

/**
 * Type a letter on the Write screen and keep it with one tap (the honest path to a letter on the web, which has no
 * speech model). Typed letters keep from Write with no Review step and land on the Book (EXPERIENCE_PASS S20, P4b).
 */
export async function typeLetter(page: Page, text: string, to: 'book' | 'private' = 'book') {
  canary(page, text);
  await btn(page, /^Type/).click();
  await page.getByRole('textbox').first().fill(text);
  await btn(page, to === 'book' ? /^Add to .*book/ : 'Keep private').click();
}

/**
 * The reminder card after the phone's first letter (C-REQ-001 Rev, DR-12 B; components/asks/reminder-prime-ask.tsx):
 * answers "No reminders" so a journey about something else can go on over the Book. Asserts the card was there.
 */
export async function noRemindersAfterFirstLetter(page: Page) {
  await expect(page.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toBeVisible({ timeout: 8000 });
  await btn(page, 'No reminders').click();
  await expect(page.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toHaveCount(0);
}

/** Local calendar day `days` from today (negative = earlier), YYYY-MM-DD, in the browser's time zone (the same machine). */
export function dayOffset(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The web date input (the compact iOS picker cannot open on web). Pass its accessible label. */
export const dateInput = (page: Page, label: string | RegExp) => page.getByLabel(label).and(page.locator('input[type="date"]'));

/**
 * A month's opener in the Book, found as the one level-2 heading VoiceOver reads: "6 months, October 24 to November 23", with
 * "This month, " in front when it is the month the child is in. The words come from the app's own copy (book/copy.ts and
 * content book.thisMonthLabel), so a wording change moves this with it. The count of letters lives in the Months sheet now.
 */
export const monthOpener = (page: Page, months: number) =>
  page.getByRole('heading', { name: new RegExp(`^(${en.book.thisMonthLabel}, )?${bookCopy.chapterAge.replace('{n}', String(months))}, `) });
/** The opener of the month the child is in today (any age): "This month, 7 months, ..." or "This month, The first weeks, ...". */
export const currentMonthOpener = (page: Page) => page.getByRole('heading', { name: new RegExp(`^${en.book.thisMonthLabel}, `) });

/**
 * The count line of a month, as the Months sheet says it ("2 letters, from Mama"): the Book's opener no longer carries it.
 * Opens the sheet, reads that month's row, closes the sheet. Restores what J09b, J18 and J08c proved before the opener
 * dropped the count (BL-1991): the number of letters and who wrote them.
 */
export async function expectMonthCount(page: Page, months: number, line: RegExp) {
  await page.getByTestId('book.months').click();
  const sheet = page.getByTestId('book.monthsSheet');
  await expect(sheet).toBeVisible();
  const row = sheet.locator('[data-testid^="book.month."]').filter({ hasText: bookCopy.chapterAge.replace('{n}', String(months)) });
  await expect(row).toContainText(line);
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
}
