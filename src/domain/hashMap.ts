/**
 * HashMap — the data structure assigned to the CGCI Student Login project.
 * ---------------------------------------------------------------------------
 * The Discrete Structures 1 presentation specifies, for this system:
 *
 *   "CS Data Structure: Hash Map / Dictionary holding key-value pairs
 *    (Username -> Password Hash)."
 *   "Hash maps resolve the binary relation membership check (u, p) ∈ R
 *    in O(1) average time."
 *
 * This is a genuine implementation rather than a wrapper around the native
 * `Map`, so the complexity claim is demonstrable rather than asserted:
 *
 *   Hashing      FNV-1a, O(|key|) — constant for fixed-length identifiers.
 *   Placement    Open addressing with linear probing, so every operation is
 *                a bounded scan over an array rather than a linked list.
 *   Lookup       O(1) *average*. The probe sequence is short because the
 *                table is kept under a maximum load factor; the only way to
 *                make it degrade is to force many keys into one bucket.
 *
 * Keys are strings because the key space of this system is the set of
 * usernames `U`, all of which are student IDs of the form `NNNN-NNNN`.
 */

const TOMBSTONE = Symbol('cgci.hashmap.tombstone')

interface Slot<V> {
  readonly key: string
  readonly value: V
}

type Cell<V> = Slot<V> | typeof TOMBSTONE

