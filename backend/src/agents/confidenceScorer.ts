// Confidence scoring algorithm for alerts

export type ConfidenceLabel = "VERIFIED" | "LIKELY" | "UNVERIFIED" | "RUMOR";

export interface CorroborationInput {
  sourceIds: string[];
  sourceTrustRanks: number[]; // trust_rank values 0-100
  publishedAt: Date;
  isBreaking: boolean;
}

export interface ConfidenceResult {
  score: number;       // 0.0 – 0.98
  label: ConfidenceLabel;
  breakdown: {
    baseScore: number;
    corroborationBonus: number;
    freshnessPenaltyApplied: boolean;
  };
}

export function scoreConfidence(input: CorroborationInput): ConfidenceResult {
  const { sourceIds, sourceTrustRanks, publishedAt, isBreaking } = input;

  if (sourceTrustRanks.length === 0) {
    return {
      score: 0,
      label: "RUMOR",
      breakdown: { baseScore: 0, corroborationBonus: 0, freshnessPenaltyApplied: false },
    };
  }

  // Base score = highest trust_rank source / 100
  const maxTrustRank = Math.max(...sourceTrustRanks);
  const baseScore = maxTrustRank / 100;

  // Corroboration bonus (unique sources)
  const uniqueSources = new Set(sourceIds).size;
  let corroborationBonus = 0;
  if (uniqueSources === 2) corroborationBonus = 0.08;
  else if (uniqueSources === 3) corroborationBonus = 0.12;
  else if (uniqueSources >= 4) corroborationBonus = 0.15;

  let score = baseScore + corroborationBonus;

  // Freshness penalty: if < 15 min old AND breaking → multiply by 0.85
  const ageMs = Date.now() - publishedAt.getTime();
  const freshnessPenaltyApplied = isBreaking && ageMs < 15 * 60 * 1000;
  if (freshnessPenaltyApplied) {
    score = score * 0.85;
  }

  // Cap at 0.98
  score = Math.min(score, 0.98);

  // Round to 4 decimal places
  score = Math.round(score * 10000) / 10000;

  return {
    score,
    label: getConfidenceLabel(score),
    breakdown: { baseScore, corroborationBonus, freshnessPenaltyApplied },
  };
}

export function getConfidenceLabel(score: number): ConfidenceLabel {
  if (score >= 0.9) return "VERIFIED";
  if (score >= 0.7) return "LIKELY";
  if (score >= 0.5) return "UNVERIFIED";
  return "RUMOR";
}
