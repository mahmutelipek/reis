import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DesktopConnectView } from "@/app/desktop/connect/DesktopConnectView";
import { isClerkConfigured } from "@/lib/clerk-config";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

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
    redirect("/library");
  }

  return (
    <Suspense fallback={<Fallback />}>
      <DesktopConnectView />
    </Suspense>
  );
}
