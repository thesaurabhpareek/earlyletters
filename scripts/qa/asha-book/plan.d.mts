export interface AshaItem {
  index: number;
  date: string;
  kind: 'spoken' | 'typed';
  language: 'en' | 'hi' | 'ar' | 'zh';
  words: number;
  text: string;
  audio: { sha256: string; bytes: number; ms: number } | null;
  picture: { file: string; aspect: string; format: 'jpeg' | 'png'; orientation: number; bytes: number } | null;
  deleted: boolean;
}
export interface AshaPlan { seed: number; items: AshaItem[] }
export const DEFAULT_SEED: number;
export const RANGE: { from: string; to: string };
export const SIZES: { small: { letters: number; pictures: number }; book: { letters: number; pictures: number } };
export const VOCAB: Record<'en' | 'hi' | 'ar' | 'zh', string[]>;
export const RTL: Set<string>;
export function planBook(o?: { seed?: number; letters?: number; pictures?: number }): AshaPlan;
export function planSha256(plan: AshaPlan): string;
