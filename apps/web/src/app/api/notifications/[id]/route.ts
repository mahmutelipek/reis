import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { userNotifications } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [n] = await db
    .select({
      id: userNotifications.id,
      userId: userNotifications.userId,
    })
    .from(userNotifications)
    .where(eq(userNotifications.id, id))
    .limit(1);

  if (!n || n.userId !== userId) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  await db
    .update(userNotifications)
    .set({ readAt: new Date() })
    .where(eq(userNotifications.id, id));

  return NextResponse.json({ ok: true });
}
