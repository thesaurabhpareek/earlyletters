/** Dev lab: renders scene 03 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S03Talk } from '@/scenes/S03Talk';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S03Talk />
    </Lab>
  );
}
