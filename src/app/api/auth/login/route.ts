import { NextResponse, type NextRequest } from "next/server";
import { STATE_COOKIE, cookieOptions, isOAuthConfigured, randomState } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!isOAuthConfigured()) {
    return NextResponse.redirect(new URL("/?error=oauth_not_configured", origin));
  }

  const state = randomState();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  authorize.searchParams.set("scope", process.env.GITHUB_OAUTH_SCOPE ?? "read:user repo");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, state, { ...cookieOptions, maxAge: 10 * 60 });
  return response;
}
