import type { Metadata } from "next";
import { Suspense } from "react";
import { GitHubErrorScreen } from "@/components/github-error";
import { LoadingScreen, StatusScreen } from "@/components/screens";
import { Wrapped } from "@/components/wrapped/Wrapped";
import { getPublicWrapped } from "@/lib/data";
import { isValidLogin } from "@/lib/github/fetch-wrapped";
import { parseTzOffset } from "@/lib/timezone";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  const { tz } = await searchParams;
  const offset = parseTzOffset(typeof tz === "string" ? tz : null);
  const image = `/api/og/${encodeURIComponent(username)}${offset !== null ? `?tz=${offset}` : ""}`;
  const title = `@${username}'s year in code — git-wrapped`;
  const description = `See ${username}'s GitHub year in review and developer personality. Then get yours.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

async function UserWrapped({ params }: Pick<PageProps<"/u/[username]">, "params">) {
  const { username } = await params;
  if (!isValidLogin(username)) {
    return (
      <StatusScreen emoji="🤔" title="That's not a valid username">
        GitHub usernames only contain letters, numbers and single hyphens.
      </StatusScreen>
    );
  }

  const result = await getPublicWrapped(username);
  if (result.status === "error") return <GitHubErrorScreen kind={result.kind} />;
  if (result.status === "not_found") {
    return (
      <StatusScreen emoji="🕵️" title={`We couldn't find @${username}`}>
        Double-check the spelling — or maybe they&apos;re an organization?
      </StatusScreen>
    );
  }
  return <Wrapped data={result.data} />;
}

export default function UserPage(props: PageProps<"/u/[username]">) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <UserWrapped params={props.params} />
    </Suspense>
  );
}
