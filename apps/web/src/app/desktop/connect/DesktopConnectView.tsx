"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DesktopConnectSessionPanel } from "@/app/desktop/connect/DesktopConnectSessionPanel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ConnectLoading() {
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

export function DesktopConnectView() {
  const { isLoaded, userId } = useAuth();
  const searchParams = useSearchParams();
  const authSignup = searchParams.get("auth") === "signup";

  if (!isLoaded) {
    return <ConnectLoading />;
  }

  if (!userId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>
              {authSignup ? "Hesap oluştur" : "Giriş yap"}
            </CardTitle>
            <CardDescription>
              {authSignup
                ? "macOS uygulaması bu hesapla web kütüphanene bağlanır."
                : "macOS uygulamasını web hesabınla eşlemek için oturum aç."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {authSignup ? (
              <SignUp
                routing="virtual"
                signInUrl="/desktop/connect"
                forceRedirectUrl="/desktop/connect"
              />
            ) : (
              <SignIn
                routing="virtual"
                signUpUrl="/desktop/connect?auth=signup"
                forceRedirectUrl="/desktop/connect"
              />
            )}
            <Link
              href="/library"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground",
              )}
            >
              Kütüphaneye dön
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <DesktopConnectSessionPanel />
    </div>
  );
}
