import { NextResponse } from "next/server";

/** Yük dengeleyici / uptime kontrolleri için. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "promptly-web" });
}
