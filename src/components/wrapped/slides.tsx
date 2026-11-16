"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { Personality } from "@/lib/personality";
import { MONTHS, WEEKDAYS, formatHour, type WrappedStats } from "@/lib/stats";
import { AnimatedNumber } from "./AnimatedNumber";

export interface SlideDefinition {
  id: string;
  background: string;
  content: ReactNode;
}

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
});

function Kicker({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.p {...rise(delay)} className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
      {children}
    </motion.p>
  );
}

function Headline({ children, delay = 0.15 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.h2 {...rise(delay)} className="text-4xl font-black leading-tight text-white">
      {children}
    </motion.h2>
  );
}

function Caption({ children, delay = 0.6 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.p {...rise(delay)} className="text-lg text-white/80">
      {children}
    </motion.p>
  );
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function IntroSlide({ stats }: { stats: WrappedStats }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <motion.img
        src={stats.avatarUrl}
        alt=""
        width={128}
        height={128}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="h-32 w-32 rounded-full border-4 border-white/80 shadow-2xl"
      />
      <Kicker delay={0.3}>Your {stats.year} Git Wrapped</Kicker>
      <Headline delay={0.45}>Hey {stats.name.split(" ")[0]} 👋</Headline>
      <Caption delay={0.8}>You wrote a lot of history this year. Let&apos;s rewind it.</Caption>
    </div>
  );
}

function ContributionsSlide({ stats }: { stats: WrappedStats }) {
  return (
    <div className="flex flex-col gap-4">
      <Kicker>This year you made</Kicker>
      <motion.div {...rise(0.2)} className="text-7xl font-black text-white">
        <AnimatedNumber value={stats.totalContributions} />
      </motion.div>
      <Headline delay={0.3}>contributions</Headline>
      <Caption delay={1}>
        That&apos;s about <b>{stats.averagePerActiveDay}</b> per active day, across{" "}
        <b>{stats.activeDays}</b> days of showing up.
      </Caption>
      {stats.privateContributions > 0 && (
        <Caption delay={1.3}>🔒 {stats.privateContributions.toLocaleString("en-US")} of them were top secret.</Caption>
      )}
    </div>
  );
}

function QuietYearSlide({ stats }: { stats: WrappedStats }) {
  return (
    <div className="flex flex-col gap-4">
      <Kicker>{stats.year} was</Kicker>
      <Headline>a quiet year 🌙</Headline>
      <Caption>
        No public contributions yet. Every legend starts with a first commit — maybe today is the day?
      </Caption>
    </div>
  );
}

function StreakSlide({ stats }: { stats: WrappedStats }) {
  const { longestStreak, busiestDay } = stats;
  return (
    <div className="flex flex-col gap-4">
      <Kicker>Your longest streak</Kicker>
      <motion.div {...rise(0.2)} className="flex items-baseline gap-3 text-white">
        <span className="text-8xl font-black">
          <AnimatedNumber value={longestStreak.days} />
        </span>
        <span className="text-3xl font-bold">days 🔥</span>
      </motion.div>
      {longestStreak.start && longestStreak.end && (
        <Caption delay={0.8}>
          From {formatDate(longestStreak.start)} to {formatDate(longestStreak.end)}.
        </Caption>
      )}
      {busiestDay && (
        <motion.div {...rise(1.2)} className="mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur">
          <p className="text-sm uppercase tracking-widest text-white/60">Biggest day</p>
          <p className="text-2xl font-bold text-white">
            {formatDate(busiestDay.date)} — {busiestDay.count} contributions
          </p>
        </motion.div>
      )}
    </div>
  );
}

function heatLevel(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  return Math.min(4, Math.ceil((count / max) * 4));
}

const HEAT_COLORS = ["rgba(255,255,255,0.08)", "#0e4429", "#006d32", "#26a641", "#39d353"];

