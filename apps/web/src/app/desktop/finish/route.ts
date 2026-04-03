import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { desktopHandoffs } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";

const HANDOFF_TTL_MS = 5 * 60 * 1000;

function appOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")?.trim();
  if (env) return env;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

/**
 * Masaüstü giriş köprüsü: tarayıcıda Clerk oturumu varken açılır,
 * tek kullanımlı kod üretip `promptly://oauth?code=…` ile uygulamaya döner.
 */
export async function GET(req: Request) {
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { error: "Clerk yapılandırılmadı." },
      { status: 503 },
    );
  }

  const origin = appOrigin(req);
  const finishPath = "/desktop/finish";
  const signInUrl = `${origin}/sign-in?redirect_url=${encodeURIComponent(`${origin}${finishPath}`)}`;

  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.redirect(signInUrl);
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.redirect(signInUrl);
  }

  const id = randomUUID();
  const expiresAt = new Date(Date.now() + HANDOFF_TTL_MS);

  try {
    const db = getDb();
    await db.insert(desktopHandoffs).values({
      id,
      clerkJwt: token,
      expiresAt,
    });
  } catch (e) {
    console.error("desktop_handoffs insert", e);
    return NextResponse.json(
      { error: "Oturum köprüsü kaydedilemedi (veritabanı)." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(`promptly://oauth?code=${encodeURIComponent(id)}`);
}
