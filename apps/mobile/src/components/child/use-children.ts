import { useEffect, useState } from 'react';
import { getActiveChild, listChildren, setActiveChildId, subscribe, type Child } from '@/lib/store';

/** Children plus the active one; re-reads on any store change. */
export function useChildren() {
  const read = () => ({ children: listChildren(), active: getActiveChild() });
  const [state, setState] = useState<{ children: Child[]; active: Child | null }>(read);
  useEffect(() => subscribe(() => setState(read())), []);
  return { ...state, select: (id: string) => setActiveChildId(id) };
}
