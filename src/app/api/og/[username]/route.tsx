import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, unsealSession } from "@/lib/auth/session";
import { getPrivateWrapped, getPublicWrapped } from "@/lib/data";
import { isValidLogin } from "@/lib/github/fetch-wrapped";
import { loadOgFonts } from "@/lib/og-fonts";
import { getPersonality } from "@/lib/personality";
import { computeStats, formatHour } from "@/lib/stats";
import { parseTzOffset } from "@/lib/timezone";

const SIZE = { width: 1200, height: 630 };

function Fallback({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(140deg,#0f172a,#312e81,#7c3aed)",
        color: "white",
        fontSize: 72,
        fontWeight: 800,
      }}
    >
      <div>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 400, opacity: 0.8, marginTop: 16 }}>{subtitle}</div>
    </div>
  );
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/og/[username]">) {
  const { username } = await ctx.params;
  const tz = parseTzOffset(request.nextUrl.searchParams.get("tz")) ?? 0;
  const wantsPrivate = request.nextUrl.searchParams.get("private") === "1";
  const host = request.nextUrl.host;

  if (!isValidLogin(username)) {
    return new ImageResponse(<Fallback title="git-wrapped" subtitle="Your year in code" />, {
      ...SIZE,
      status: 404,
    });
  }

  const session = wantsPrivate
    ? await unsealSession(request.cookies.get(SESSION_COOKIE)?.value)
    : null;
  const result =
    session && session.login.toLowerCase() === username.toLowerCase()
      ? await getPrivateWrapped(session)
      : await getPublicWrapped(username);

  if (result.status === "error") {
    const message =
      result.kind === "rate_limited"
        ? "GitHub is catching its breath. Try again soon."
        : "Something went wrong.";
    return new ImageResponse(<Fallback title="git-wrapped" subtitle={message} />, {
      ...SIZE,
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (result.status === "not_found") {
    return new ImageResponse(<Fallback title="User not found" subtitle={`@${username}`} />, {
      ...SIZE,
      status: 404,
    });
  }

  const stats = computeStats(result.data, tz);
  const personality = getPersonality(stats);
  const [from, to] = personality.colors;
  const tiles = [
    { label: "Contributions", value: stats.totalContributions.toLocaleString("en-US") },
    { label: "Longest streak", value: `${stats.longestStreak.days} days` },
    { label: "Top language", value: stats.topLanguages[0]?.name ?? "—" },
    {
      label: "Peak hour",
      value: stats.sampledCommits >= 10 && stats.peakHour !== null ? formatHour(stats.peakHour) : "—",
    },
    { label: "Pull requests", value: stats.pullRequests.toLocaleString("en-US") },
    { label: "Active days", value: String(stats.activeDays) },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 56,
          background: `linear-gradient(140deg, ${from}, ${to})`,
          color: "white",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 520, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stats.avatarUrl}
              alt=""
              width={112}
              height={112}
              style={{ borderRadius: 999, border: "4px solid rgba(255,255,255,0.8)" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 40, fontWeight: 800, maxWidth: 360 }}>{stats.name}</div>
              <div style={{ fontSize: 26, opacity: 0.75 }}>
                {`@${stats.login} · ${stats.year} Wrapped`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 26, opacity: 0.75, textTransform: "uppercase", letterSpacing: 4 }}>
              Developer personality
            </div>
            <div style={{ fontSize: 96, lineHeight: 1 }}>{personality.emoji}</div>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05 }}>{personality.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {personality.badges.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    fontSize: 20,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.18)",
                  }}
                >
                  {`${b.emoji} ${b.label}`}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 40, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {tiles.map((t) => (
              <div
                key={t.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 248,
                  padding: "18px 22px",
                  borderRadius: 24,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <div style={{ fontSize: 17, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2 }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 36, fontWeight: 800 }}>{t.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 24, opacity: 0.8 }}>
            {`Get yours at ${host}`}
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: await loadOgFonts(),
      headers: {
        "Cache-Control": wantsPrivate ? "private, no-store" : "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
