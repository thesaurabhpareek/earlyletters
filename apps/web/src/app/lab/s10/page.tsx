/** Dev lab: renders scene 10 alone so its owner can build and shoot it in isolation. Not linked anywhere. */
import { Lab } from '@/film/Lab';
import { S10Pricing } from '@/scenes/S10Pricing';

export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Lab>
      <S10Pricing />
    </Lab>
  );
}
