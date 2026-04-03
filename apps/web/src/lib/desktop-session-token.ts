import { createHmac, timingSafeEqual } from "node:crypto";

/** Bearer öneki: Clerk JWT değil, Promptly masaüstü oturumu. */
export const DESKTOP_SESSION_PREFIX = "pdtk1.";

type Payload = { sub: string; exp: number };

function getSecret(): string | null {
  const s = process.env.DESKTOP_SESSION_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

/**
 * Tarayıcıda giriş yapan kullanıcı için masaüstü yükleme API’sinde kullanılacak jeton.
 * Clerk JWT yerine sunucunun imzaladığı HMAC token (Bearer ile gönderilir).
 */
export function signDesktopSessionToken(userId: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 gün
  const payloadObj: Payload = { sub: userId, exp };
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${DESKTOP_SESSION_PREFIX}${payload}.${sig}`;
}

export function verifyDesktopSessionToken(token: string): string | null {
  const secret = getSecret();
  if (!secret || !token.startsWith(DESKTOP_SESSION_PREFIX)) return null;

  const rest = token.slice(DESKTOP_SESSION_PREFIX.length);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");

  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  let obj: Payload;
  try {
    obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Payload;
  } catch {
    return null;
  }

  if (typeof obj.sub !== "string" || !obj.sub || typeof obj.exp !== "number") {
    return null;
  }
  if (obj.exp < Math.floor(Date.now() / 1000)) return null;

  return obj.sub;
}
