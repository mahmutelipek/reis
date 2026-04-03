type ClerkUserLike = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
} | null | undefined;

export function clerkDisplayName(user: ClerkUserLike): string {
  if (!user) return "Kullanıcı";
  const fn = user.firstName;
  const ln = user.lastName;
  if (fn || ln) return `${fn ?? ""} ${ln ?? ""}`.trim();
  return (
    user.username ??
    user.primaryEmailAddress?.emailAddress ??
    "Kullanıcı"
  );
}
