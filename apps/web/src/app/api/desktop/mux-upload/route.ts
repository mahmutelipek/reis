import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/nextjs/server";
import { createMuxDirectUploadForUser } from "@/lib/create-mux-upload";
import { isClerkConfigured } from "@/lib/clerk-config";

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
 * Masaüstü: öncelik `Authorization: Bearer <Clerk oturum JWT>` (uygulama tarayıcı girişi veya /desktop/token).
 * Yedek: `x-promptly-desktop-key` + DESKTOP_OWNER_CLERK_USER_ID (CI / tek kullanıcı).
 */
export async function POST(req: Request) {
  let userId: string | null = null;

  const authz = req.headers.get("authorization")?.trim();
  const bearer =
    authz && /^Bearer\s+\S+/i.test(authz)
      ? authz.replace(/^Bearer\s+/i, "").trim()
      : null;

  if (
    bearer &&
    isClerkConfigured() &&
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
      if (typeof sub === "string" && sub.length > 0) {
        userId = sub;
      }
    } catch {
      userId = null;
    }
  }

  if (!userId) {
    const key = req.headers.get(HEADER_LEGACY)?.trim();
    const expected = process.env.DESKTOP_APIKEY?.trim();
    const ownerId = process.env.DESKTOP_OWNER_CLERK_USER_ID?.trim();
    if (expected && ownerId && key === expected) {
      userId = ownerId;
    }
  }

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Yetkisiz: Masaüstünde «E-posta ile giriş yap» kullan veya /desktop/token ile jeton yapıştır. Geliştirici yedeği: x-promptly-desktop-key.",
      },
      { status: 401 },
    );
  }

  let title = "Untitled";
  try {
    const body = (await req.json()) as { title?: string };
    if (body.title?.trim()) title = body.title.trim().slice(0, 512);
  } catch {
    /* gövde opsiyonel */
  }

  try {
    const result = await createMuxDirectUploadForUser({
      userId,
      title,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload init failed";
    const status = msg.includes("MUX") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
