import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";

export async function GET() {
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { error: "Clerk is not configured" },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getDb()
    .select()
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.createdAt));

  return NextResponse.json({ videos: rows });
}
