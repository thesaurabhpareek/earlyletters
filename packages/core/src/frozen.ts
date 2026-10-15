/**
 * A set that cannot change after it is built (CORE-10). Import-free leaf, so
 * the English tables can use it without a cycle.
 *
 * `add`, `delete` and `clear` throw, and the object is frozen, so a caller
 * cannot widen an allowlist the verifier depends on.
 */
const SEALED = new WeakSet<object>();
class FrozenSet<T> extends Set<T> {
  constructor(items: Iterable<T>) {
    super(items);
    SEALED.add(this);
    Object.freeze(this);
  }
  override add(value: T): this {
    if (SEALED.has(this)) throw new TypeError('This set is read-only.');
    return super.add(value);
  }
  override delete(): boolean {
    throw new TypeError('This set is read-only.');
  }
  override clear(): void {
    throw new TypeError('This set is read-only.');
  }
}

export function frozenSet<T>(items: Iterable<T>): ReadonlySet<T> {
  return new FrozenSet(items);
}
