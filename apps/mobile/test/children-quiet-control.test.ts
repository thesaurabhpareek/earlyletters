/// <reference types="node" />
/**
 * [BL-985] The Quiet control on a book's page in Me (F12-REQ-011). Source-pinned like children-settings.test.ts: the page is
 * React Native. Fictional family Asha only.
 *
 * children.quiet.help says "Home and reminders stay quiet about {child}". Today only the reminders planner reads Child.quiet;
 * Home's prompt, the Save a copy slip and Read together do not. So the help line is not shown yet, and HELP_HOLD below fails
 * the day any screen mentions it before those three read Child.quiet (mirrors NOT_SHOWN_YET in packages/content/test/nameless-child.test.ts).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';

const SRC = join(__dirname, '..', 'src');
const PAGE = 'app/settings/children/[id].tsx';
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const code = (rel: string) => strip(readFileSync(join(SRC, rel), 'utf8'));
const allSrc = () => readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter((f) => /\.tsx?$/.test(f));

/** Each behaviour the help line describes, and the source that must read Child.quiet before the line may show. */
const HELP_NEEDS: Record<string, string> = {
  'Home prompt skips a quiet child': 'components/tonight/prompt.logic.ts',
  'Save a copy slip': 'components/book/save-copy.logic.ts',
  'Read together suggestions': 'components/read-together/suggestions.logic.ts',
};
const behaviourExists = (file: string) => {
  try {
    return /\.quiet\b/.test(code(file));
  } catch {
    return false;
  }
};

describe('[BL-985] Quiet this book, on the book page', () => {
  const page = code(PAGE);

  it('renders the Quiet control with the existing label, a toggle on Child.quiet', () => {
    expect(page).toMatch(/<ToggleRow\s+title=\{copy\.children\.quiet\.label\}/);
    expect(page).toMatch(/value=\{child\.quiet === true\}/);
    expect(page).toMatch(/testID="child\.quiet"/);
    expect(en.children.quiet.label).toBe('Quiet this book');
  });

  it('toggling calls setChildQuiet with this book and the new value, and says so with the two toasts', () => {
    expect(page).toMatch(/import \{[^}]*\bsetChildQuiet\b[^}]*\} from '@\/lib\/store'/);
    expect(page).toMatch(/onValueChange=\{\(on\) => \{\s*setChildQuiet\(child\.id, on\);/);
    expect(page).toMatch(/on \? copy\.children\.quiet\.quietedToast : copy\.children\.quiet\.offToast/);
  });

  it('is offered beside Hide, and not only when there are two books', () => {
    expect(page.indexOf('child.quiet')).toBeGreaterThan(-1);
    expect(page.indexOf('child.quiet')).toBeLessThan(page.indexOf('child.hide'));
    expect(page).not.toMatch(/listChildren\(\)\.length > 1 && \(\s*<ListSection>\s*<ToggleRow/);
  });

  it('does not show the help line (children.quiet.help) on any screen until the behaviours it describes exist', () => {
    const mentions = allSrc().filter((f) => /quiet\.help\b/.test(code(f)));
    const missing = Object.entries(HELP_NEEDS).filter(([, file]) => !behaviourExists(file));
    if (missing.length > 0) {
      expect(mentions, `children.quiet.help is wired before: ${missing.map(([k]) => k).join(', ')}`).toEqual([]);
    }
    // The other way: once all three exist, this pin is stale and must be replaced by a test that the line shows.
    expect(missing.length, 'all three behaviours exist: show children.quiet.help and replace HELP_NEEDS with a render test').toBeGreaterThan(0);
  });
});
