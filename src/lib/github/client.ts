const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export type GitHubErrorKind = "config" | "unauthorized" | "rate_limited" | "upstream";

export class GitHubError extends Error {
  constructor(
    public readonly kind: GitHubErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

interface GraphQLError {
  type?: string;
  message: string;
}

export interface GraphQLResult<T> {
  data: T | null;
  notFound: boolean;
}

export async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string | undefined,
): Promise<GraphQLResult<T>> {
  if (!token) {
    throw new GitHubError(
      "config",
      "Missing GitHub token. Set GITHUB_TOKEN in your environment.",
    );
  }

  let res: Response;
  try {
    res = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "git-wrapped",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new GitHubError("upstream", "Could not reach the GitHub API.");
  }

  if (res.status === 401) {
    throw new GitHubError("unauthorized", "GitHub rejected the access token.");
  }
  if (
    res.status === 429 ||
    (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")
  ) {
    throw new GitHubError("rate_limited", "GitHub API rate limit exceeded. Try again later.");
  }
  if (!res.ok) {
    throw new GitHubError("upstream", `GitHub API responded with ${res.status}.`);
  }

  const json = (await res.json()) as { data?: T; errors?: GraphQLError[] };
  const errors = json.errors ?? [];
  const notFound = errors.some((e) => e.type === "NOT_FOUND");
  const rateLimited = errors.some((e) => e.type === "RATE_LIMITED");

  if (rateLimited) {
    throw new GitHubError("rate_limited", "GitHub API rate limit exceeded. Try again later.");
  }
  if (errors.length > 0 && !notFound && !json.data) {
    throw new GitHubError("upstream", errors.map((e) => e.message).join("; "));
  }

  return { data: json.data ?? null, notFound };
}
