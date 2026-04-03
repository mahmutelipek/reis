import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function safeInternalRedirect(raw: string | undefined): string | undefined {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

type Props = { searchParams: Promise<{ redirect_url?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  if (!isClerkConfigured()) {
    redirect("/library");
  }

  const sp = await searchParams;
  const afterSign = safeInternalRedirect(sp.redirect_url) ?? "/library";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Giriş yap</CardTitle>
          <CardDescription>
            Promptly kütüphanene erişmek için oturum aç.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl={afterSign}
          />
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
