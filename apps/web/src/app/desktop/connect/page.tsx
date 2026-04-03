import { Suspense } from "react";
import { DesktopConnectView } from "@/app/desktop/connect/DesktopConnectView";
import { isClerkConfigured } from "@/lib/clerk-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function ClerkNotConfigured() {
  return (
    <div className="min-h-svh bg-[#f2f2f7] dark:bg-zinc-950">
      <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-10">
        <Card className="border bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Clerk ayarı yok</CardTitle>
            <CardDescription>
              Bu sayfa giriş için Clerk gerektirir. Vercel (veya sunucu) ortamına{" "}
              <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
              ve <code className="rounded bg-muted px-1 text-xs">CLERK_SECRET_KEY</code> ekleyip
              yeniden deploy et.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Anahtarlar yokken uygulama seni kütüphaneye atıyordu; masaüstü bağlantısı için bu yüzden
            giriş ekranı görünmüyordu.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Fallback() {
  return (
    <div className="min-h-svh bg-[#f2f2f7] dark:bg-zinc-950">
      <div className="mx-auto flex min-h-svh max-w-[440px] flex-col justify-center px-4 py-10">
        <Card className="border bg-card shadow-lg">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-sm text-muted-foreground">
            <div
              className="size-8 animate-pulse rounded-full bg-muted"
              aria-hidden
            />
            Yükleniyor…
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DesktopConnectPage() {
  if (!isClerkConfigured()) {
    return <ClerkNotConfigured />;
  }

  return (
    <Suspense fallback={<Fallback />}>
      <DesktopConnectView />
    </Suspense>
  );
}
