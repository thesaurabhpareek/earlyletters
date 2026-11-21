/// <reference types="node" />
/**
 * A11Y audit FE-8 and FE-9, read as source text (nothing here loads React Native; the AX5 walk on a phone is X1).
 * ListRow is a column at accessibility sizes and a row below them; the code field drops its letter spacing and halves
 * its side padding at accessibility sizes, with the type size unchanged.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const listRow = readFileSync(join(SRC, 'components/ui/list-row.tsx'), 'utf8');
const codeScreen = readFileSync(join(SRC, 'app/(auth)/sign-in/code.tsx'), 'utf8');

describe('ListRow at accessibility sizes', () => {
  it('is a column (no flex-row on the row) and a row below them', () => {
    expect(listRow).toMatch(/const rowClass = ax \? 'min-h-11 gap-2 px-4 py-3' : 'min-h-11 flex-row items-center gap-3 px-4 py-3';/);
  });

  it('puts the text on the full width, the leading icon on its own line and the chevron on its own line', () => {
    expect(listRow).toMatch(/ax \? 'self-stretch gap-1' : 'flex-1 flex-row items-center gap-3'/);
    expect(listRow).toMatch(/'w-7 items-center', ax && 'self-start'/);
    expect(listRow).toMatch(/ax \? 'self-end' : undefined/);
  });
});

describe('the code field at accessibility sizes', () => {
  it('drops the letter spacing and halves the side padding, and does not change the size', () => {
    expect(codeScreen).toMatch(/const CODE_SPACING_AX = 0;/);
    expect(codeScreen).toMatch(/paddingHorizontal: ax \? tokens\.space\[2\] : tokens\.space\[4\]/);
    expect(codeScreen).toMatch(/letterSpacing: ax \? CODE_SPACING_AX : CODE_TYPE\.letterSpacing/);
    expect(codeScreen).toMatch(/fontSize: CODE_TYPE\.fontSize,/);
  });

  it('keeps the Dynamic Type doc comment next to CODE_TYPE', () => {
    expect(codeScreen).toMatch(/Dynamic Type cap: six digits stay on one line\. \*\/\nconst CODE_TYPE =/);
  });
});
