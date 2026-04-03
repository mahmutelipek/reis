import { NextResponse } from "next/server";
import { createMuxDirectUploadForUser } from "@/lib/create-mux-upload";
import { isClerkConfigured } from "@/lib/clerk-config";
import { resolveMuxUploadUserId } from "@/lib/mux-upload-auth";

export async function POST(req: Request) {
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { error: "Clerk is not configured" },
      { status: 503 },
    );
  }

  const userId = await resolveMuxUploadUserId(req);
  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Yetkisiz: Web’de oturum aç veya Bearer Clerk JWT / x-promptly-desktop-key (geliştirici) kullan.",
      },
      { status: 401 },
    );
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
