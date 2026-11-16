import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  STATE_COOKIE,
  cookieOptions,
  isOAuthConfigured,
  sealSession,
} from "@/lib/auth/session";

async function exchangeCode(code: string, redirectUri: string): Promise<string | null> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

async function fetchLogin(token: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `bearer ${token}`, "User-Agent": "git-wrapped" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { login?: string };
  return json.login ?? null;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/?error=${reason}`, origin));
    response.cookies.delete(STATE_COOKIE);
    return response;
  };

  if (!isOAuthConfigured()) return fail("oauth_not_configured");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) return fail("oauth_state");

  const token = await exchangeCode(code, `${origin}/api/auth/callback`);
  if (!token) return fail("oauth_exchange");

  const login = await fetchLogin(token);
  if (!login) return fail("oauth_exchange");

  const sealed = await sealSession({ token, login, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  const response = NextResponse.redirect(new URL("/me", origin));
  response.cookies.delete(STATE_COOKIE);
  response.cookies.set(SESSION_COOKIE, sealed, { ...cookieOptions, maxAge: SESSION_MAX_AGE });
  return response;
}
