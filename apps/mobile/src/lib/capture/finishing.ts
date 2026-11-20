/**
 * Which takes are being saved right now (BL-563). The recorder keeps every take's save promise for good, so a second
 * caller of finalizeTake joins it instead of saving twice; that map is never cleared. "Is a save still running?" is a
 * different question, answered here: true only from the moment a save starts until its promise settles, whether it
 * succeeded or threw. A take that was let go (abandoned) is never pending. Pure: no React Native, no store.
 */
export type Finishing<T> = {
  /** The promise to join, settled or not (finalizeTake's idempotence), or null when none was ever started. */
  get: (id: string) => Promise<T> | null;
  /** Remember a save and mark it pending until it settles. Returns the same promise. */
  track: (id: string, job: Promise<T>) => Promise<T>;
  /** Remember a promise that is not a save in progress (a take let go): joinable, never pending. */
  settled: (id: string, job: Promise<T>) => void;
  /** True only while a tracked save has not settled. */
  isPending: (id: string) => boolean;
};

export function createFinishing<T>(): Finishing<T> {
  const jobs = new Map<string, Promise<T>>();
  const pending = new Set<string>();
  return {
    get: (id) => jobs.get(id) ?? null,
    track: (id, job) => {
      jobs.set(id, job);
      pending.add(id);
      const end = () => {
        // Only the save that is still current ends the pending state.
        if (jobs.get(id) === job) pending.delete(id);
      };
      job.then(end, end);
      return job;
    },
    settled: (id, job) => {
      jobs.set(id, job);
      pending.delete(id);
    },
    isPending: (id) => pending.has(id),
  };
}
