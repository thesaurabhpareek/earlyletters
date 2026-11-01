// Book copy for the PDF in every export (Early Letters: Year One, Year Two, etc.).
// v1 is digital only; the same copy will serve printed books when they launch (PRD.md K-32).
// {child} and {n} are placeholders.

export const book = {
  coverTitle: "Early Letters",
  coverSubtitle: "Letters to {child}, Year {n}",
  productName: "Early Letters: Year {n}",
  spine: "Early Letters  |  {child}  |  Year {n}",
  backCover:
    "This book was spoken before it was written. Every letter inside comes from someone who loves {child}, said out loud on an ordinary day and kept in their own words. Some run for pages and some are a single line. Read them slowly, or aloud together, and come back whenever you like.",
  dedication: "For {child}, from everyone who talked to you this year.",
  aboutThisBook: {
    title: "About this book",
    body: "Every word in this book was spoken or typed by {child}'s family, and no word was added. Typed letters are exactly as they were typed. A spoken letter may carry small fixes: a stray \"um\" or an accidental repeat taken out, a name set to the spelling you gave the app, and capital letters and full stops put in. The app showed each fix when the letter was kept, and every original recording is kept unchanged. Each letter is signed by the person who wrote it, and the voices are kept too, so these pages can be heard as well as read. Letters appear in the language they were said, just as your family speaks.",
  },
  colophon: "Made with Early Letters, from words the family said and typed.",
} as const;
