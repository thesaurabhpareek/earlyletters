/** Dev lab: renders scene 11 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S11Start } from '@/scenes/S11Start';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S11Start />
    </Lab>
  );
}
