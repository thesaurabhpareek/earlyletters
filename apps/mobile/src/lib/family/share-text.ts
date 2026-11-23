import { fill } from '../copy';
import { familyCopy } from './copy';

/** The words that leave the phone. A book with no name (NX-31-R3) gets its own wording; "your child" would be said to the co-parent. */
export function inviteShareText(child: string, signsAs: string | null): { message: string; title: string } {
  const c = familyCopy.create;
  if (!child.trim()) return { message: signsAs ? fill(c.shareMessageNamedNoName, { signsAs }) : c.shareMessageNoName, title: c.shareTitleNoName };
  return { message: signsAs ? fill(c.shareMessageNamed, { child, signsAs }) : fill(c.shareMessage, { child }), title: fill(c.shareTitle, { child }) };
}
