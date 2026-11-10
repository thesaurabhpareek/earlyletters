// web: same | android: same
/**
 * The end of the book (book-page.md 2 "End of book"): after the oldest chapter, the quotation-pair mark, so the list
 * ends like a book instead of just stopping under the last card. No count and no empty months. Decorative (the
 * QuotePair is hidden from VoiceOver), so the last thing VoiceOver reads is still the oldest letter.
 *
 * F09's text button "Add a letter about an earlier month" (book.earlierMonth.cta, pending Study 1) is not here yet:
 * it opens capture with the month preset (F09 6.2 step 4), and that path does not exist. Drafts store a month's date
 * as the first of the calendar month (lib/db/repos/drafts.ts setOccurred), which is not where a month of age starts,
 * so a preset would file the letter a month early for most birthdays. The button joins this block, under the mark,
 * with that path (book-page.md 4 step 7, second half).
 */
import { View } from 'react-native';
import { QuotePair } from '@/components/ui/quote-pair';

export function EndOfBook() {
  return (
    <View className="items-center px-5 pb-10 pt-8" testID="book.end">
      <QuotePair height={40} aligned={false} />
    </View>
  );
}
