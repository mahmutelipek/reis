import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";
import { DesktopConnectClient } from "@/app/desktop/connect/DesktopConnectClient";

export default async function DesktopConnectPage() {
  if (!isClerkConfigured()) {
    redirect("/library");
  }

  const { userId } = await auth();
  if (!userId) {
    redirect(
      "/sign-in?redirect_url=" + encodeURIComponent("/desktop/connect"),
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <DesktopConnectClient />
    </div>
  );
}
