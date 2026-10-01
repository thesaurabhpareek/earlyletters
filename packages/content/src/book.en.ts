// Printed and PDF book copy for Early Letters: Year One, Year Two, etc.
// {child} and {n} are placeholders.

export const book = {
  coverTitle: "Early Letters",
  coverSubtitle: "Letters to {child}, Year {n}",
  productName: "Early Letters: Year {n}",
  spine: "Early Letters  |  {child}  |  Year {n}",
  backCover:
    "This book was spoken before it was written. Every letter inside comes from someone who loves {child}, said out loud on an ordinary day and kept exactly as they said it. Some are long. Some are a single line. Read them slowly, read them together, and come back to them whenever you like.",
  dedication: "For {child}, from everyone who talked to you this year.",
  aboutThisBook: {
    title: "About this book",
    body: "Every word in this book was spoken or typed by {child}'s family. Nobody tidied it up afterwards. The only changes were small fixes where a microphone misheard a word. Each letter is signed by the person who wrote it, and the voices are kept too, so these pages can be heard as well as read. Letters appear in the language they were said, just as your family speaks.",
  },
  colophon: "Made with Early Letters. Every word kept as it was said.",
} as const;
