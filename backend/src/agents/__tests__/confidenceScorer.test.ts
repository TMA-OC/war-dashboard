import { describe, it, expect } from 'vitest'
import { scoreConfidence } from '../confidenceScorer'

describe('scoreConfidence', () => {
  it('returns RUMOR with no sources', () => {
    const result = scoreConfidence({ sources: [], ageMinutes: 60 })
    expect(result.label).toBe('RUMOR')
    expect(result.score).toBeLessThan(0.5)
  })

  it('returns VERIFIED for Reuters + AP + BBC corroboration', () => {
    const result = scoreConfidence({
      sources: ['Reuters', 'AP', 'BBC'],
      ageMinutes: 120,
    })
    expect(result.label).toBe('VERIFIED')
    expect(result.score).toBeGreaterThanOrEqual(0.9)
  })

  it('applies freshness penalty for breaking news < 15min old', () => {
    const fresh = scoreConfidence({
      sources: ['Reuters', 'AP'],
      ageMinutes: 5,
    })
    const aged = scoreConfidence({
      sources: ['Reuters', 'AP'],
      ageMinutes: 60,
    })
    // Fresh breaking news should score lower due to freshness penalty
    expect(fresh.score).toBeLessThan(aged.score)
  })

  it('caps score at 0.98', () => {
    const result = scoreConfidence({
      sources: ['Reuters', 'AP', 'BBC', 'NYT', 'Guardian', 'Al Jazeera'],
      ageMinutes: 240,
    })
    expect(result.score).toBeLessThanOrEqual(0.98)
  })

  it('returns LIKELY for single BBC source', () => {
    const result = scoreConfidence({
      sources: ['BBC'],
      ageMinutes: 60,
    })
    expect(result.label).toBe('LIKELY')
    expect(result.score).toBeGreaterThanOrEqual(0.7)
    expect(result.score).toBeLessThan(0.9)
  })
})
