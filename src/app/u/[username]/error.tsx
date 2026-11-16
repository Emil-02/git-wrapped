"use client";

import { StatusScreen } from "@/components/screens";

export default function UserError({ reset }: { reset: () => void }) {
  return (
    <StatusScreen emoji="💥" title="Something went wrong">
      <p>We couldn&apos;t load this wrapped right now.</p>
      <button onClick={reset} className="mt-3 underline underline-offset-4">
        Try again
      </button>
    </StatusScreen>
  );
}
