// BL-419: on the child step "Add another child" sits below the date block, not between the names and the date.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(join(__dirname, '../src/app/onboarding.tsx'), 'utf8');
const child = src.slice(src.indexOf("step === 'child' &&"), src.indexOf("step === 'signsAs' &&"));

describe('[BL-419] child step: Add another child below the date block', () => {
  it('the button comes after the date block and before the signed-in note', () => {
    const date = child.indexOf('dateBlockShown(');
    const add = child.indexOf('o.child.addAnotherButton');
    const note = child.indexOf('<SignedInNote');
    expect(date).toBeGreaterThan(-1);
    expect(add).toBeGreaterThan(date);
    expect(add).toBeLessThan(note);
  });
  it('is still capped by MAX_FIRST_RUN_CHILDREN and keeps its hint', () => {
    expect(child).toMatch(/names\.length < MAX_FIRST_RUN_CHILDREN[\s\S]*addAnotherButton[\s\S]*accessibilityHint=\{o\.child\.addAnotherHelp\}/);
  });
  it('the names field group no longer holds the button', () => {
    const group = child.slice(child.indexOf('names.map('), child.indexOf('dateBlockShown('));
    expect(group).not.toContain('addAnotherButton');
  });
});
