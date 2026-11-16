import "server-only";

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 800; style: "normal" };

const WEIGHTS = [400, 800] as const;
let cached: Promise<OgFont[]> | null = null;

async function fetchFont(weight: number): Promise<ArrayBuffer> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, {
    signal: AbortSignal.timeout(5_000),
  }).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error("Font URL not found");
  return fetch(url, { signal: AbortSignal.timeout(5_000) }).then((r) => r.arrayBuffer());
}

/** Loads Inter for OG images. Falls back to the built-in font if Google Fonts is unreachable. */
export function loadOgFonts(): Promise<OgFont[]> {
  cached ??= Promise.all(
    WEIGHTS.map(async (weight) => ({
      name: "Inter",
      data: await fetchFont(weight),
      weight,
      style: "normal" as const,
    })),
  ).catch(() => {
    cached = null;
    return [];
  });
  return cached;
}
