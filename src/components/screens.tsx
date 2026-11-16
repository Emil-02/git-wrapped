import Link from "next/link";
import type { ReactNode } from "react";

export function StatusScreen({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_top,#312e81_0%,#000_70%)] px-6 text-center">
      <div className="text-6xl">{emoji}</div>
      <h1 className="text-3xl font-black">{title}</h1>
      {children && <div className="max-w-md text-white/70">{children}</div>}
      <Link
        href="/"
        className="mt-4 rounded-full bg-white px-5 py-2 font-semibold text-slate-900 transition hover:scale-105"
      >
        ← Try another username
      </Link>
    </main>
  );
}

export function LoadingScreen({ label = "Wrapping up your year…" }: { label?: string }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_top,#4c1d95_0%,#000_70%)]">
      <div className="text-6xl motion-safe:animate-bounce">🎁</div>
      <p className="animate-pulse text-lg text-white/80">{label}</p>
    </main>
  );
}
