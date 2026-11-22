/// <reference types="node" />
/**
 * BL-469: the leave sheet keeps a Close of its own when the sign-in gate (AccountGate) replaces the Leave and Stay
 * buttons. The close is the sheet frame's header Close, outside the gate's children, so it shows in every gate
 * state and dismisses through the sheet's own close. Read as text, like the other screen tests here (no render
 * harness in this app). Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const code = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
const leave = code('app/invite/leave.tsx');
const ui = code('lib/auth/ui.tsx');
const main = leave.slice(leave.indexOf('function LeaveBook()'));
const frame = main.slice(main.lastIndexOf('<SheetFrame'), main.indexOf('<AccountGate'));

describe('[BL-469] the leave sheet closes inside the sheet when the sign-in gate shows', () => {
  it('the sheet frame carries the header Close, outside the gate, with the existing Close label', () => {
    expect(frame).toMatch(/closeLabel=\{familyCopy\.accept\.close\}/);
    expect(frame.indexOf('closeLabel')).toBeLessThan(main.indexOf('<AccountGate'));
  });

  it('the Close dismisses through the sheet close and is held while a leave is in flight', () => {
    expect(frame).toMatch(/closeDisabled=\{busy\}/);
    const sheetFrame = ui.slice(ui.indexOf('export function SheetFrame'), ui.indexOf('export function SheetFrame') + 1800);
    expect(sheetFrame).toMatch(/onClose=\{close\}/);
    expect(sheetFrame).toMatch(/closeLabel=\{closeLabel\}/);
  });

  it('the gate still replaces only the footer buttons, so the Close is not one of its children', () => {
    expect(main).toMatch(/<AccountGate[^>]*>[\s\S]*leave\.confirm[\s\S]*leave\.stay[\s\S]*<\/AccountGate>/);
  });
});
