/** Dev lab (owner: AT): every atmosphere layer on night, paper and dusk. Not linked anywhere. ?plate=<id> shows one plate. */
import { Gallery, PLATES, type PlateId } from './Gallery';

export const metadata = { robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = (await searchParams).plate;
  const plate = typeof q === 'string' && (PLATES as readonly string[]).includes(q) ? (q as PlateId) : undefined;
  return <Gallery plate={plate} />;
}
