/** Dev lab: renders scene 07 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S07Years } from '@/scenes/S07Years';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S07Years />
    </Lab>
  );
}
