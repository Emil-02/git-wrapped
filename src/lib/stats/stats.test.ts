import { describe, expect, it } from "vitest";
import { makeCalendar, makeData } from "../test-utils";
import { computeStats, hourHistogram, longestStreak } from ".";

describe("longestStreak", () => {
  it("returns zero for an empty calendar", () => {
    expect(longestStreak([])).toEqual({ days: 0, start: null, end: null });
  });

  it("finds the longest run of active days", () => {
    const calendar = makeCalendar("2026-03-01", [1, 1, 0, 2, 3, 4, 0, 1]);
    expect(longestStreak(calendar)).toEqual({
      days: 3,
      start: "2026-03-04",
      end: "2026-03-06",
    });
  });

  it("breaks streaks across missing dates", () => {
    const calendar = [
      { date: "2026-01-01", count: 1 },
      { date: "2026-01-02", count: 1 },
      { date: "2026-01-05", count: 1 },
    ];
    expect(longestStreak(calendar).days).toBe(2);
  });

  it("handles unsorted input", () => {
    const calendar = makeCalendar("2026-01-01", [1, 1, 1]).reverse();
    expect(longestStreak(calendar)).toEqual({
      days: 3,
      start: "2026-01-01",
      end: "2026-01-03",
    });
  });
});

describe("hourHistogram", () => {
  it("shifts UTC timestamps into the local timezone", () => {
    const hours = hourHistogram(["2026-05-01T20:30:00Z", "2026-05-01T23:10:00Z"], 7 * 60);
    expect(hours[3]).toBe(1); // 20:30 UTC -> 03:30 WIB
    expect(hours[6]).toBe(1); // 23:10 UTC -> 06:10 WIB
  });

  it("supports negative offsets and ignores invalid timestamps", () => {
    const hours = hourHistogram(["2026-05-01T02:00:00Z", "nope"], -5 * 60);
    expect(hours[21]).toBe(1);
    expect(hours.reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe("computeStats", () => {
  it("summarizes calendar, languages and repositories", () => {
    // 2026-03-02 is a Monday.
    const calendar = makeCalendar("2026-03-02", [5, 0, 2, 0, 0, 10, 3]);
    const stats = computeStats(
      makeData({
        totals: {
          contributions: 20,
          commits: 15,
          pullRequests: 3,
          issues: 1,
          reviews: 1,
          reposCreated: 0,
          privateContributions: 0,
        },
        calendar,
        languages: [
          { name: "TypeScript", color: "#3178c6", weight: 6 },
          { name: "Rust", color: null, weight: 2 },
        ],
        repos: [
          {
            nameWithOwner: "octocat/small",
            url: "https://github.com/octocat/small",
            isPrivate: false,
            stars: 1,
            commits: 2,
            language: null,
          },
          {
            nameWithOwner: "octocat/secret",
            url: "https://github.com/octocat/secret",
            isPrivate: true,
            stars: 99,
            commits: 13,
            language: { name: "Rust", color: "#dea584" },
          },
        ],
      }),
    );

    expect(stats.activeDays).toBe(4);
    expect(stats.busiestDay).toEqual({ date: "2026-03-07", count: 10 });
    expect(stats.busiestWeekday).toBe(6); // Saturday
    expect(stats.busiestMonth).toBe(2); // March
    expect(stats.weekendShare).toBeCloseTo(13 / 20);
    expect(stats.averagePerActiveDay).toBe(5);
    expect(stats.topLanguages).toEqual([
      { name: "TypeScript", color: "#3178c6", share: 0.75 },
      { name: "Rust", color: "#8b949e", share: 0.25 },
    ]);
    expect(stats.significantLanguageCount).toBe(2);
    expect(stats.topRepos[0]).toMatchObject({
      name: "Private repository",
      url: null,
      stars: 0,
      commits: 13,
    });
    expect(stats.topRepos[1].name).toBe("octocat/small");
  });

  it("computes night and morning shares", () => {
    const stats = computeStats(
      makeData({
        commitTimes: [
          "2026-01-01T23:00:00Z",
          "2026-01-02T01:00:00Z",
          "2026-01-02T07:00:00Z",
          "2026-01-02T14:00:00Z",
        ],
      }),
    );
    expect(stats.sampledCommits).toBe(4);
    expect(stats.nightShare).toBe(0.5);
    expect(stats.morningShare).toBe(0.25);
  });

  it("drops languages below 1% of the activity", () => {
    const stats = computeStats(
      makeData({
        languages: [
          { name: "Go", color: "#00add8", weight: 999 },
          { name: "Shell", color: "#89e051", weight: 1 },
        ],
      }),
    );
    expect(stats.topLanguages.map((l) => l.name)).toEqual(["Go"]);
  });

  it("handles a completely empty year", () => {
    const stats = computeStats(makeData());
    expect(stats.busiestDay).toBeNull();
    expect(stats.busiestWeekday).toBeNull();
    expect(stats.peakHour).toBeNull();
    expect(stats.averagePerActiveDay).toBe(0);
    expect(stats.topLanguages).toEqual([]);
    expect(stats.name).toBe("The Octocat");
  });
});
