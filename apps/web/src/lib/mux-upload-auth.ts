import { auth, verifyToken } from "@clerk/nextjs/server";
import { verifyDesktopSessionToken } from "@/lib/desktop-session-token";

const HEADER_LEGACY = "x-promptly-desktop-key";

function authorizedParties(): string[] | undefined {
  const raw = process.env.CLERK_AUTHORIZED_PARTIES?.trim();
  if (raw) {
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length) return list;
  }
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")?.trim();
  if (app) return [app];
  return undefined;
}

/**
 * 1) Tarayıcı Clerk oturumu (çerez)
 * 2) Authorization: Bearer &lt;Clerk JWT&gt;
 * 3) Authorization: Bearer &lt;Promptly masaüstü oturumu&gt; (/desktop/connect)
 * 4) x-promptly-desktop-key + DESKTOP_OWNER_CLERK_USER_ID (geliştirici yedeği)
 */
export async function resolveMuxUploadUserId(req: Request): Promise<string | null> {
  const { userId: cookieUser } = await auth();
  if (cookieUser) return cookieUser;

  const authz = req.headers.get("authorization")?.trim();
  const bearer =
    authz && /^Bearer\s+\S+/i.test(authz)
      ? authz.replace(/^Bearer\s+/i, "").trim()
      : null;

  if (bearer) {
    const desktopUser = verifyDesktopSessionToken(bearer);
    if (desktopUser) return desktopUser;
  }

  if (
    bearer &&
    process.env.CLERK_SECRET_KEY &&
    bearer.length > 10
  ) {
    try {
      const parties = authorizedParties();
      const payload = await verifyToken(bearer, {
        secretKey: process.env.CLERK_SECRET_KEY,
        ...(parties?.length ? { authorizedParties: parties } : {}),
      });
      const sub = payload.sub;
      if (typeof sub === "string" && sub.length > 0) return sub;
    } catch {
      /* geçersiz jeton */
    }
  }

  const key = req.headers.get(HEADER_LEGACY)?.trim();
  const expected = process.env.DESKTOP_APIKEY?.trim();
  const ownerId = process.env.DESKTOP_OWNER_CLERK_USER_ID?.trim();
  if (expected && ownerId && key === expected) return ownerId;

  return null;
}
