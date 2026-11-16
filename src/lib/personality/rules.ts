import type { WrappedStats } from "../stats";

/**
 * Personality rules. Want to add your own? Append a rule below, add a test in
 * `personality.test.ts`, and open a PR. Rules are evaluated top to bottom and
 * the first matching vibe wins.
 */

export interface Vibe {
  id: string;
  title: string;
  emoji: string;
  description: string;
  /** Gradient used for the personality card. */
  colors: [string, string];
  test: (s: WrappedStats) => boolean;
}

export interface Badge {
  id: string;
  label: string;
  emoji: string;
  test: (s: WrappedStats) => boolean;
}

/** Hour based vibes are only trusted when we have enough sampled commits. */
const hasHourData = (s: WrappedStats) => s.sampledCommits >= 10;

export const VIBES: Vibe[] = [
  {
    id: "night-owl",
    title: "Night Owl",
    emoji: "🦉",
    description: "Your best code ships while the rest of the world is asleep.",
    colors: ["#1e1b4b", "#7c3aed"],
    test: (s) => hasHourData(s) && s.nightShare >= 0.4,
  },
  {
    id: "early-bird",
    title: "Early Bird",
    emoji: "🐦",
    description: "First commit before the first coffee. Respect.",
    colors: ["#f59e0b", "#ef4444"],
    test: (s) => hasHourData(s) && s.morningShare >= 0.35,
  },
  {
    id: "weekend-warrior",
    title: "Weekend Warrior",
    emoji: "⚔️",
    description: "Weekdays are for meetings. Weekends are for shipping.",
    colors: ["#065f46", "#10b981"],
    test: (s) => s.weekendShare >= 0.35 && s.totalContributions >= 20,
  },
  {
    id: "code-guardian",
    title: "Code Guardian",
    emoji: "🛡️",
    description: "You review more than you write. Every codebase needs one of you.",
    colors: ["#0c4a6e", "#0ea5e9"],
    test: (s) => s.reviews >= 20 && s.reviews > s.commits,
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    emoji: "🔥",
    description: "Streaks are a lifestyle, not a goal.",
    colors: ["#7f1d1d", "#f97316"],
    test: (s) => s.longestStreak.days >= 60,
  },
  {
    id: "burst-mode",
    title: "Burst Mode",
    emoji: "⚡",
    description: "Long silences, then absolute chaos. Inspiration strikes hard.",
    colors: ["#4c1d95", "#ec4899"],
    test: (s) => s.activeDays > 0 && s.activeDays < 90 && (s.busiestDay?.count ?? 0) >= 20,
  },
  {
    id: "nine-to-five",
    title: "Nine-to-Five",
    emoji: "💼",
    description: "Clock in, ship it, clock out. Work-life balance unlocked.",
    colors: ["#1f2937", "#3b82f6"],
    test: (s) =>
      hasHourData(s) &&
      s.peakHour !== null &&
      s.peakHour >= 9 &&
      s.peakHour <= 17 &&
      s.weekendShare < 0.15,
  },
  {
    id: "steady",
    title: "Steady",
    emoji: "🌱",
    description: "Consistent, calm and always moving forward.",
    colors: ["#14532d", "#84cc16"],
    test: () => true,
  },
];

export const LANGUAGE_NOUNS: Record<string, string> = {
  Rust: "Rustacean",
  Python: "Pythonista",
  TypeScript: "Type Wizard",
  JavaScript: "JavaScripter",
  Go: "Gopher",
  Java: "Javanaut",
  Kotlin: "Kotliner",
  Swift: "Swiftie",
  "Objective-C": "Apple Archaeologist",
  C: "Bit Wrangler",
  "C++": "Template Sorcerer",
  "C#": "Sharpshooter",
  PHP: "PHPartisan",
  Ruby: "Rubyist",
  Elixir: "Alchemist",
  Erlang: "Telecom Monk",
  Haskell: "Lambda Monk",
  OCaml: "Camel Rider",
  Scala: "Scalawag",
  Clojure: "Parenthesizer",
  Dart: "Flutterer",
  Lua: "Moonwalker",
  Shell: "Shell Whisperer",
  PowerShell: "Shell Commander",
  Zig: "Ziguana",
  Nix: "Nix Wizard",
  HTML: "Pixel Pusher",
  CSS: "Pixel Pusher",
  SCSS: "Pixel Pusher",
  Vue: "Vue-tiful Dev",
  Svelte: "Svelte Surfer",
  Astro: "Astronaut",
  "Jupyter Notebook": "Data Scientist",
  R: "Statistician",
  Julia: "Number Cruncher",
  Solidity: "Chain Smith",
  MDX: "Docs Hero",
  Markdown: "Docs Hero",
  Dockerfile: "Container Captain",
  HCL: "Cloud Architect",
  Assembly: "Metal Bender",
  Verilog: "Silicon Shaper",
  Gleam: "Starlight Dev",
  Odin: "Odin's Chosen",
};

export const BADGES: Badge[] = [
  { id: "polyglot", label: "Polyglot", emoji: "🌍", test: (s) => s.significantLanguageCount >= 5 },
  { id: "streak", label: "Streak Master", emoji: "🔥", test: (s) => s.longestStreak.days >= 30 },
  { id: "commit-cannon", label: "Commit Cannon", emoji: "💥", test: (s) => s.commits >= 1000 },
  { id: "pr-machine", label: "PR Machine", emoji: "🚀", test: (s) => s.pullRequests >= 100 },
  { id: "reviewer", label: "Review Royalty", emoji: "👀", test: (s) => s.reviews >= 50 },
  { id: "bug-hunter", label: "Bug Hunter", emoji: "🐛", test: (s) => s.issues >= 50 },
  { id: "every-day", label: "Daily Driver", emoji: "📅", test: (s) => s.activeDays >= 250 },
  { id: "starter", label: "Project Starter", emoji: "🌱", test: (s) => s.reposCreated >= 10 },
  {
    id: "secret-agent",
    label: "Secret Agent",
    emoji: "🕵️",
    test: (s) => s.privateContributions > 0 && s.privateContributions >= s.totalContributions / 2,
  },
  {
    id: "star-power",
    label: "Star Power",
    emoji: "⭐",
    test: (s) => s.topRepos.some((r) => r.stars >= 1000),
  },
];
