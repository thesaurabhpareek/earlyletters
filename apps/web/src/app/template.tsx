/** Re-mounts on every navigation, which is what lets PageTransition play between pages. */
import { PageTransition } from '@/components/site/PageTransition';

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
