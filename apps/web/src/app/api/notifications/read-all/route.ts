import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { userNotifications } from "@/lib/db/schema";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  await getDb()
    .update(userNotifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)),
    );

  return NextResponse.json({ ok: true });
}
