/// <reference types="node" />
/**
 * BL-409 (LEGAL-REQ-051): the step JSON carries what a screen reader would be given, as role, name and order, read from
 * the browser's accessibility tree. The parser is pure (no Playwright), so these tests run in `npm test`. The journey run
 * that feeds it is the proposed job in docs/ops/proposed/ax5-evidence.md.
 */
import { describe, expect, it } from 'vitest';
import { parseAriaSnapshot, unnamedControls } from '../e2e-web/support/a11y-tree';

const SNAP = `- heading "Tonight" [level=1]
- button "Settings"
- button:
  - img
- link "Help":
  - /url: /help
- textbox "Name" [disabled]
- switch "Reminders" [checked]
- text: Asha
- button "Say \\"hi\\""`;

describe('BL-409 accessibility tree export', () => {
  it('[BL-409] reads role, name and order from an aria snapshot', () => {
    const tree = parseAriaSnapshot(SNAP);
    expect(tree.map((n) => `${n.role}:${n.name}`)).toEqual([
      'heading:Tonight',
      'button:Settings',
      'button:',
      'img:',
      'link:Help',
      'textbox:Name',
      'switch:Reminders',
      'button:Say "hi"',
    ]);
    expect(tree.map((n) => n.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('[BL-409] names an unlabeled button, link or switch, and nothing else', () => {
    const bad = unnamedControls(parseAriaSnapshot(SNAP));
    expect(bad).toEqual([{ role: 'button', name: '', order: 2 }]);
  });

  it('[BL-409] an empty or unparseable snapshot has no controls and no failure', () => {
    expect(parseAriaSnapshot('')).toEqual([]);
    expect(unnamedControls([])).toEqual([]);
  });

  it('[BL-1622] reads a YAML single-quoted key: an apostrophe or a colon in the name, and an unnamed control', () => {
    const snap = [
      "- 'button \"Add to Asha''s book\"':",
      "  - img",
      "- 'link \"Asha B: letters\"':",
      "  - /url: /letters",
      "- 'button [disabled]':",
      "- 'text: Asha''s book'",
      "- button \"Plain\"",
    ].join('\n');
    const tree = parseAriaSnapshot(snap);
    expect(tree.map((n) => `${n.role}:${n.name}`)).toEqual([
      "button:Add to Asha's book",
      'img:',
      'link:Asha B: letters',
      'button:',
      'button:Plain',
    ]);
    expect(unnamedControls(tree)).toEqual([{ role: 'button', name: '', order: 3 }]);
  });
});
