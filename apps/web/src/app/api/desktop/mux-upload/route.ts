import { NextResponse } from "next/server";
import { createMuxDirectUploadForUser } from "@/lib/create-mux-upload";

const HEADER = "x-promptly-desktop-key";

/**
 * Masaüstü uygulaması: paylaşılan gizli anahtar + sunucuda sabit Clerk user id.
 * Çok kullanıcılı dağıtımda anahtarı/sahibi yeniden düşünün.
 */
export async function POST(req: Request) {
  const key = req.headers.get(HEADER)?.trim();
  const expected = process.env.DESKTOP_APIKEY?.trim();
  const ownerId = process.env.DESKTOP_OWNER_CLERK_USER_ID?.trim();

  if (!expected || !ownerId) {
    return NextResponse.json(
      {
        error:
          "Desktop upload not configured (DESKTOP_APIKEY + DESKTOP_OWNER_CLERK_USER_ID)",
      },
      { status: 503 },
    );
  }

  if (!key || key !== expected) {
    return NextResponse.json({ error: "Invalid desktop key" }, { status: 401 });
  }

  let title = "Untitled";
  try {
    const body = (await req.json()) as { title?: string };
    if (body.title?.trim()) title = body.title.trim().slice(0, 512);
  } catch {
    /* optional body */
  }

  try {
    const result = await createMuxDirectUploadForUser({
      userId: ownerId,
      title,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload init failed";
    const status = msg.includes("MUX") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
