import { Suspense } from "react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import { DesktopConnectView } from "@/app/desktop/connect/DesktopConnectView";
import { isClerkConfigured } from "@/lib/clerk-config";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

function Fallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </CardContent>
      </Card>
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
