import { redirect } from "next/navigation";

/** Açılış doğrudan kütüphane; Clerk yoksa veya oturum yoksa orada mesaj / sign-in. */
export default function Home() {
  redirect("/library");
}
