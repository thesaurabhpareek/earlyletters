/**
 * ListSection divider layout: dividers between rows only, inset from the leading edge,
 * and rows never indented (the brand-content finding of 3 Oct: "ListSection indents
 * whole rows after the first").
 */
import { describe, expect, it } from 'vitest';
import { DIVIDER_INSET, LEADING_COLUMN, dividerInset, rowLabel, showsChevron, trailingNodePlacement, withDividers } from './list-row.logic';

describe('withDividers', () => {
  it('no rows: nothing at all', () => {
    expect(withDividers([])).toEqual([]);
  });

  it('one row: no divider above or below it', () => {
    expect(withDividers(['a']).map((i) => i.type)).toEqual(['row']);
  });

  it('puts exactly one divider between each pair of rows, none at the ends', () => {
    const items = withDividers(['a', 'b', 'c', 'd']);
    expect(items.map((i) => i.type)).toEqual(['row', 'divider', 'row', 'divider', 'row', 'divider', 'row']);
    expect(items.filter((i) => i.type === 'divider')).toHaveLength(3);
    expect(items[0].type).toBe('row');
    expect(items[items.length - 1].type).toBe('row');
  });

  it('keeps every row, in order and unchanged (rows are never wrapped or indented)', () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const out = withDividers(rows).flatMap((i) => (i.type === 'row' ? [i.row] : []));
    expect(out).toEqual(rows);
    out.forEach((r, i) => expect(r).toBe(rows[i]));
  });

  it('insets every divider, and only the divider, by the row padding by default', () => {
    for (const item of withDividers(['a', 'b', 'c'])) {
      if (item.type === 'divider') expect(item.inset).toBe(DIVIDER_INSET);
      else expect(item).not.toHaveProperty('inset');
    }
  });

  it('lines a divider up with the text of the row below it when that row has a leading icon', () => {
    const rows = [
      { title: 'Make private', leading: true },
      { title: 'Delete', leading: true },
      { title: 'Plain', leading: false },
    ];
    const dividers = withDividers(rows, (r) => r.leading).filter((i) => i.type === 'divider');
    expect(dividers.map((d) => (d.type === 'divider' ? d.inset : -1))).toEqual([DIVIDER_INSET + LEADING_COLUMN, DIVIDER_INSET]);
  });

  it('gives each item a unique, stable key', () => {
    const keys = withDividers(['a', 'b', 'c']).map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(withDividers(['x', 'y', 'z']).map((i) => i.key)).toEqual(keys);
  });
});

describe('dividerInset', () => {
  it('is the 16 pt row padding without an icon and the text start with one', () => {
    expect(dividerInset(false)).toBe(16);
    expect(dividerInset(true)).toBe(16 + 28 + 12);
  });
});

describe('showsChevron: every pressable row says it can be pressed', () => {
  const base = { pressable: true, hasTrailingNode: false };
  it('a pressable row, with or without a value, shows a chevron', () => {
    expect(showsChevron(base)).toBe(true);
  });
  it('a caption-only row (no press) shows none', () => {
    expect(showsChevron({ ...base, pressable: false })).toBe(false);
  });
  it('a row with its own control (switch, check) shows no chevron', () => {
    expect(showsChevron({ ...base, hasTrailingNode: true })).toBe(false);
  });
  it('destructive and disabled rows show none; Android keeps its own convention', () => {
    expect(showsChevron({ ...base, destructive: true })).toBe(false);
    expect(showsChevron({ ...base, disabled: true })).toBe(false);
    expect(showsChevron({ ...base, android: true })).toBe(false);
  });
});

describe('rowLabel: the word a tap does is in the label (WCAG 2.5.3 Label in Name; Voice Control "Tap Stop")', () => {
  const base = { title: 'English', subtitle: 'Getting ready, 40%', pressable: true };
  it('puts the action word last, after the title, the subtitle and the value', () => {
    expect(rowLabel({ ...base, actionWord: 'Stop' })).toBe('English, Getting ready, 40%, Stop');
    expect(rowLabel({ title: 'Reminders', value: 'Few times a week', actionWord: 'Edit', pressable: true })).toBe('Reminders, Few times a week, Edit');
  });
  it('without an action word the label is what it always was', () => {
    expect(rowLabel(base)).toBe('English, Getting ready, 40%');
    expect(rowLabel({ title: 'Storage', pressable: true })).toBe('Storage');
    expect(rowLabel({ title: 'Version', value: '1.0.0', pressable: false })).toBe('Version, 1.0.0');
  });
  it('a row nothing can press, or a disabled one, names no action', () => {
    expect(rowLabel({ ...base, actionWord: 'Stop', pressable: false })).toBe('English, Getting ready, 40%');
    expect(rowLabel({ ...base, actionWord: 'Stop', disabled: true })).toBe('English, Getting ready, 40%');
  });
  it('skips empty parts and never leaves a stray comma', () => {
    expect(rowLabel({ title: 'English', subtitle: '', value: null, actionWord: 'Download', pressable: true })).toBe('English, Download');
    expect(rowLabel({ title: 'English', subtitle: null, actionWord: '', pressable: true })).toBe('English');
  });
});

describe('trailingNodePlacement: a trailing node stacks under the title at accessibility sizes, as a value does', () => {
  it('beside the title at a normal size, under it at AX sizes', () => {
    expect(trailingNodePlacement({ ax: false, hasNode: true })).toBe('beside');
    expect(trailingNodePlacement({ ax: true, hasNode: true })).toBe('under');
  });
  it('no node: nothing to place, at any size', () => {
    expect(trailingNodePlacement({ ax: false, hasNode: false })).toBe('none');
    expect(trailingNodePlacement({ ax: true, hasNode: false })).toBe('none');
  });
});
