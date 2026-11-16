import "server-only";

/**
 * Stateless, encrypted session cookie. The GitHub access token never touches a
 * database: it only lives inside an AES-GCM encrypted, httpOnly cookie.
 */

export const SESSION_COOKIE = "gw_session";
export const STATE_COOKIE = "gw_oauth_state";
// Matches GitHub's lifetime for expiring user access tokens.
export const SESSION_MAX_AGE = 60 * 60 * 8;

export interface Session {
  token: string;
  login: string;
  exp: number; // epoch ms
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

export async function sealSession(session: Session): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await getKey(),
    encoder.encode(JSON.stringify(session)),
  );
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

export async function unsealSession(value: string | undefined): Promise<Session | null> {
  if (!value) return null;
  const [iv, data] = value.split(".");
  if (!iv || !data) return null;
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64Url(iv) },
      await getKey(),
      fromBase64Url(data),
    );
    const session = JSON.parse(decoder.decode(plaintext)) as Session;
    if (typeof session.token !== "string" || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function randomState(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(24)));
}

export function isOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.AUTH_SECRET,
  );
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
