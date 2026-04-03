import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { signDesktopSessionToken } from "@/lib/desktop-session-token";

/** Tarayıcıda Clerk oturumu varken masaüstü için Bearer jetonu üretir. */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Oturum yok" }, { status: 401 });
  }

  const token = signDesktopSessionToken(userId);
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Sunucuda DESKTOP_SESSION_SECRET tanımlı değil (en az 16 karakter, rastgele).",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ token });
}
