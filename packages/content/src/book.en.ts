// Book copy for the PDF in every export (brand.printTitle: Year One, Year Two, etc.).
// The brand name comes from packages/brand, never typed here (CLAUDE.md).
// v1 is digital only; the same copy will serve printed books when they launch (PRD.md K-32).
// {child} and {n} are placeholders.

import { brand } from '@scribe/brand';

export const book = {
  coverTitle: brand.name,
  coverSubtitle: "Letters to {child}, Year {n}",
  productName: `${brand.name}: Year {n}`,
  spine: `${brand.name}  |  {child}  |  Year {n}`,
  backCover:
    "This book was spoken before it was written. Every letter inside comes from someone who loves {child}, said out loud on an ordinary day and kept exactly as they said it. Some are long. Some are a single line. Read them slowly, read them together, and come back to them whenever you like.",
  dedication: "For {child}, from everyone who talked to you this year.",
  aboutThisBook: {
    title: "About this book",
    body: "Every word in this book was spoken or typed by {child}'s family. Nothing was reworded afterwards. The only changes were small fixes, like a misheard word or a stray \"um\", and each one could be undone. Each letter is signed by the person who wrote it, and the voices are kept too, so these pages can be heard as well as read. Letters appear in the language they were said, just as your family speaks.",
  },
  colophon: `Made with ${brand.name}. Every word kept as it was said.`,
} as const;
