"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Personality } from "@/lib/personality";
import { formatHour, type WrappedStats } from "@/lib/stats";

interface Props {
  stats: WrappedStats;
  personality: Personality;
  tzOffset: number;
  includePrivate: boolean;
  onReplay: () => void;
}

const noopSubscribe = () => () => {};

export function SummarySlide({ stats, personality, tzOffset, includePrivate, onReplay }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const origin = isClient ? window.location.origin : "";
  const canNativeShare = isClient && "share" in navigator;
  const shareUrl = `${origin}/u/${stats.login}?tz=${tzOffset}`;
  const imageUrl = `/api/og/${stats.login}?tz=${tzOffset}${includePrivate ? "&private=1" : ""}`;
  const fileName = `git-wrapped-${stats.login}-${stats.year}.png`;
  const article = /^[aeiou]/i.test(personality.title) ? "an" : "a";
  const identity = `Apparently I'm ${article} "${personality.title}" ${personality.emoji}`;
  const text =
    stats.totalContributions > 0
      ? `My ${stats.year} on GitHub: ${stats.totalContributions.toLocaleString("en-US")} contributions and a ${stats.longestStreak.days}-day streak. ${identity}\n\nGet your #GitWrapped 👇`
      : `${identity}\n\nGet your #GitWrapped 👇`;

  const flash = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 2500);
  };

  const fetchImage = async () => {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Image generation failed");
    return res.blob();
  };

  const download = async () => {
    try {
      flash("Rendering your card…");
      const blob = await fetchImage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      flash("Downloaded!");
    } catch {
      flash("Couldn't render the image, try again.");
    }
  };

  const nativeShare = async () => {
    try {
      const blob = await fetchImage();
      const file = new File([blob], fileName, { type: "image/png" });
      const payload: ShareData = { text, url: shareUrl };
      if (navigator.canShare?.({ files: [file] })) payload.files = [file];
      await navigator.share(payload);
    } catch (error) {
      if ((error as Error).name !== "AbortError") flash("Sharing isn't supported here.");
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    flash("Link copied!");
  };

  const tweetUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const tiles = [
    { label: "Contributions", value: stats.totalContributions.toLocaleString("en-US") },
    { label: "Longest streak", value: `${stats.longestStreak.days}d` },
    { label: "Top language", value: stats.topLanguages[0]?.name ?? "—" },
    {
      label: "Peak hour",
      value: stats.sampledCommits >= 10 && stats.peakHour !== null ? formatHour(stats.peakHour) : "—",
    },
  ];

  const buttonClass =
    "rounded-full px-4 py-2.5 text-sm font-semibold transition hover:scale-105 active:scale-95";

  return (
    <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl p-5 shadow-2xl"
        style={{
          background: `linear-gradient(140deg,${personality.colors[0]},${personality.colors[1]})`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stats.avatarUrl} alt="" className="h-12 w-12 rounded-full border-2 border-white/70" />
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{stats.name}</p>
            <p className="text-sm text-white/70">@{stats.login} · {stats.year} Wrapped</p>
          </div>
        </div>
        <p className="mt-3 text-2xl font-black leading-tight text-white">
          {personality.emoji} {personality.title}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl bg-black/20 px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-white/60">{t.label}</p>
              <p className="truncate text-xl font-bold text-white">{t.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2"
      >
        <button onClick={download} className={`${buttonClass} bg-white text-slate-900`}>
          ⬇️ Download image
        </button>
        {canNativeShare && (
          <button onClick={nativeShare} className={`${buttonClass} bg-emerald-400 text-slate-900`}>
            📤 Share
          </button>
        )}
        <a href={tweetUrl} target="_blank" rel="noreferrer" className={`${buttonClass} bg-black text-white ring-1 ring-white/20`}>
          𝕏 Post
        </a>
        <a href={linkedInUrl} target="_blank" rel="noreferrer" className={`${buttonClass} bg-[#0a66c2] text-white`}>
          LinkedIn
        </a>
        <button onClick={copyLink} className={`${buttonClass} bg-white/10 text-white`}>
          🔗 Copy link
        </button>
      </motion.div>

      <p className="-my-1 h-5 text-center text-sm text-white/80" aria-live="polite">
        {status}
      </p>

      <div className="flex justify-center gap-4 text-sm text-white/70">
        <button onClick={onReplay} className="underline-offset-4 hover:underline">
          ↺ Replay
        </button>
        <Link href="/" className="underline-offset-4 hover:underline">
          ✨ Wrap another dev
        </Link>
      </div>
    </div>
  );
}
