import { describe, expect, it } from "vitest";
import { aggregateLanguages, getWrappedPeriod, isValidLogin } from "./fetch-wrapped";

describe("isValidLogin", () => {
  it.each(["octocat", "a", "foo-bar", "A1-b2"])("accepts %s", (login) => {
    expect(isValidLogin(login)).toBe(true);
  });

  it.each(["", "-foo", "foo-", "foo--bar", "foo_bar", "a".repeat(40), "../etc"])(
    "rejects %s",
    (login) => {
      expect(isValidLogin(login)).toBe(false);
    },
  );
});

describe("getWrappedPeriod", () => {
  it("covers the current year up to now", () => {
    const now = new Date("2026-11-16T03:00:00Z");
    expect(getWrappedPeriod(now)).toEqual({
      year: 2026,
      from: "2026-01-01T00:00:00Z",
      to: "2026-11-16T03:00:00.000Z",
    });
  });

  it("shows the previous full year during January", () => {
    expect(getWrappedPeriod(new Date("2027-01-10T00:00:00Z"))).toEqual({
      year: 2026,
      from: "2026-01-01T00:00:00Z",
      to: "2026-12-31T23:59:59Z",
    });
  });
});

describe("aggregateLanguages", () => {
  it("weights language size share by commit count", () => {
    const repo = (commits: number, edges: [string, number][]) => ({
      contributions: { totalCount: commits },
      repository: {
        nameWithOwner: "x/y",
        url: "",
        isPrivate: false,
        stargazerCount: 0,
        primaryLanguage: null,
        languages: {
          totalSize: edges.reduce((s, [, size]) => s + size, 0),
          edges: edges.map(([name, size]) => ({ size, node: { name, color: null } })),
        },
      },
    });

    const result = aggregateLanguages([
      repo(10, [
        ["Go", 75],
        ["Shell", 25],
      ]),
      repo(5, [["Shell", 100]]),
      repo(3, []),
    ]);

    expect(result).toEqual([
      { name: "Go", color: null, weight: 7.5 },
      { name: "Shell", color: null, weight: 7.5 },
    ]);
  });
});
