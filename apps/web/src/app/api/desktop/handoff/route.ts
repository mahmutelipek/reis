import { NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { desktopHandoffs } from "@/lib/db/schema";

/**
 * Tek kullanımlı: masaüstü uygulaması `promptly://oauth?code=` sonrası JWT alır.
 * Kod UUID; HTTPS + kısa ömür + tek okuma.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id || id.length < 32) {
    return NextResponse.json({ error: "Geçersiz kod." }, { status: 400 });
  }

  try {
    const db = getDb();
    const now = new Date();

    const rows = await db
      .select()
      .from(desktopHandoffs)
      .where(
        and(
          eq(desktopHandoffs.id, id),
          isNull(desktopHandoffs.consumedAt),
          gt(desktopHandoffs.expiresAt, now),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { error: "Kod süresi dolmuş veya kullanılmış." },
        { status: 404 },
      );
    }

    await db
      .update(desktopHandoffs)
      .set({ consumedAt: now })
      .where(eq(desktopHandoffs.id, id));

    return NextResponse.json({ token: row.clerkJwt });
  } catch (e) {
    console.error("handoff GET", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
