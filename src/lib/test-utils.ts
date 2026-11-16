import type { WrappedData } from "./github/types";

export function makeData(overrides: Partial<WrappedData> = {}): WrappedData {
  return {
    year: 2026,
    from: "2026-01-01T00:00:00Z",
    to: "2026-11-16T00:00:00Z",
    user: {
      login: "octocat",
      name: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
      createdAt: "2011-01-25T18:44:36Z",
      followers: 100,
    },
    totals: {
      contributions: 0,
      commits: 0,
      pullRequests: 0,
      issues: 0,
      reviews: 0,
      reposCreated: 0,
      privateContributions: 0,
    },
    calendar: [],
    repos: [],
    languages: [],
    commitTimes: [],
    ...overrides,
  };
}

/** Builds a calendar from a start date and a list of daily counts. */
export function makeCalendar(start: string, counts: number[]) {
  const base = Date.parse(`${start}T00:00:00Z`);
  return counts.map((count, i) => ({
    date: new Date(base + i * 86_400_000).toISOString().slice(0, 10),
    count,
  }));
}
