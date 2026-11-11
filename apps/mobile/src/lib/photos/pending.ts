/**
 * The picture chosen before a letter exists, held in memory until Keep (NS-01-R3 to R5, R7). Nothing about it is
 * written to the database or to Documents. The only file is the picker's temporary original in Caches/ImagePicker,
 * which is removed as soon as the picture is no longer wanted: replaced (after the Undo window), taken off, let go, or
 * kept (review C7, NX-39-R53). A kill leaves it for the launch sweep.
 *
 * Words about the picture and its typed place live here too, until Keep.
 */
import { commitPhoto, PhotoSession, type CommitResult } from './session';
import { UNDO_WINDOW_MS, type PhotoDeps, type PickedAsset, type PickedFiles } from './types';

type Listener = () => void;

export class PendingPhoto {
  private session = new PhotoSession();
  /** The picture a replace or a take-off set aside; its file waits for the Undo window. */
  private previous: { asset: PickedAsset; text: string; place: string; until: number } | null = null;
  private listeners = new Set<Listener>();
  private version = 0;

  constructor(
    private files: PickedFiles,
    private now: () => number = Date.now,
  ) {}

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  };
  getVersion = (): number => this.version;
  private emit(): void {
    this.version++;
    for (const l of [...this.listeners]) l();
  }

  get source(): PickedAsset | null {
    return this.session.source;
  }
  get text(): string | null {
    return this.session.text;
  }
  get place(): string | null {
    return this.session.place;
  }
  /** As typed, for the fields. */
  get typedText(): string {
    return this.session.typedText;
  }
  get typedPlace(): string {
    return this.session.typedPlace;
  }
  get canUndo(): boolean {
    return this.previous !== null && this.now() <= this.previous.until;
  }

  /** A new pick: on Home it starts the pending picture; on Ready or Review it replaces it (Undo for 10 seconds). */
  async set(asset: PickedAsset): Promise<void> {
    await this.settle();
    const cur = this.session.source;
    if (cur) this.previous = { asset: cur, text: this.session.typedText, place: this.session.typedPlace, until: this.now() + UNDO_WINDOW_MS };
    this.session.change(asset);
    this.emit();
  }
  setText(typed: string): void {
    this.session.setText(typed);
    this.emit();
  }
  setPlace(typed: string): void {
    this.session.setPlace(typed);
    this.emit();
  }
  /** "Take the photo off": set aside for the Undo window. */
  remove(): void {
    const cur = this.session.source;
    if (!cur) return;
    this.previous = { asset: cur, text: this.session.typedText, place: this.session.typedPlace, until: this.now() + UNDO_WINDOW_MS };
    this.session.discard();
    this.emit();
  }
  /** Undo inside the window. A replacement's own file goes. */
  async undo(): Promise<boolean> {
    const prev = this.previous;
    if (!prev || this.now() > prev.until) return false;
    const cur = this.session.source;
    this.previous = null;
    this.session.change(prev.asset);
    this.session.setText(prev.text);
    this.session.setPlace(prev.place);
    if (cur) await this.files.remove(cur.uri);
    this.emit();
    return true;
  }
  /** The window has passed or the parent moved on: the set-aside original is removed. */
  async settle(): Promise<void> {
    const prev = this.previous;
    this.previous = null;
    if (prev) await this.files.remove(prev.asset.uri);
  }
  /** Back out, Let it go, or a kept letter: nothing stays, originals included. */
  async discard(): Promise<void> {
    const cur = this.session.source;
    this.session.discard();
    await this.settle();
    if (cur) await this.files.remove(cur.uri);
    this.emit();
  }
  /**
   * At Keep, for a letter that now exists. Reads the picked original once, strips it, stores the copy, then removes the
   * original whatever happened (a successful strip, a failed one). The letter is already kept and stays kept.
   */
  async commit(deps: PhotoDeps, input: { entryId: string; finalText: string }): Promise<CommitResult | null> {
    const cur = this.session.source;
    if (!cur) return null;
    let result: CommitResult;
    try {
      const bytes = await this.files.read(cur.uri);
      result = await commitPhoto(deps, { entryId: input.entryId, finalText: input.finalText, bytes, text: this.session.text, place: this.session.place });
    } catch {
      result = { status: 'failed' };
    }
    if (result.status === 'needs_words') return result; // nothing was read into a copy; the picture stays pending
    await this.discard();
    return result;
  }
}
