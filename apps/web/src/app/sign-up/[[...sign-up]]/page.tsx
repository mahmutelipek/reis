import { SignUp } from "@clerk/nextjs";
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

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    redirect("/library");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Hesap oluştur</CardTitle>
          <CardDescription>
            Promptly ile async video kütüphaneni kullanmaya başla.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/library"
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
