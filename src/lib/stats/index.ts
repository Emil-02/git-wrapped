import type { CalendarDay, WrappedData } from "../github/types";

export interface StatLanguage {
  name: string;
  color: string;
  share: number; // 0..1 among top languages
}

export interface StatRepo {
  name: string;
  url: string | null;
  commits: number;
  stars: number;
  language: string | null;
  languageColor: string | null;
  isPrivate: boolean;
}

export interface Streak {
  days: number;
  start: string | null;
  end: string | null;
}

export interface WrappedStats {
  year: number;
  login: string;
  name: string;
  avatarUrl: string;
  totalContributions: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  reposCreated: number;
  privateContributions: number;
  activeDays: number;
  daysInPeriod: number;
  averagePerActiveDay: number;
  longestStreak: Streak;
  busiestDay: CalendarDay | null;
  /** Totals per weekday, index 0 = Sunday. */
  weekdayTotals: number[];
  busiestWeekday: number | null;
  /** Totals per month, index 0 = January. */
  monthTotals: number[];
  busiestMonth: number | null;
  weekendShare: number;
  /** Commits per local hour (based on the sampled commit timestamps). */
  hourHistogram: number[];
  peakHour: number | null;
  nightShare: number;
  morningShare: number;
  sampledCommits: number;
  topLanguages: StatLanguage[];
  /** Languages that make up at least 5% of the weighted activity. */
  significantLanguageCount: number;
  topRepos: StatRepo[];
  calendar: CalendarDay[];
}

const FALLBACK_LANGUAGE_COLOR = "#8b949e";

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function argMax(values: number[]): number | null {
  let best: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0 && (best === null || values[i] > values[best])) best = i;
  }
  return best;
}

function utcDay(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function longestStreak(calendar: CalendarDay[]): Streak {
  const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
  let best: Streak = { days: 0, start: null, end: null };
  let current = 0;
  let currentStart: string | null = null;
  let previous: Date | null = null;

  for (const day of sorted) {
    const date = utcDay(day.date);
    const consecutive = previous !== null && date.getTime() - previous.getTime() === DAY_MS;
    if (day.count > 0) {
      if (current > 0 && consecutive) {
        current++;
      } else {
        current = 1;
        currentStart = day.date;
      }
      if (current > best.days) best = { days: current, start: currentStart, end: day.date };
    } else {
      current = 0;
    }
    previous = date;
  }
  return best;
}

/** Buckets UTC timestamps into local hours using the given offset (minutes east of UTC). */
export function hourHistogram(timestamps: string[], tzOffsetMinutes: number): number[] {
  const hours = new Array<number>(24).fill(0);
  for (const ts of timestamps) {
    const time = Date.parse(ts);
    if (Number.isNaN(time)) continue;
    const local = new Date(time + tzOffsetMinutes * 60 * 1000);
    hours[local.getUTCHours()]++;
  }
  return hours;
}

function shareOf(histogram: number[], hours: number[]): number {
  const total = histogram.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return hours.reduce((sum, h) => sum + histogram[h], 0) / total;
}

export function computeStats(data: WrappedData, tzOffsetMinutes = 0): WrappedStats {
  const calendar = [...data.calendar].sort((a, b) => a.date.localeCompare(b.date));
  const weekdayTotals = new Array<number>(7).fill(0);
  const monthTotals = new Array<number>(12).fill(0);
  let activeDays = 0;
  let busiestDay: CalendarDay | null = null;

  for (const day of calendar) {
    const date = utcDay(day.date);
    weekdayTotals[date.getUTCDay()] += day.count;
    monthTotals[date.getUTCMonth()] += day.count;
    if (day.count > 0) activeDays++;
    if (day.count > 0 && (!busiestDay || day.count > busiestDay.count)) busiestDay = day;
  }

  const calendarTotal = weekdayTotals.reduce((a, b) => a + b, 0);
  const weekendShare = calendarTotal ? (weekdayTotals[0] + weekdayTotals[6]) / calendarTotal : 0;

  const hours = hourHistogram(data.commitTimes, tzOffsetMinutes);

  const allWeight = data.languages.reduce((sum, l) => sum + l.weight, 0);
  // Skip languages that would round down to 0% of the year.
  const top = data.languages.filter((l) => l.weight / allWeight >= 0.01).slice(0, 5);
  const topWeight = top.reduce((sum, l) => sum + l.weight, 0);

  return {
    year: data.year,
    login: data.user.login,
    name: data.user.name || data.user.login,
    avatarUrl: data.user.avatarUrl,
    totalContributions: data.totals.contributions,
    commits: data.totals.commits,
    pullRequests: data.totals.pullRequests,
    issues: data.totals.issues,
    reviews: data.totals.reviews,
    reposCreated: data.totals.reposCreated,
    privateContributions: data.totals.privateContributions,
    activeDays,
    daysInPeriod: calendar.length,
    averagePerActiveDay: activeDays ? Math.round((calendarTotal / activeDays) * 10) / 10 : 0,
    longestStreak: longestStreak(calendar),
    busiestDay,
    weekdayTotals,
    busiestWeekday: argMax(weekdayTotals),
    monthTotals,
    busiestMonth: argMax(monthTotals),
    weekendShare,
    hourHistogram: hours,
    peakHour: argMax(hours),
    nightShare: shareOf(hours, [22, 23, 0, 1, 2, 3, 4]),
    morningShare: shareOf(hours, [5, 6, 7, 8, 9]),
    sampledCommits: hours.reduce((a, b) => a + b, 0),
    topLanguages: top.map((l) => ({
      name: l.name,
      color: l.color ?? FALLBACK_LANGUAGE_COLOR,
      share: topWeight ? l.weight / topWeight : 0,
    })),
    significantLanguageCount: allWeight
      ? data.languages.filter((l) => l.weight / allWeight >= 0.05).length
      : 0,
    topRepos: [...data.repos]
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 5)
      .map((r) => ({
        // Never leak private repository names into shareable output.
        name: r.isPrivate ? "Private repository" : r.nameWithOwner,
        url: r.isPrivate ? null : r.url,
        commits: r.commits,
        stars: r.isPrivate ? 0 : r.stars,
        language: r.language?.name ?? null,
        languageColor: r.language?.color ?? null,
        isPrivate: r.isPrivate,
      })),
    calendar,
  };
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