function HeatmapSlide({ stats }: { stats: WrappedStats }) {
  const first = stats.calendar[0];
  const offset = first ? new Date(`${first.date}T00:00:00Z`).getUTCDay() : 0;
  // Cap the scale so a single huge day doesn't wash out the rest of the year.
  const sorted = stats.calendar.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
  const max = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const cells = [...Array.from({ length: offset }, () => null), ...stats.calendar];
  const weeks = Math.max(1, Math.ceil(cells.length / 7));

  return (
    <div className="flex flex-col gap-6">
      <Kicker>Your year at a glance</Kicker>
      <Headline>
        Most active in{" "}
        <span className="text-emerald-300">
          {stats.busiestMonth !== null ? MONTHS[stats.busiestMonth] : "—"}
        </span>
      </Headline>
      <div>
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
            gridTemplateRows: "repeat(7, auto)",
            gridAutoFlow: "column",
          }}
        >
          {cells.map((day, i) => (
            <motion.div
              key={day?.date ?? `pad-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + Math.floor(i / 7) * 0.025, duration: 0.25 }}
              title={day ? `${day.date}: ${day.count}` : undefined}
              className="aspect-square w-full rounded-[2px]"
              style={{
                backgroundColor: day ? HEAT_COLORS[heatLevel(day.count, max)] : "transparent",
              }}
            />
          ))}
        </div>
      </div>
      <Caption delay={1.6}>
        You showed up on <b>{stats.activeDays}</b> of {stats.daysInPeriod} days.
      </Caption>
    </div>
  );
}

function RhythmSlide({ stats }: { stats: WrappedStats }) {
  const hasHours = stats.sampledCommits >= 10 && stats.peakHour !== null;
  const values = hasHours ? stats.hourHistogram : stats.weekdayTotals;
  const max = Math.max(1, ...values);
  const labels = hasHours
    ? [0, 6, 12, 18].map((h) => ({ label: formatHour(h), at: h }))
    : WEEKDAYS.map((d, i) => ({ label: d.slice(0, 3), at: i }));
  const peak = hasHours ? stats.peakHour : stats.busiestWeekday;

  return (
    <div className="flex flex-col gap-5">
      <Kicker>Your coding rhythm</Kicker>
      {hasHours ? (
        <Headline>
          Peak focus at <span className="text-amber-300">{formatHour(stats.peakHour!)}</span>
        </Headline>
      ) : (
        <Headline>
          {stats.busiestWeekday !== null ? `${WEEKDAYS[stats.busiestWeekday]}s` : "Every day"} are your
          thing
        </Headline>
      )}
      <div>
        <div className="flex h-36 items-end gap-[3px]">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ delay: 0.4 + i * 0.03, duration: 0.6, ease: "easeOut" }}
              className={`min-w-0 flex-1 rounded-t ${i === peak ? "bg-amber-300" : "bg-white/40"}`}
            />
          ))}
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-white/60">
          {labels.map(({ label, at }) => (
            <span
              key={label}
              className="absolute"
              style={{
                left: `${(at / values.length) * 100}%`,
                width: hasHours ? undefined : `${100 / values.length}%`,
                textAlign: hasHours ? undefined : "center",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      {hasHours ? (
        <Caption delay={1.4}>
          {pct(stats.nightShare)} of your commits happened after 10pm, {pct(stats.morningShare)} before
          10am.
        </Caption>
      ) : (
        <Caption delay={1.4}>{pct(stats.weekendShare)} of your work happened on weekends.</Caption>
      )}
    </div>
  );
}

function LanguagesSlide({ stats }: { stats: WrappedStats }) {
  const [top] = stats.topLanguages;
  return (
    <div className="flex flex-col gap-5">
      <Kicker>You spoke fluent</Kicker>
      <Headline>
        <span style={{ color: top.color }}>{top.name}</span>
      </Headline>
      <div className="flex flex-col gap-3">
        {stats.topLanguages.map((lang, i) => (
          <motion.div key={lang.name} {...rise(0.4 + i * 0.15)} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm font-semibold text-white">
              <span>
                {i + 1}. {lang.name}
              </span>
              <span className="text-white/70">{pct(lang.share)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(lang.share * 100, 2)}%` }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: lang.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ReposSlide({ stats }: { stats: WrappedStats }) {
  return (
    <div className="flex flex-col gap-5">
      <Kicker>Where you spent your time</Kicker>
      <Headline>Your top repos</Headline>
      <ol className="flex flex-col gap-2">
        {stats.topRepos.map((repo, i) => (
          <motion.li
            key={`${repo.name}-${i}`}
            {...rise(0.4 + i * 0.15)}
            className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur"
          >
            <span className="w-6 text-2xl font-black text-white/40">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-white">
                {repo.isPrivate ? "🔒 " : ""}
                {repo.name}
              </p>
              <p className="text-sm text-white/70">
                {repo.commits.toLocaleString("en-US")} commits
                {repo.language ? ` · ${repo.language}` : ""}
                {repo.stars > 0 ? ` · ★ ${repo.stars.toLocaleString("en-US")}` : ""}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function CollaborationSlide({ stats }: { stats: WrappedStats }) {
  const tiles = [
    { label: "Commits", value: stats.commits, emoji: "📦" },
    { label: "Pull requests", value: stats.pullRequests, emoji: "🚀" },
    { label: "Code reviews", value: stats.reviews, emoji: "👀" },
    { label: "Issues", value: stats.issues, emoji: "🐛" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <Kicker>Teamwork makes the dream work</Kicker>
      <Headline>You didn&apos;t ship alone</Headline>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.label}
            {...rise(0.4 + i * 0.15)}
            className="rounded-2xl bg-white/10 p-5 backdrop-blur"
          >
            <p className="text-2xl">{tile.emoji}</p>
            <p className="text-4xl font-black text-white">
              <AnimatedNumber value={tile.value} />
            </p>
            <p className="text-sm text-white/70">{tile.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PersonalitySlide({ personality }: { personality: Personality }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Kicker>Your developer personality is</Kicker>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 120, damping: 12 }}
        className="text-8xl"
      >
        {personality.emoji}
      </motion.div>
      <Headline delay={1}>{personality.title}</Headline>
      <Caption delay={1.4}>{personality.description}</Caption>
      {personality.badges.length > 0 && (
        <motion.div {...rise(1.8)} className="flex flex-wrap justify-center gap-2">
          {personality.badges.map((b) => (
            <span
              key={b.id}
              className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white backdrop-blur"
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function buildSlides(
  stats: WrappedStats,
  personality: Personality,
  summary: ReactNode,
): SlideDefinition[] {
  const [from, to] = personality.colors;
  const slides: SlideDefinition[] = [
    {
      id: "intro",
      background: "linear-gradient(160deg,#0f172a,#312e81 60%,#7c3aed)",
      content: <IntroSlide stats={stats} />,
    },
  ];

  if (stats.totalContributions === 0) {
    slides.push({
      id: "quiet",
      background: "linear-gradient(160deg,#020617,#1e293b)",
      content: <QuietYearSlide stats={stats} />,
    });
  } else {
    slides.push(
      {
        id: "contributions",
        background: "linear-gradient(160deg,#064e3b,#059669 60%,#a3e635)",
        content: <ContributionsSlide stats={stats} />,
      },
      {
        id: "streak",
        background: "linear-gradient(160deg,#7c2d12,#ea580c 55%,#facc15)",
        content: <StreakSlide stats={stats} />,
      },
      {
        id: "heatmap",
        background: "linear-gradient(160deg,#0d1117,#161b22 60%,#0e4429)",
        content: <HeatmapSlide stats={stats} />,
      },
      {
        id: "rhythm",
        background: "linear-gradient(160deg,#172554,#1d4ed8 60%,#38bdf8)",
        content: <RhythmSlide stats={stats} />,
      },
    );
    if (stats.topLanguages.length > 0) {
      slides.push({
        id: "languages",
        background: "linear-gradient(160deg,#18181b,#3f3f46)",
        content: <LanguagesSlide stats={stats} />,
      });
    }
    if (stats.topRepos.length > 0) {
      slides.push({
        id: "repos",
        background: "linear-gradient(160deg,#4a044e,#a21caf 60%,#f472b6)",
        content: <ReposSlide stats={stats} />,
      });
    }
    slides.push({
      id: "collaboration",
      background: "linear-gradient(160deg,#083344,#0891b2 60%,#2dd4bf)",
      content: <CollaborationSlide stats={stats} />,
    });
  }

  slides.push(
    {
      id: "personality",
      background: `linear-gradient(160deg,${from},${to})`,
      content: <PersonalitySlide personality={personality} />,
    },
    {
      id: "summary",
      background: "linear-gradient(160deg,#0f172a,#1e293b)",
      content: summary,
    },
  );
  return slides;
}
