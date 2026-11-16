import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GitHubErrorScreen } from "@/components/github-error";
import { LoadingScreen, StatusScreen } from "@/components/screens";
import { Wrapped } from "@/components/wrapped/Wrapped";
import { isOAuthConfigured } from "@/lib/auth/session";
import { getPrivateWrapped, getSession } from "@/lib/data";

export const metadata: Metadata = {
  title: "Your private wrapped — git-wrapped",
  robots: { index: false },
};

async function MyWrapped() {
  // Reading cookies first keeps this page request-time, so runtime env vars are respected.
  const session = await getSession();
  if (!isOAuthConfigured()) redirect("/?error=oauth_not_configured");
  if (!session) redirect("/api/auth/login");

  const result = await getPrivateWrapped(session);
  if (result.status === "error") {
    if (result.kind === "unauthorized") redirect("/api/auth/login");
    return <GitHubErrorScreen kind={result.kind} />;
  }
  if (result.status === "not_found") {
    return <StatusScreen emoji="🕵️" title="We couldn't load your account" />;
  }
  return (
    <>
      <Wrapped data={result.data} includePrivate />
      <form action="/api/auth/logout" method="post" className="fixed right-4 bottom-4 z-50">
        <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 ring-1 ring-white/15 hover:bg-white/20">
          Sign out
        </button>
      </form>
    </>
  );
}

export default function MePage() {
  return (
    <Suspense fallback={<LoadingScreen label="Unwrapping your private year…" />}>
      <MyWrapped />
    </Suspense>
  );
}
