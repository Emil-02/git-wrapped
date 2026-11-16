# Contributing to git-wrapped

Thanks for helping make everyone's year in code a little more fun! 🎁

## Quick start

```bash
npm install
cp .env.example .env.local   # add a GITHUB_TOKEN with no scopes
npm run dev
```

Before opening a PR, please run:

```bash
npm test && npm run lint && npm run typecheck
```

## 🧩 Adding a personality (great first PR)

Everything lives in [`src/lib/personality/rules.ts`](src/lib/personality/rules.ts).

### A new vibe

Vibes are checked **top to bottom**, and the first match wins. Add yours above the catch-all `steady` vibe:

```ts
{
  id: "friday-deployer",
  title: "Friday Deployer",
  emoji: "🎲",
  description: "Living dangerously, one Friday merge at a time.",
  colors: ["#7f1d1d", "#facc15"], // card gradient
  test: (s) => s.weekdayTotals[5] / s.totalContributions >= 0.3,
},
```

`s` is a [`WrappedStats`](src/lib/stats/index.ts) object. It has everything you need: streaks, weekday and hour histograms, languages, repos, PRs, reviews and more.

### A new badge

Add it to `BADGES`. A user shows at most three badges, picked in list order.

### A language nickname

Add an entry to `LANGUAGE_NOUNS`, using the language name exactly as GitHub spells it (`"Jupyter Notebook"`, `"C++"`).

### Guidelines

- Keep it **kind**. People share these publicly, so poke fun gently and never punch down.
- Make sure the rule triggers for a meaningful slice of developers, not almost everyone and not almost no one.
- Add a test in [`personality.test.ts`](src/lib/personality/personality.test.ts).

## Other contributions

Bug fixes, new slides, accessibility and performance improvements are all welcome. For bigger changes, please open an issue first so we can discuss the approach.
