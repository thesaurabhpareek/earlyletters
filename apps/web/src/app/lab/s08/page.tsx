/** Dev lab: renders scene 08 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S08Languages } from '@/scenes/S08Languages';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S08Languages />
    </Lab>
  );
}
