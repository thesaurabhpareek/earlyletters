/**
 * The notification category every reminder carries (BL-966c; NS-32-R10, R13, NS-13-R20, R33). Split out of
 * scheduler.ts so a test can call it without the native modules.
 *
 * - `previewPlaceholder` is the one line iOS shows when the person hides previews: neutral, from content, never a
 *   name or a word of a letter.
 * - No `showTitle` or `showSubtitle`: a hidden preview shows no title at all (AB-11, hiddenPreviewsShowTitle stays off).
 * - Level is `active` (no special entitlement, so Focus and Scheduled Summary apply).
 * The `plan` category is payments' and is not registered here.
 */
import { en } from '@scribe/content';

export const REMINDER_CATEGORY = 'reminder';
export const REMINDER_INTERRUPTION_LEVEL = 'active';

export const reminderCategoryOptions = (): { previewPlaceholder: string; allowInCarPlay: false } => ({
  previewPlaceholder: en.notifications.previewPlaceholder,
  allowInCarPlay: false,
});

/** Registers the category. Never throws (web preview, no module): a missing category only shows the normal preview. */
export async function registerReminderCategory(
  set: (id: string, actions: never[], options: ReturnType<typeof reminderCategoryOptions>) => Promise<unknown>,
): Promise<void> {
  try {
    await set(REMINDER_CATEGORY, [], reminderCategoryOptions());
  } catch {
    // Nothing to log: no content here, and nothing the person can act on.
  }
}
