import { describe, expect, it } from 'vitest'

import { HashMap } from '../hashMap'

/** Builds student IDs of the form the portal actually uses. */
function studentIds(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `2026-${String(index + 1).padStart(4, '0')}`)
}

describe('HashMap', () => {
  it('stores and retrieves values by key', () => {
    const map = new HashMap<string>(8)
    map.set('2026-0001', 'Juan Dela Cruz')
    map.set('2026-0002', 'Maria Santos')

    expect(map.get('2026-0001')).toBe('Juan Dela Cruz')
    expect(map.get('2026-0002')).toBe('Maria Santos')
    expect(map.size).toBe(2)
  })

  it('returns undefined for a key that was never inserted', () => {
    const map = new HashMap<string>()
    expect(map.get('2026-9999')).toBeUndefined()
    expect(map.has('2026-9999')).toBe(false)
  })

  it('overwrites an existing key without growing the table', () => {
    const map = new HashMap<number>()
    map.set('a', 1)
    map.set('a', 2)

    expect(map.get('a')).toBe(2)
    expect(map.size).toBe(1)
  })

  it('reports has() for present keys only', () => {
    const map = new HashMap<boolean>()
    map.set('present', true)

    expect(map.has('present')).toBe(true)
    expect(map.has('absent')).toBe(false)
  })

  it('deletes a key and keeps the rest of the table intact', () => {
    const map = new HashMap<string>()
    for (const id of studentIds(50)) map.set(id, id)

    expect(map.delete('2026-0025')).toBe(true)
    expect(map.delete('2026-0025')).toBe(false)

    expect(map.size).toBe(49)
    expect(map.get('2026-0025')).toBeUndefined()

    // Tombstones must not break probe chains for their neighbours.
    for (const id of studentIds(50).filter((id) => id !== '2026-0025')) {
      expect(map.get(id)).toBe(id)
    }
  })

  it('reuses tombstone slots instead of degrading capacity', () => {
    const map = new HashMap<number>(8)
    for (let i = 0; i < 8; i += 1) map.set(`k${i}`, i)

    for (let i = 0; i < 6; i += 1) map.delete(`k${i}`)

    for (let i = 0; i < 8; i += 1) map.set(`k${i}`, i * 10)

    expect(map.size).toBe(8)
    expect(map.get('k0')).toBe(0)
    expect(map.get('k7')).toBe(70)
    expect(map.metrics().loadFactor).toBeLessThanOrEqual(0.75)
  })

  it('enumerates keys, values and entries consistently', () => {
    const map = new HashMap<string>()
    map.set('2026-0003', 'Angelo Reyes')
    map.set('2026-0001', 'Juan Dela Cruz')

    expect(map.keys().sort()).toEqual(['2026-0001', '2026-0003'])
    expect(map.values().sort()).toEqual(['Angelo Reyes', 'Juan Dela Cruz'])
    expect(map.entries()).toHaveLength(2)
  })

  it('clears all entries', () => {
    const map = new HashMap<string>()
    for (const id of studentIds(20)) map.set(id, id)

    map.clear()

    expect(map.size).toBe(0)
    expect(map.keys()).toEqual([])
  })

  it('grows and holds every key across a resize', () => {
    const ids = studentIds(2000)
    const map = new HashMap<string>(4)

    for (const id of ids) map.set(id, id.toUpperCase())

    expect(map.size).toBe(ids.length)
    for (const id of ids) expect(map.get(id)).toBe(id.toUpperCase())
  })

  /**
   * The complexity claim in the presentation is that credential lookup is
   * O(1) on average. This is the empirical check: growing the table by three
   * orders of magnitude must not grow the average probe length.
   */
  it('keeps the average probe length bounded as the table grows', () => {
    const measure = (count: number): number => {
      const map = new HashMap<string>(8)
      const ids = studentIds(count)
      for (const id of ids) map.set(id, id)
      map.resetMetrics()

      // Probe each key twice so every result lands on a populated slot.
      for (let pass = 0; pass < 2; pass += 1) {
        for (const id of ids) map.get(id)
      }
      return map.metrics().averageProbeLength
    }

    const small = measure(50)
    const large = measure(5000)

    expect(large).toBeLessThan(3)
    expect(large).toBeLessThan(small * 3)
  })

  it('keeps the load factor under the resize threshold', () => {
    const map = new HashMap<string>()
    for (const id of studentIds(500)) map.set(id, id)

    expect(map.metrics().loadFactor).toBeLessThanOrEqual(0.75)
  })
})
