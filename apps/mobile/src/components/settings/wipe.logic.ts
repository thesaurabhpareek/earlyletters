/**
 * Rules for the Delete this book and Erase everything screens (BL-387; F17 6.2 D, 6.2 F). Pure, no React Native.
 */

/** The typed confirm: the word, any case, spaces around it ignored (the same rule as account deletion). */
export function typedWordMatches(typed: string, word: string): boolean {
  return typed.trim().toLowerCase() === word.toLowerCase();
}
