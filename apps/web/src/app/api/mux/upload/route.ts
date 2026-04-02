import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createMuxDirectUploadForUser } from "@/lib/create-mux-upload";
import { isClerkConfigured } from "@/lib/clerk-config";

export async function POST(req: Request) {
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

  let title: string | undefined;
  try {
    const body = (await req.json()) as { title?: string };
    title = body.title;
  } catch {
    /* body optional */
  }

  try {
    const result = await createMuxDirectUploadForUser({ userId, title });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload init failed";
    const status = msg.includes("MUX") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
