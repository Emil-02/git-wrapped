"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { WrappedData } from "@/lib/github/types";
import { getPersonality } from "@/lib/personality";
import { computeStats } from "@/lib/stats";
import { parseTzOffset } from "@/lib/timezone";
import { buildSlides } from "./slides";
import { SummarySlide } from "./SummarySlide";

const SLIDE_DURATION_MS = 7000;

const noopSubscribe = () => () => {};
const browserOffset = () => -new Date().getTimezoneOffset();

interface Props {
  data: WrappedData;
  includePrivate?: boolean;
}

export function Wrapped({ data, includePrivate = false }: Props) {
  const searchParams = useSearchParams();
  const localOffset = useSyncExternalStore(noopSubscribe, browserOffset, () => 0);
  // A shared link carries the owner's timezone so everybody sees the same personality.
  const tzOffset = parseTzOffset(searchParams.get("tz")) ?? localOffset;

  const stats = useMemo(() => computeStats(data, tzOffset), [data, tzOffset]);
  const personality = useMemo(() => getPersonality(stats), [stats]);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const elapsed = useRef(0);
  const replay = useCallback(() => {
    elapsed.current = 0;
    setIndex(0);
    setProgress(0);
    setReplayKey((k) => k + 1);
  }, []);

  const slides = useMemo(
    () =>
      buildSlides(
        stats,
        personality,
        <SummarySlide
          stats={stats}
          personality={personality}
          tzOffset={tzOffset}
          includePrivate={includePrivate}
          onReplay={replay}
        />,
      ),
    [stats, personality, tzOffset, includePrivate, replay],
  );

  const isLast = index === slides.length - 1;

  const go = useCallback(
    (delta: number) => {
      elapsed.current = 0;
      setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + delta)));
      setProgress(0);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || held || isLast) return;
    let last = performance.now();
    let id = 0;
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      if (elapsed.current >= SLIDE_DURATION_MS) {
        elapsed.current = 0;
        setProgress(0);
        setIndex((i) => Math.min(slides.length - 1, i + 1));
        return;
      }
      setProgress(elapsed.current / SLIDE_DURATION_MS);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [paused, held, isLast, index, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1);
  };

  const slide = slides[index];

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black">
      <div className="relative h-[100dvh] w-full max-w-md overflow-hidden sm:h-[min(92dvh,880px)] sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-white/10">
        <AnimatePresence initial={false}>
          <motion.div
            key={`bg-${slide.id}`}
            className="absolute inset-0"
            style={{ background: slide.background }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </AnimatePresence>

        <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-3 p-4">
          <div className="flex gap-1">
            {slides.map((s, i) => (
              <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-white"
                  style={{
                    width: `${i < index ? 100 : i === index ? (isLast ? 100 : progress * 100) : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-white">
            <Link href="/" className="text-sm font-bold tracking-tight">
              git-wrapped
            </Link>
            <div className="flex items-center gap-3 text-sm">
              {!isLast && (
                <button
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? "Play" : "Pause"}
                  className="rounded-full bg-white/15 px-3 py-1"
                >
                  {paused ? "▶" : "❚❚"}
                </button>
              )}
              {!isLast && (
                <button
                  onClick={() => {
                    elapsed.current = 0;
                    setIndex(slides.length - 1);
                    setProgress(0);
                  }}
                  className="rounded-full bg-white/15 px-3 py-1"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="relative z-10 flex h-full cursor-pointer select-none no-scrollbar flex-col overflow-y-auto px-7 pt-20 pb-10"
          onClick={isLast ? undefined : onTap}
          onPointerDown={() => !isLast && setHeld(true)}
          onPointerUp={() => setHeld(false)}
          onPointerLeave={() => setHeld(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${slide.id}-${replayKey}`}
              className="my-auto w-full cursor-auto"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              {slide.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {!isLast && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 z-20 text-center text-xs text-white/50">
            Tap to continue →
          </p>
        )}
      </div>
    </main>
  );
}
