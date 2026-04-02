# Promptly

Kurumsal async video + görünmez, ses-senkron teleprompter. Bu repo monorepo yapısında:

- **apps/web** — Next.js: kütüphane, paylaşım, Mux/Clerk/Drizzle
- **apps/desktop** — macOS (Swift): kayıt + prompter (alpha geliştiriliyor)
- **packages/shared** — paylaşılan TypeScript tipleri (ileride)

## Gereksinimler

- Node.js 20+
- npm (workspaces)
- macOS 13+ (masaüstü geliştirme için)

## Web

```bash
cp apps/web/.env.example apps/web/.env.local
# Clerk, DATABASE_URL, Mux anahtarlarını doldur

npm install
npm run dev
```

Uygulama varsayılan: [http://localhost:3000](http://localhost:3000)

Veritabanı şeması (Neon vb. bağlandıktan sonra):

```bash
cd apps/web && npm run db:push
```

**Not:** Clerk anahtarları olmadan da `npm run build` çalışır (kurulum mesajı gösterilir). Gerçek kullanım için `.env.local` şart.

**Mux webhooks** şu olayları içermeli: `video.asset.ready`, `video.asset.static_rendition.ready` (transcript için), `video.asset.errored`, `video.upload.cancelled`. Transcript için ayrıca `OPENAI_API_KEY` gerekir.

**İzleyici sayısı:** `/v/...` sayfası `POST /api/public/views` ile oturum başına bir kayıt günceller; kütüphanede “izleyici oturumu” bunu gösterir. Şema değişince `npm run db:push` tekrar çalıştır.

**Paylaşım şifresi:** kütüphanede videoya şifre verebilirsin; izleyici `/v/...` üzerinde doğrular. `SHARE_UNLOCK_SECRET` (≥16 karakter) `.env.local` içinde olmalı.

**Embed:** `/v/{slug}/embed` sadece oynatıcı içerir; `Content-Security-Policy: frame-ancestors *` ile harici sitelere gömülebilir. Tam iframe kodu kütüphanede kopyalanır (`NEXT_PUBLIC_APP_URL` gerekli).

**Prod kontrol listesi:** `.env` doldur, `db:push`, Mux webhooks, `SHARE_UNLOCK_SECRET` (şifreli paylaşım lazımsa), deploy ortamında `NEXT_PUBLIC_APP_URL` gerçek domain, `/api/health` ile canlılık kontrolü.

## Masaüstü

Ekran kaydı (ScreenCaptureKit) + ayrı Prompter penceresi; kayıtta uygulama pencereleri otomatik hariç tutulur. İlk çalıştırmada macOS ekran kaydı iznini isteyecek.

```bash
cd apps/desktop
swift build
open .build/debug/PromptlyDesktop
```

Xcode ile açmak için `Package.swift` içeren klasörü açın.

**Web’e yükleme:** Web tarafında `.env.local` içinde `DESKTOP_APIKEY` (rastgele güçlü bir string) ve `DESKTOP_OWNER_CLERK_USER_ID` (videoların bağlanacağı Clerk `user_…` kimliği) tanımlı olsun. Masaüstü uygulamasında **API kökü** (örn. `https://app.example.com` veya `http://localhost:3000`, sonunda `/` olmadan) ve **aynı** masaüstü anahtarı girilir. İsteğe bağlı **Kayıt bitince otomatik yükle** açılabilir; veya **Son kaydı yükle** ile elle gönderilir. Video, belirtilen Clerk kullanıcısının kütüphanesinde görünür (Mux işlendikten sonra).

## PRD

[Promptly_PRD_v1.0.docx.md](./Promptly_PRD_v1.0.docx.md)
