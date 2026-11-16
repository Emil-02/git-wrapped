"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const LOGIN_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function UsernameForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const login = value.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").split("/")[0];
    if (!LOGIN_PATTERN.test(login)) {
      setError("That doesn't look like a GitHub username.");
      return;
    }
    setError(null);
    setPending(true);
    router.push(`/u/${login}`);
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2">
      <div className="flex rounded-full bg-white/10 p-1.5 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-violet-400">
        <span className="flex items-center pl-4 text-white/50">github.com/</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="your-username"
          aria-label="GitHub username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-white outline-none placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Wrapping…" : "Wrap it"}
        </button>
      </div>
      {error && <p className="pl-4 text-sm text-rose-300">{error}</p>}
    </form>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured: "GitHub login isn't configured on this deployment yet.",
  oauth_state: "Login expired or was tampered with. Please try again.",
  oauth_exchange: "GitHub login failed. Please try again.",
};

export function ErrorBanner() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm text-rose-200 ring-1 ring-rose-400/30">
      {ERROR_MESSAGES[error] ?? "Something went wrong."}
    </p>
  );
}
