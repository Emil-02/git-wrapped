import { describe, expect, it } from "vitest";
import { makeCalendar, makeData } from "../test-utils";
import { computeStats, type WrappedStats } from "../stats";
import { getPersonality, languageNoun } from ".";

function stats(overrides: Partial<WrappedStats> = {}): WrappedStats {
  return { ...computeStats(makeData()), ...overrides };
}

const nightCommits = Array.from({ length: 20 }, (_, i) => `2026-02-${String(i + 1).padStart(2, "0")}T23:30:00Z`);

describe("languageNoun", () => {
  it("maps known languages", () => {
    expect(languageNoun(stats({ topLanguages: [{ name: "Rust", color: "#000", share: 1 }] }))).toBe(
      "Rustacean",
    );
  });

  it("falls back for unknown languages and empty data", () => {
    expect(languageNoun(stats({ topLanguages: [{ name: "COBOL", color: "#000", share: 1 }] }))).toBe(
      "COBOL Dev",
    );
    expect(languageNoun(stats())).toBe("Developer");
  });

  it("prefers Polyglot for many significant languages", () => {
    expect(languageNoun(stats({ significantLanguageCount: 6 }))).toBe("Polyglot");
  });
});

describe("getPersonality", () => {
  it("detects a Night Owl Rustacean", () => {
    const s = computeStats(
      makeData({
        commitTimes: nightCommits,
        languages: [{ name: "Rust", color: "#dea584", weight: 10 }],
      }),
    );
    expect(getPersonality(s).title).toBe("Night Owl Rustacean");
  });

  it("respects the timezone when classifying hours", () => {
    // 23:30 UTC is 06:30 in UTC+7, so the same commits become early-bird commits.
    const s = computeStats(makeData({ commitTimes: nightCommits }), 7 * 60);
    expect(getPersonality(s).vibe).toBe("early-bird");
  });

  it("ignores hour-based vibes with too few sampled commits", () => {
    const s = computeStats(makeData({ commitTimes: nightCommits.slice(0, 3) }));
    expect(getPersonality(s).vibe).toBe("steady");
  });

  it("detects weekend warriors", () => {
    // 2026-03-07 is a Saturday.
    const s = computeStats(
      makeData({
        totals: { ...makeData().totals, contributions: 30 },
        calendar: makeCalendar("2026-03-07", [15, 10, 5]),
      }),
    );
    expect(getPersonality(s).vibe).toBe("weekend-warrior");
  });

  it("awards at most three badges", () => {
    const p = getPersonality(
      stats({
        significantLanguageCount: 5,
        longestStreak: { days: 40, start: "2026-01-01", end: "2026-02-09" },
        commits: 2000,
        pullRequests: 200,
        reviews: 100,
      }),
    );
    expect(p.badges.map((b) => b.id)).toEqual(["polyglot", "streak", "commit-cannon"]);
  });

  it("always returns a personality", () => {
    const p = getPersonality(stats());
    expect(p.title).toBe("Steady Developer");
    expect(p.badges).toEqual([]);
  });
});
