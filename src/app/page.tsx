import { Suspense } from "react";
import { ErrorBanner, UsernameForm } from "@/components/landing";
import { isOAuthConfigured } from "@/lib/auth/session";
import { REPO_URL } from "@/lib/site";

const EXAMPLES = [
  "🦉 Night Owl Rustacean",
  "🐦 Early Bird Pythonista",
  "⚔️ Weekend Warrior Gopher",
  "🛡️ Code Guardian Type Wizard",
  "🔥 Unstoppable JavaScripter",
  "⚡ Burst Mode Rubyist",
  "💼 Nine-to-Five Javanaut",
  "🌱 Steady Polyglot",
];

export default function Home() {
  const oauth = isOAuthConfigured();
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#4c1d95_0%,#0f172a_45%,#000_80%)]">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-bold tracking-tight">git-wrapped</span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm ring-1 ring-white/15 transition hover:bg-white/20"
        >
          ★ Star on GitHub
        </a>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <p className="rounded-full bg-white/10 px-4 py-1 text-sm text-white/80 ring-1 ring-white/15">
          Your GitHub year in review 🎁
        </p>
        <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          Your year in code,{" "}
          <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
            wrapped.
          </span>
        </h1>
        <p className="max-w-xl text-lg text-white/70">
          Contributions, streaks, languages, your coding hours — and the developer personality you
          didn&apos;t know you had. Then share it with the world.
        </p>

        <Suspense>
          <ErrorBanner />
        </Suspense>
        <UsernameForm />

        {oauth && (
          <p className="text-sm text-white/60">
            Want private contributions too?{" "}
            <a href="/api/auth/login" className="font-semibold text-white underline underline-offset-4">
              Sign in with GitHub
            </a>
          </p>
        )}

        <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <span
              key={example}
              className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/70 ring-1 ring-white/10"
            >
              {example}
            </span>
          ))}
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-sm text-white/40">
        Open source ·{" "}
        <a href={REPO_URL} className="underline underline-offset-4 hover:text-white/70">
          Add your own personality
        </a>{" "}
        · Not affiliated with GitHub
      </footer>
    </main>
  );
}
