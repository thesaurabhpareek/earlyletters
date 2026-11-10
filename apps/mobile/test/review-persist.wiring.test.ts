/// <reference types="node" />
/**
 * review.tsx's wiring for Review's own choices (SR-C-06, CR-39; RT-REV-02, RT-REV-07). The screen cannot render in
 * Node, so its source is pinned: it mounts through the same functions the replay test runs, and it writes typed words
 * still waiting at once when the app leaves the foreground (inactive or background), at Done, at Close, at unmount
 * and before Keep.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const review = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8');

describe('[SR-C-06] review.tsx mounts through review-persist.logic', () => {
  it('restores with mountReview from the draft (never for a letter whose words arrived later)', () => {
    expect(review).toMatch(/mountReview\(\{\s*saved: draftId && !later \? getDraftReview\(draftId\) : null,\s*words: raw,/);
    expect(review).toMatch(/useState<ReviewView>\(mounted\.view\)/);
    expect(review).toMatch(/useState<string \| null>\(mounted\.userText\)/);
    expect(review).toMatch(/useRef<Edit\[\]>\(mounted\.putBack\)/);
  });

  it('leaves out put-backs only from the fixes cleanSpoken just verified', () => {
    expect(review).toMatch(/const result = cleanSpoken\(raw, [^\n]*\);[\s\S]{0,400}const kept = restoreApplied\(result\.applied, putBacks\.current\);/);
    expect(review).toMatch(/setApplied\(kept\.applied\);/);
  });
});

describe('[F04-REQ-011] review.tsx flushes typed words at once', () => {
  it('when the app is no longer active (inactive or background), and on unmount', () => {
    expect(review).toMatch(/AppState\.addEventListener\('change', \(s\) => \{\s*if \(s !== 'active'\) writer\.flush\(\);\s*\}\);/);
    expect(review).toMatch(/return \(\) => \{\s*sub\.remove\(\);\s*writer\.flush\(\);\s*\};/);
  });

  it('at Done', () => {
    expect(review).toMatch(/if \(!editing\) writer\.flush\(\);/);
  });

  it('at Close, before going back', () => {
    expect(review).toMatch(/onClose=\{\(\) => \{\s*writer\.flush\(\);\s*router\.back\(\);\s*\}\}/);
  });

  it('at Keep, before the gate and the save', () => {
    const save = review.slice(review.indexOf('const save = async (inBook: boolean)'), review.indexOf('const keepRecordingOnly = async'));
    const flush = save.indexOf('writer.flush();');
    expect(flush).toBeGreaterThan(0);
    expect(flush).toBeLessThan(save.indexOf('keepNeedsPlus(finalText)'));
    expect(flush).toBeLessThan(save.indexOf('saveLetterFromDraft('));
  });

  it('every change of the person\'s words, put-backs and the view goes to the writer', () => {
    expect(review).toMatch(/writer\.text\(userText\);/);
    expect(review.match(/writer\.putBack\(putBacks\.current\);/g)).toHaveLength(2); // put back, undo
    expect(review).toMatch(/writer\.view\(next\);/);
  });
});
