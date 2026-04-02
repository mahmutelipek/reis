import { createHmac, timingSafeEqual } from "node:crypto";

export const SHARE_UNLOCK_COOKIE = "promptly_share_unlock";

function getSecret(): string | null {
  const s = process.env.SHARE_UNLOCK_SECRET?.trim();
  if (!s || s.length < 16) return null;
  return s;
}

/** slug:nanoExp:hexHmac — exp Unix saniye */
export function createShareUnlockToken(shareSlug: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const base = `${shareSlug}:${exp}`;
  const sig = createHmac("sha256", secret).update(base).digest("hex");
  return Buffer.from(`${base}:${sig}`, "utf8").toString("base64url");
}

export function verifyShareUnlockToken(
  shareSlug: string,
  cookieValue: string | undefined,
): boolean {
  if (!getSecret() || !cookieValue) return false;
  try {
    const raw = Buffer.from(cookieValue, "base64url").toString("utf8");
    const lastColon = raw.lastIndexOf(":");
    if (lastColon <= 0) return false;
    const sig = raw.slice(lastColon + 1);
    const base = raw.slice(0, lastColon);
    const secondColon = base.indexOf(":");
    if (secondColon <= 0) return false;
    const slug = base.slice(0, secondColon);
    const expStr = base.slice(secondColon + 1);
    if (slug !== shareSlug) return false;
    const exp = parseInt(expStr, 10);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    const secret = getSecret()!;
    const expected = createHmac("sha256", secret)
      .update(`${slug}:${exp}`)
      .digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export function isShareUnlockConfigured(): boolean {
  return getSecret() !== null;
}
