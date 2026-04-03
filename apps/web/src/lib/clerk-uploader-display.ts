import { clerkClient } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk-config";

export type UploaderDisplay = {
  name: string;
  imageUrl: string | null;
};

export async function getUploaderDisplay(
  userId: string,
): Promise<UploaderDisplay> {
  if (!isClerkConfigured()) {
    return { name: "Kullanıcı", imageUrl: null };
  }
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const name =
      user.username ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.primaryEmailAddress?.emailAddress ||
      "Kullanıcı";
    return { name, imageUrl: user.imageUrl || null };
  } catch {
    return { name: "Kullanıcı", imageUrl: null };
  }
}
