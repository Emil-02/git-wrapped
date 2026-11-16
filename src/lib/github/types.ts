export interface WrappedLanguage {
  name: string;
  color: string | null;
  /** Weighted size (bytes share × commits) used for ranking. */
  weight: number;
}

export interface WrappedRepo {
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  stars: number;
  commits: number;
  language: { name: string; color: string | null } | null;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  count: number;
}

/** Raw, serializable data fetched from GitHub. Timezone independent. */
export interface WrappedData {
  year: number;
  from: string;
  to: string;
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    createdAt: string;
    followers: number;
  };
  totals: {
    contributions: number;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    reposCreated: number;
    privateContributions: number;
  };
  calendar: CalendarDay[];
  repos: WrappedRepo[];
  languages: WrappedLanguage[];
  /** ISO timestamps (UTC) of a sample of the user's authored commits. */
  commitTimes: string[];
}

export type WrappedResult =
  | { status: "ok"; data: WrappedData }
  | { status: "not_found"; login: string }
  | { status: "error"; kind: "config" | "unauthorized" | "rate_limited" | "upstream" };
