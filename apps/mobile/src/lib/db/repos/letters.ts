/**
 * Draft to letter (DATA-REQ-048): the letter is inserted and its draft
 * removed in one transaction, so a kill or a throw leaves either the full
 * letter or the intact draft, never both and never neither.
 */
import type { RepoContext } from './context';
import * as drafts from './drafts';
import * as entries from './entries';
import type { Draft, Entry } from './types';

export class AudioMissingError extends Error {
  constructor() {
    super('audio_missing');
  }
}

/**
 * The audio must already be closed and hashed; a spoken letter whose file is
 * gone is refused rather than saved pointing at nothing (`audioExists` is
 * checked by the caller just before). The entry id becomes the draft id.
 */
export function saveFromDraft(ctx: RepoContext, draftId: string, e: Entry, defaults: entries.InsertDefaults, audioExists = true): void {
  if (e.audioUri && !audioExists) throw new AudioMissingError();
  ctx.db.transaction(() => {
    entries.upsert(ctx, { ...e, id: draftId }, defaults);
    drafts.remove(ctx, draftId);
  });
}

/**
 * A spoken letter kept without words (TDD 03 FM-9, TDD 01 3.6): the
 * recording is the true original; words are set once later. The local
 * calendar day is passed in (`occurredOn`) so this stays pure.
 */
export function voiceOnlyEntry(
  draft: Draft,
  opts: { childId: string; authorSignsAs: string; inBook: boolean; engineVersion: number; occurredOn: string },
): Entry {
  if (!draft.audioUri) throw new AudioMissingError();
  return {
    id: draft.id,
    kind: 'letter',
    occurredOn: opts.occurredOn,
    capturedAt: draft.createdAt,
    captureMode: 'spoken',
    editLevel: 'verbatim',
    promptKey: draft.promptKey,
    engineVersion: opts.engineVersion,
    rawTranscript: '',
    machineEdits: [],
    finalText: '',
    inBook: opts.inBook,
    soundsLikeMe: null,
    childId: opts.childId,
    authorSignsAs: opts.authorSignsAs,
    audioUri: draft.audioUri,
    audioDurationMs: draft.audioDurationMs,
    audioSha256: draft.audioSha256,
    audioBytes: draft.audioBytes,
    transcriptStatus: 'waiting',
  };
}
