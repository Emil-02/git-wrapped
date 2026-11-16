import "server-only";
import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { SESSION_COOKIE, unsealSession, type Session } from "./auth/session";
import { GitHubError } from "./github/client";
import { fetchWrappedData } from "./github/fetch-wrapped";
import type { WrappedResult } from "./github/types";

async function safeFetch(login: string, token: string | undefined): Promise<WrappedResult> {
  try {
    return await fetchWrappedData(login, token);
  } catch (error) {
    // Errors are returned as values: class instances don't survive cache serialization.
    if (error instanceof GitHubError) return { status: "error", kind: error.kind };
    throw error;
  }
}

/**
 * Public wrapped data, cached per username in a shared cache so viral traffic
 * doesn't burn through the GitHub rate limit.
 */
export async function getPublicWrapped(login: string): Promise<WrappedResult> {
  "use cache: remote";
  const result = await safeFetch(login.toLowerCase(), process.env.GITHUB_TOKEN);
  // Don't let a transient GitHub hiccup stick around for hours.
  if (result.status === "error") cacheLife("seconds");
  else cacheLife("hours");
  return result;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return unsealSession(store.get(SESSION_COOKIE)?.value);
}

/** Includes private contributions. Never cached on the server. */
export async function getPrivateWrapped(session: Session): Promise<WrappedResult> {
  return safeFetch(session.login, session.token);
}
