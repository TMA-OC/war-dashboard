import { describe, it, expect } from 'vitest'
import { haversineKm } from '../alertMatcher'

describe('haversineKm', () => {
  it('London to Paris is ~340km', () => {
    expect(haversineKm(51.5, -0.12, 48.85, 2.35)).toBeCloseTo(340, -1)
  })

  it('same point is 0km', () => {
    expect(haversineKm(32.08, 34.78, 32.08, 34.78)).toBe(0)
  })

  it('Tel Aviv to Beirut is ~230km', () => {
    expect(haversineKm(32.08, 34.78, 33.89, 35.5)).toBeCloseTo(230, -1)
  })

  it('alert within radius is matched', () => {
    // Pin at Tel Aviv (32.08, 34.78), radius 100km
    // Alert at Jerusalem (31.77, 35.21) — ~62km away
    const dist = haversineKm(32.08, 34.78, 31.77, 35.21)
    expect(dist).toBeLessThan(100)
  })

  it('alert outside radius is not matched', () => {
    // Pin at Tel Aviv (32.08, 34.78), radius 100km
    // Alert at Beirut (33.89, 35.50) — ~230km away
    const dist = haversineKm(32.08, 34.78, 33.89, 35.5)
    expect(dist).toBeGreaterThan(100)
  })

  it('New York to Los Angeles is ~3940km', () => {
    expect(haversineKm(40.71, -74.01, 34.05, -118.24)).toBeCloseTo(3940, -2)
  })
})
