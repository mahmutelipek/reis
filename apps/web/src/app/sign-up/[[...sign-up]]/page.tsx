import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";
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

export default async function SignUpPage({ searchParams }: Props) {
  if (!isClerkConfigured()) {
    redirect("/library");
  }

  const sp = await searchParams;
  const afterSign = safeInternalRedirect(sp.redirect_url) ?? "/library";
  const desktopConnect = afterSign.includes("from_desktop=1");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Hesap oluştur</CardTitle>
          <CardDescription>
            {desktopConnect
              ? "Hesabını oluştur; ardından Mac uygulamasına bağlanacaksın."
              : "Promptly ile async video kütüphaneni kullanmaya başla."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl={
              afterSign !== "/library"
                ? `/sign-in?redirect_url=${encodeURIComponent(afterSign)}`
                : "/sign-in"
            }
            forceRedirectUrl={afterSign}
          />
          <Link
            href="/library"
            className="inline-flex h-7 items-center justify-center rounded-md px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Kütüphaneye dön
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
