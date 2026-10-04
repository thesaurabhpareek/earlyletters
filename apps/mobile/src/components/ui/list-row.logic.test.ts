/**
 * ListSection divider layout: dividers between rows only, inset from the leading edge,
 * and rows never indented (the brand-content finding of 3 Oct: "ListSection indents
 * whole rows after the first").
 */
import { describe, expect, it } from 'vitest';
import { DIVIDER_INSET, LEADING_COLUMN, dividerInset, withDividers } from './list-row.logic';

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
