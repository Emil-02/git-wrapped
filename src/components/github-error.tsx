import { StatusScreen } from "@/components/screens";
import type { GitHubErrorKind } from "@/lib/github/client";

export function GitHubErrorScreen({ kind }: { kind: GitHubErrorKind }) {
  if (kind === "rate_limited") {
    return (
      <StatusScreen emoji="🥵" title="GitHub needs a breather">
        We&apos;ve hit GitHub&apos;s API rate limit. Give it a few minutes and try again.
      </StatusScreen>
    );
  }
  if (kind === "config") {
    return (
      <StatusScreen emoji="🔧" title="Almost there">
        This deployment is missing its <code>GITHUB_TOKEN</code>. See the README to set it up.
      </StatusScreen>
    );
  }
  return (
    <StatusScreen emoji="💥" title="GitHub didn't answer">
      We couldn&apos;t reach GitHub right now. Please try again in a moment.
    </StatusScreen>
  );
}
