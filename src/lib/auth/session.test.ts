import { beforeEach, describe, expect, it } from "vitest";
import { sealSession, unsealSession } from "./session";

beforeEach(() => {
  process.env.AUTH_SECRET = "a".repeat(32);
});

describe("session cookie", () => {
  it("round-trips a session", async () => {
    const session = { token: "gho_secret", login: "octocat", exp: Date.now() + 60_000 };
    const sealed = await sealSession(session);
    expect(sealed).not.toContain("gho_secret");
    expect(await unsealSession(sealed)).toEqual(session);
  });

  it("rejects expired sessions", async () => {
    const sealed = await sealSession({ token: "t", login: "octocat", exp: Date.now() - 1 });
    expect(await unsealSession(sealed)).toBeNull();
  });

  it("rejects tampered or foreign cookies", async () => {
    const sealed = await sealSession({ token: "t", login: "octocat", exp: Date.now() + 60_000 });
    const [iv, data] = sealed.split(".");
    const flipped = data.slice(0, -2) + (data.at(-2) === "A" ? "B" : "A") + data.at(-1);
    expect(await unsealSession(`${iv}.${flipped}`)).toBeNull();
    expect(await unsealSession("garbage")).toBeNull();
    expect(await unsealSession(undefined)).toBeNull();

    process.env.AUTH_SECRET = "b".repeat(32);
    expect(await unsealSession(sealed)).toBeNull();
  });
});
