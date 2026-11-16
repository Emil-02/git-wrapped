import type { WrappedStats } from "../stats";
import { BADGES, LANGUAGE_NOUNS, VIBES, type Badge, type Vibe } from "./rules";

export interface Personality {
  title: string;
  emoji: string;
  description: string;
  colors: [string, string];
  vibe: Vibe["id"];
  badges: Pick<Badge, "id" | "label" | "emoji">[];
}

const MAX_BADGES = 3;

export function languageNoun(stats: WrappedStats): string {
  if (stats.significantLanguageCount >= 5) return "Polyglot";
  const top = stats.topLanguages[0]?.name;
  if (!top) return "Developer";
  return LANGUAGE_NOUNS[top] ?? `${top} Dev`;
}

export function getPersonality(stats: WrappedStats): Personality {
  const vibe = VIBES.find((v) => v.test(stats)) ?? VIBES[VIBES.length - 1];
  return {
    title: `${vibe.title} ${languageNoun(stats)}`,
    emoji: vibe.emoji,
    description: vibe.description,
    colors: vibe.colors,
    vibe: vibe.id,
    badges: BADGES.filter((b) => b.test(stats))
      .slice(0, MAX_BADGES)
      .map(({ id, label, emoji }) => ({ id, label, emoji })),
  };
}

export { BADGES, LANGUAGE_NOUNS, VIBES };
