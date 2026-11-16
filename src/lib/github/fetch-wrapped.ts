import { githubGraphQL } from "./client";
import {
  COMMIT_TIMES_QUERY,
  CONTRIBUTIONS_QUERY,
  type CommitTimesResponse,
  type ContributionsResponse,
} from "./queries";
import type { WrappedData, WrappedLanguage, WrappedResult } from "./types";

const LOGIN_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidLogin(login: string): boolean {
  return LOGIN_PATTERN.test(login);
}

/**
 * The period a wrapped covers. During January we still show the previous
 * (complete) year, since that's when people share their recaps.
 */
export function getWrappedPeriod(now: Date): { year: number; from: string; to: string } {
  const currentYear = now.getUTCFullYear();
  if (now.getUTCMonth() === 0) {
    const year = currentYear - 1;
    return {
      year,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year}-12-31T23:59:59Z`,
    };
  }
  return {
    year: currentYear,
    from: `${currentYear}-01-01T00:00:00Z`,
    to: now.toISOString(),
  };
}

type Repo = NonNullable<
  ContributionsResponse["user"]
>["contributionsCollection"]["commitContributionsByRepository"][number];

export function aggregateLanguages(repos: Repo[]): WrappedLanguage[] {
  const byName = new Map<string, WrappedLanguage>();
  for (const { contributions, repository } of repos) {
    const { totalSize, edges } = repository.languages;
    if (!totalSize) continue;
    for (const { size, node } of edges) {
      const weight = (size / totalSize) * contributions.totalCount;
      const existing = byName.get(node.name);
      if (existing) existing.weight += weight;
      else byName.set(node.name, { name: node.name, color: node.color, weight });
    }
  }
  return [...byName.values()].sort((a, b) => b.weight - a.weight);
}

export async function fetchWrappedData(
  login: string,
  token: string | undefined,
  now: Date = new Date(),
): Promise<WrappedResult> {
  if (!isValidLogin(login)) return { status: "not_found", login };

  const { year, from, to } = getWrappedPeriod(now);
  const main = await githubGraphQL<ContributionsResponse>(
    CONTRIBUTIONS_QUERY,
    { login, from, to },
    token,
  );
  const user = main.data?.user;
  if (!user) return { status: "not_found", login };

  const collection = user.contributionsCollection;
  const repos = collection.commitContributionsByRepository;

  let commitTimes: string[] = [];
  if (repos.length > 0) {
    // Commit times are a nice-to-have; never fail the whole wrapped because of them.
    try {
      const times = await githubGraphQL<CommitTimesResponse>(
        COMMIT_TIMES_QUERY,
        { login, userId: user.id, from, to, since: from, until: to },
        token,
      );
      commitTimes =
        times.data?.user?.contributionsCollection.commitContributionsByRepository.flatMap(
          (r) =>
            r.repository.defaultBranchRef?.target?.history?.nodes.map((n) => n.authoredDate) ??
            [],
        ) ?? [];
    } catch {
      commitTimes = [];
    }
  }

  const data: WrappedData = {
    year,
    from,
    to,
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
    },
    totals: {
      contributions: collection.contributionCalendar.totalContributions,
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      reviews: collection.totalPullRequestReviewContributions,
      reposCreated: collection.totalRepositoryContributions,
      privateContributions: collection.restrictedContributionsCount,
    },
    calendar: collection.contributionCalendar.weeks.flatMap((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    ),
    repos: repos.map(({ contributions, repository }) => ({
      nameWithOwner: repository.nameWithOwner,
      url: repository.url,
      isPrivate: repository.isPrivate,
      stars: repository.stargazerCount,
      commits: contributions.totalCount,
      language: repository.primaryLanguage,
    })),
    languages: aggregateLanguages(repos),
    commitTimes,
  };

  return { status: "ok", data };
}
