export const CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      id
      login
      name
      avatarUrl(size: 256)
      createdAt
      followers {
        totalCount
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 10) {
          contributions {
            totalCount
          }
          repository {
            nameWithOwner
            url
            isPrivate
            stargazerCount
            primaryLanguage {
              name
              color
            }
            languages(first: 6, orderBy: { field: SIZE, direction: DESC }) {
              totalSize
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const COMMIT_TIMES_QUERY = /* GraphQL */ `
  query CommitTimes(
    $login: String!
    $userId: ID!
    $from: DateTime!
    $to: DateTime!
    $since: GitTimestamp!
    $until: GitTimestamp!
  ) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 10) {
          repository {
            defaultBranchRef {
              target {
                ... on Commit {
                  history(
                    first: 100
                    author: { id: $userId }
                    since: $since
                    until: $until
                  ) {
                    nodes {
                      authoredDate
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface ContributionsResponse {
  user: {
    id: string;
    login: string;
    name: string | null;
    avatarUrl: string;
    createdAt: string;
    followers: { totalCount: number };
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalPullRequestReviewContributions: number;
      totalRepositoryContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
      };
      commitContributionsByRepository: {
        contributions: { totalCount: number };
        repository: {
          nameWithOwner: string;
          url: string;
          isPrivate: boolean;
          stargazerCount: number;
          primaryLanguage: { name: string; color: string | null } | null;
          languages: {
            totalSize: number;
            edges: { size: number; node: { name: string; color: string | null } }[];
          };
        };
      }[];
    };
  } | null;
}

export interface CommitTimesResponse {
  user: {
    contributionsCollection: {
      commitContributionsByRepository: {
        repository: {
          defaultBranchRef: {
            target: { history?: { nodes: { authoredDate: string }[] } } | null;
          } | null;
        };
      }[];
    };
  } | null;
}
