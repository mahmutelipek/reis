import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/clerk-config";
import { DesktopSessionTokenPanel } from "@/components/DesktopSessionTokenPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masaüstü oturumu · Promptly",
  description: "Promptly macOS uygulaması için Clerk oturum jetonu.",
  robots: { index: false, follow: false },
};

export default async function DesktopTokenPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-muted-foreground">
        Clerk yapılandırılmadı.
      </div>
    );
  }

  const { userId, getToken } = await auth();
  if (!userId) {
    redirect(
      "/sign-in?redirect_url=" + encodeURIComponent("/desktop/token"),
    );
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  const token = await getToken();
  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-lg font-semibold">Masaüstü jetonu</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Oturum jetonu alınamadı. Çıkış yapıp tekrar giriş yapmayı deneyin.
        </p>
        <Link href="/library" className="mt-6 inline-block text-sm text-primary underline">
          Kütüphaneye dön
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Masaüstü uygulaması</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bu jeton, web’de şu anda giriş yaptığın Clerk hesabına bağlıdır. macOS
        uygulamasına yapıştırdığında yüklenen videolar{" "}
        <strong className="text-foreground">bu e-posta ile aynı kullanıcıya</strong>{" "}
        kaydedilir.
      </p>
      {email ? (
        <p className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Hesap: </span>
          <span className="font-medium text-foreground">{email}</span>
        </p>
      ) : null}

      <DesktopSessionTokenPanel token={token} />

      <p className="mt-8 text-xs text-muted-foreground">
        Jetonu kimseyle paylaşma. Süresi dolunca bu sayfayı yenileyip yenisini
        kopyala. Üretimde oturum süresi Clerk ayarlarına bağlıdır.
      </p>
      <Link href="/library" className="mt-6 inline-block text-sm text-primary underline">
        ← Kütüphane
      </Link>
    </div>
  );
}
