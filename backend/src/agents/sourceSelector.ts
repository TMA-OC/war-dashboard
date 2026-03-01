// sourceSelector.ts
// Returns RSS source slugs relevant to a user based on their preferences

const COUNTRY_TO_SOURCES: Record<string, string[]> = {
  IL: ["haaretz", "times-of-israel", "ynet-news", "i24-news", "jerusalem-post"],
  PS: ["al-jazeera", "middle-east-eye", "times-of-israel"],
  LB: ["naharnet", "al-mayadeen", "al-jazeera"],
  IR: ["iran-international", "press-tv"],
  IQ: ["iraq-news", "rudaw", "kurdistan24", "al-jazeera"],
  YE: ["yemen-observer", "al-jazeera", "al-arabiya"],
  SA: ["arab-news", "al-arabiya"],
  QA: ["al-jazeera"],
  SY: ["al-jazeera", "middle-east-eye"],
  JO: ["al-jazeera", "arab-news"],
  EG: ["al-jazeera", "arab-news"],
  AE: ["al-arabiya", "arab-news"],
  KW: ["arab-news", "al-arabiya"],
  BH: ["arab-news", "al-arabiya"],
  OM: ["arab-news"],
};

const TOPIC_TO_SOURCES: Record<string, string[]> = {
  nuclear: ["iran-international", "bbc-world", "reuters-world", "ap-news"],
  diplomatic: ["reuters-world", "ap-news", "bbc-world", "france24"],
  military: ["reuters-world", "ap-news", "bbc-world", "afp"],
  strikes: ["times-of-israel", "al-jazeera", "bbc-world", "afp"],
  sanctions: ["reuters-world", "ap-news", "the-guardian-world"],
  humanitarian: ["al-jazeera", "middle-east-eye", "bbc-world", "the-guardian-world"],
};

const GLOBAL_SOURCES = ["reuters-world", "ap-news", "bbc-world", "afp", "the-guardian-world"];

/**
 * Returns RSS source slugs relevant to a user based on their preferences.
 * Always includes global tier-1 sources and adds region/topic-specific sources.
 */
export function getSourcesForUser(
  nationalities: string[],
  watchedCountries: string[],
  topics: string[]
): string[] {
  const slugSet = new Set<string>(GLOBAL_SOURCES);

  // Add sources for watched countries and nationalities
  const countries = [...new Set([...nationalities, ...watchedCountries])];
  for (const cc of countries) {
    const mapped = COUNTRY_TO_SOURCES[cc.toUpperCase()] ?? [];
    mapped.forEach((s) => slugSet.add(s));
  }

  // Add topic-specific sources
  for (const topic of topics) {
    const mapped = TOPIC_TO_SOURCES[topic.toLowerCase()] ?? [];
    mapped.forEach((s) => slugSet.add(s));
  }

  return Array.from(slugSet);
}
