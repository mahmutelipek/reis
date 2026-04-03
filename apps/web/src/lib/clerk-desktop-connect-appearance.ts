import type { Appearance } from "@clerk/types";

/**
 * /desktop/connect — iOS Ayarlar / sistem formlarına yakın: üstte SSO, altta e-posta–şifre.
 * Clerk Dashboard’da Email/Password ve istediğin OAuth sağlayıcıları açık olmalı.
 */
export const clerkDesktopConnectAppearance: Appearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    shimmer: false,
  },
  variables: {
    borderRadius: "14px",
    fontSize: "17px",
    spacingUnit: "0.75rem",
    colorPrimary: "hsl(var(--primary))",
    colorText: "hsl(var(--foreground))",
    colorTextSecondary: "hsl(var(--muted-foreground))",
    colorBackground: "transparent",
    colorInputBackground: "hsl(var(--muted) / 0.65)",
    colorInputText: "hsl(var(--foreground))",
    colorNeutral: "hsl(var(--border))",
  },
  elements: {
    rootBox: "w-full mx-auto",
    card: "shadow-none border-0 bg-transparent p-0 gap-6",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsRoot: "flex flex-col gap-3 w-full mb-1",
    socialButtonsBlockButton:
      "h-[50px] rounded-[14px] text-[15px] font-medium border border-border bg-background hover:bg-muted/80 transition-colors",
    socialButtonsProviderIcon: "size-5",
    dividerRow: "my-5",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-[13px] px-2",
    formFieldRow: "gap-2",
    formFieldLabel: "text-[13px] font-medium text-foreground mb-1",
    formFieldInput:
      "h-[50px] rounded-[14px] text-[17px] px-4 border-0 bg-muted/50 ring-1 ring-border/80 focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/70",
    formFieldInputShowPasswordButton: "text-primary",
    formButtonPrimary:
      "h-[50px] rounded-[14px] text-[17px] font-semibold mt-2 shadow-sm",
    formButtonReset:
      "text-primary text-[15px] font-medium hover:opacity-80",
    footer: "mt-4 text-center text-[14px]",
    footerActionLink: "text-primary font-medium",
    identityPreviewText: "text-[15px]",
    formFieldErrorText: "text-[13px] text-destructive",
    alertText: "text-[14px]",
  },
};