/** FNV-1a, 32-bit. Cheap, well-distributed for short identifier strings. */
function hashKey(key: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function nextPowerOfTwo(value: number): number {
  let result = 1
  while (result < value) result *= 2
  return result
}

function isSlot<V>(cell: Cell<V> | undefined): cell is Slot<V> {
  return cell !== undefined && cell !== TOMBSTONE
}

export interface HashMapMetrics {
  /** Number of slots currently allocated. Always a power of two. */
  readonly capacity: number
  /** Number of live key-value pairs. */
  readonly size: number
  /** size / capacity. The table is compacted before this exceeds 0.75. */
  readonly loadFactor: number
  /** Slots vacated by `delete`; reuse candidates for later insertions. */
  readonly tombstones: number
  /** Total slot inspections performed, i.e. the real probe cost. */
  readonly probes: number
  /** Insertions that landed on an occupied slot. */
  readonly collisions: number
  /** `get`/`has` calls issued. */
  readonly lookups: number
  /** Of those, how many resolved to a live entry. */
  readonly hits: number
  /** Average slots inspected per lookup — the empirical constant. */
  readonly averageProbeLength: number
}

export class HashMap<V> {
  /** Populated with `undefined` for free slots and `TOMBSTONE` for vacated ones. */
  #cells: Array<Cell<V> | undefined> = []
  #capacity = 0
  #size = 0
  #tombstones = 0

  readonly #maxLoadFactor = 0.75

  #probes = 0
  #collisions = 0
  #lookups = 0
  #hits = 0

  constructor(initialCapacity = 8) {
    this.#allocate(nextPowerOfTwo(Math.max(4, initialCapacity)))
  }

  get size(): number {
    return this.#size
  }

  has(key: string): boolean {
    this.#lookups += 1
    if (this.#findIndex(key, true) >= 0) {
      this.#hits += 1
      return true
    }
    return false
  }

  get(key: string): V | undefined {
    this.#lookups += 1
    const index = this.#findIndex(key, true)
    if (index < 0) return undefined

    this.#hits += 1
    const cell = this.#cells[index]
    return isSlot(cell) ? cell.value : undefined
  }

  set(key: string, value: V): this {
    this.#ensureCapacityFor(1)

    const { index, found } = this.#locate(key)
    const existing = this.#cells[index]
    this.#cells[index] = { key, value }

    if (isSlot(existing)) {
      // Overwriting a live key: the table already accounts for this entry.
      return this
    }

    if (existing === TOMBSTONE) this.#tombstones -= 1
    this.#size += 1
    if (!found) this.#collisions += 1
    return this
  }

  delete(key: string): boolean {
    const index = this.#findIndex(key, false)
    if (!isSlot(this.#cells[index])) return false

    // Tombstone rather than shifting: cluster integrity is preserved, so
    // existing probe sequences stay valid.
    this.#cells[index] = TOMBSTONE
    this.#size -= 1
    this.#tombstones += 1

    if (this.#size === 0) {
      this.#allocate(nextPowerOfTwo(Math.max(4, this.#capacity >> 1)))
    } else if (this.#tombstones > this.#capacity >> 1) {
      this.#rehash(this.#capacity)
    }
    return true
  }

  clear(): void {
    this.#allocate(nextPowerOfTwo(Math.max(4, this.#capacity >> 1)))
  }

  keys(): string[] {
    const result: string[] = []
    for (const cell of this.#cells) {
      if (isSlot(cell)) result.push(cell.key)
    }
    return result
  }

  values(): V[] {
    const result: V[] = []
    for (const cell of this.#cells) {
      if (isSlot(cell)) result.push(cell.value)
    }
    return result
  }

  entries(): Array<[string, V]> {
    const result: Array<[string, V]> = []
    for (const cell of this.#cells) {
      if (isSlot(cell)) result.push([cell.key, cell.value])
    }
    return result
  }

  forEach(callback: (value: V, key: string) => void): void {
    for (const [key, value] of this.entries()) callback(value, key)
  }

  metrics(): HashMapMetrics {
    return {
      capacity: this.#capacity,
      size: this.#size,
      loadFactor: this.#size / this.#capacity,
      tombstones: this.#tombstones,
      probes: this.#probes,
      collisions: this.#collisions,
      lookups: this.#lookups,
      hits: this.#hits,
      averageProbeLength: this.#lookups === 0 ? 0 : this.#probes / this.#lookups,
    }
  }

  resetMetrics(): void {
    this.#probes = 0
    this.#collisions = 0
    this.#lookups = 0
    this.#hits = 0
  }

  // ── internals ──────────────────────────────────────────────────────────

  #allocate(capacity: number): void {
    this.#cells = new Array<Cell<V> | undefined>(capacity)
    this.#capacity = capacity
    this.#size = 0
    this.#tombstones = 0
  }

  #rehash(capacity: number): void {
    const previous = this.#cells
    this.#allocate(capacity)
    for (const cell of previous) {
      if (isSlot(cell)) this.set(cell.key, cell.value)
    }
    // Re-inserting is not part of the caller's measured work.
    this.#collisions = 0
  }

  #ensureCapacityFor(additionalEntries: number): void {
    const occupied = this.#size + this.#tombstones + additionalEntries
    if (occupied / this.#capacity <= this.#maxLoadFactor) return

    // Grow when genuinely crowded; otherwise just compact away tombstones.
    const halfCapacity = this.#capacity >> 1
    if (this.#size / this.#capacity > 0.5) this.#rehash(this.#capacity * 2)
    else if (this.#tombstones > 0) this.#rehash(this.#capacity)
    else if (this.#capacity < halfCapacity) this.#rehash(Math.max(4, halfCapacity))
  }

  /** Index of `key` if it is present, otherwise -1. */
  #findIndex(key: string, recordProbes: boolean): number {
    const mask = this.#capacity - 1
    let index = hashKey(key) & mask

    for (let step = 0; step < this.#capacity; step += 1) {
      // Probe accounting deliberately covers read paths only. Insertions and
      // rehashing are construction work; including them would make the reported
      // lookup cost meaningless as the table is filled.
      if (recordProbes) this.#probes += 1
      const cell = this.#cells[index]

      // An empty slot proves the key is absent: linear probing guarantees
      // that insertion would have stopped at the first empty slot.
      if (cell === undefined) return -1
      if (isSlot(cell) && cell.key === key) return index

      index = (index + 1) & mask
    }
    return -1
  }

  /** Position for writing: the existing slot for `key` when present,
   * otherwise the first tombstone, otherwise the first free slot. */
  #locate(key: string): { index: number; found: boolean } {
    const mask = this.#capacity - 1
    let index = hashKey(key) & mask
    let firstTombstone = -1

    for (let step = 0; step < this.#capacity; step += 1) {
      const cell = this.#cells[index]

      if (cell === undefined) {
        return { index: firstTombstone >= 0 ? firstTombstone : index, found: false }
      }
      if (cell === TOMBSTONE) {
        if (firstTombstone < 0) firstTombstone = index
      } else if (cell.key === key) {
        return { index, found: true }
      }

      index = (index + 1) & mask
    }
    return { index: firstTombstone >= 0 ? firstTombstone : 0, found: false }
  }
}