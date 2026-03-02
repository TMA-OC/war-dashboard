import { describe, it, expect } from "vitest";
import { scoreConfidence, getConfidenceLabel } from "../confidenceScorer";

describe("scoreConfidence", () => {
  it("returns 0 / RUMOR with empty sources", () => {
    const result = scoreConfidence({
      sourceIds: [],
      sourceTrustRanks: [],
      publishedAt: new Date(),
      isBreaking: false,
    });
    expect(result.score).toBe(0);
    expect(result.label).toBe("RUMOR");
  });

  it("calculates base score from highest trust rank", () => {
    const result = scoreConfidence({
      sourceIds: ["s1"],
      sourceTrustRanks: [80],
      publishedAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
      isBreaking: false,
    });
    expect(result.score).toBeCloseTo(0.8, 2);
    expect(result.breakdown.baseScore).toBe(0.8);
  });

  it("adds corroboration bonus for 2 unique sources", () => {
    const result = scoreConfidence({
      sourceIds: ["s1", "s2"],
      sourceTrustRanks: [80, 70],
      publishedAt: new Date(Date.now() - 60 * 60 * 1000),
      isBreaking: false,
    });
    expect(result.breakdown.corroborationBonus).toBe(0.08);
    expect(result.score).toBeCloseTo(0.88, 2);
  });

  it("adds corroboration bonus for 3 unique sources", () => {
    const result = scoreConfidence({
      sourceIds: ["s1", "s2", "s3"],
      sourceTrustRanks: [80, 70, 75],
      publishedAt: new Date(Date.now() - 60 * 60 * 1000),
      isBreaking: false,
    });
    expect(result.breakdown.corroborationBonus).toBe(0.12);
  });

  it("adds corroboration bonus for 4+ unique sources", () => {
    const result = scoreConfidence({
      sourceIds: ["s1", "s2", "s3", "s4"],
      sourceTrustRanks: [80, 70, 75, 65],
      publishedAt: new Date(Date.now() - 60 * 60 * 1000),
      isBreaking: false,
    });
    expect(result.breakdown.corroborationBonus).toBe(0.15);
  });

  it("does NOT count duplicate source IDs for corroboration", () => {
    const result = scoreConfidence({
      sourceIds: ["s1", "s1", "s1"],
      sourceTrustRanks: [80, 80, 80],
      publishedAt: new Date(Date.now() - 60 * 60 * 1000),
      isBreaking: false,
    });
    expect(result.breakdown.corroborationBonus).toBe(0);
  });

  it("applies freshness penalty when isBreaking AND < 15 min old", () => {
    const result = scoreConfidence({
      sourceIds: ["s1"],
      sourceTrustRanks: [80],
      publishedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      isBreaking: true,
    });
    expect(result.breakdown.freshnessPenaltyApplied).toBe(true);
    expect(result.score).toBeCloseTo(0.8 * 0.85, 3);
  });

  it("does NOT apply freshness penalty when NOT breaking", () => {
    const result = scoreConfidence({
      sourceIds: ["s1"],
      sourceTrustRanks: [80],
      publishedAt: new Date(Date.now() - 5 * 60 * 1000),
      isBreaking: false,
    });
    expect(result.breakdown.freshnessPenaltyApplied).toBe(false);
  });

  it("does NOT apply freshness penalty when > 15 min old", () => {
    const result = scoreConfidence({
      sourceIds: ["s1"],
      sourceTrustRanks: [80],
      publishedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago
      isBreaking: true,
    });
    expect(result.breakdown.freshnessPenaltyApplied).toBe(false);
  });

  it("caps score at 0.98", () => {
    const result = scoreConfidence({
      sourceIds: ["s1", "s2", "s3", "s4"],
      sourceTrustRanks: [100, 95, 90, 88],
      publishedAt: new Date(Date.now() - 60 * 60 * 1000),
      isBreaking: false,
    });
    expect(result.score).toBeLessThanOrEqual(0.98);
  });
});

describe("getConfidenceLabel", () => {
  it("returns VERIFIED for score >= 0.9", () => {
    expect(getConfidenceLabel(0.9)).toBe("VERIFIED");
    expect(getConfidenceLabel(0.98)).toBe("VERIFIED");
  });

  it("returns LIKELY for score >= 0.7 and < 0.9", () => {
    expect(getConfidenceLabel(0.7)).toBe("LIKELY");
    expect(getConfidenceLabel(0.85)).toBe("LIKELY");
  });

  it("returns UNVERIFIED for score >= 0.5 and < 0.7", () => {
    expect(getConfidenceLabel(0.5)).toBe("UNVERIFIED");
    expect(getConfidenceLabel(0.65)).toBe("UNVERIFIED");
  });

  it("returns RUMOR for score < 0.5", () => {
    expect(getConfidenceLabel(0)).toBe("RUMOR");
    expect(getConfidenceLabel(0.49)).toBe("RUMOR");
  });
});
